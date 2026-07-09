import { CANDIDATE_PLACES } from './data/places.js';
import { estimateTravelMinutes, haversineKm } from './geo.js';
import { isLlmAvailable, recommendWithLlm } from './llm.js';
import { searchPlace, isKakaoSearchAvailable } from './kakao.js';
import { fetchOsrmRoute, isOsrmSupported } from './osrm.js';
import type { Place, RecommendationRequest } from './types.js';

/** 추천 결과 최대 개수 */
const MAX_RESULTS = 12;

interface ScoredPlace {
  place: Place;
  score: number;
}

/**
 * 추천 진입점. 조건에 맞는 장소 목록을 계산한다.
 *
 * - Claude API 키가 있으면 LLM 기반 추천을 시도한다.
 * - 키가 없거나 LLM/좌표 보정에 실패하면 규칙 기반 추천으로 폴백한다.
 */
export async function recommendPlaces(
  req: RecommendationRequest,
): Promise<Place[]> {
  if (isLlmAvailable()) {
    try {
      const llmPlaces = await recommendWithLlm({
        origin: req.location,
        availableMinutes: req.availableMinutes,
        mode: req.mode,
        tags: req.tags,
        tripType: req.tripType ?? 'roundtrip',
      });

      const places = await resolveLlmPlaces(req, llmPlaces);
      if (places.length > 0) {
        return await refineWithOsrm(req, places);
      }
      // LLM 결과를 좌표/시간 조건으로 걸러 아무것도 안 남으면 폴백.
    } catch (err) {
      console.error('[recommendation] LLM 추천 실패, 규칙 기반으로 폴백:', err);
    }
  }

  const places = recommendByRules(req);
  return await refineWithOsrm(req, places);
}

/**
 * 최종 추천 목록(최대 MAX_RESULTS개)에 대해서만 OSRM으로 실제 도로 기반
 * 거리를 재계산해 덮어쓴다. 후보 스코어링 단계는 haversine 추정치를
 * 그대로 사용해 빠르게 유지하고, 사용자에게 노출되는 최종 결과만 정확도를 높인다.
 *
 * 이동시간은 OSRM의 duration이 아니라 보정된 거리에 estimateTravelMinutes를
 * 다시 적용해 계산한다. OSRM 공개 데모 서버의 foot/bike 프로필은 표준
 * osrm-backend 프로필과 달라 도보 duration이 비정상적으로 짧게 나오는
 * 경우가 있어(예: 400m를 30초) 신뢰할 수 없기 때문이다(거리는 신뢰 가능).
 *
 * - transit 모드는 OSRM이 지원하지 않아 건드리지 않는다.
 * - OSRM 호출이 실패(네트워크/타임아웃 등)하면 해당 장소는 기존 추정치를 그대로 유지한다.
 * - OSRM_BASE_URL 미설정 시에도 공개 데모 서버로 동작하므로 별도 설정 없이 사용 가능하다.
 */
async function refineWithOsrm(
  req: RecommendationRequest,
  places: Place[],
): Promise<Place[]> {
  const { location, mode, availableMinutes, tripType } = req;
  if (!isOsrmSupported(mode)) return places;

  const isRoundtrip = (tripType ?? 'roundtrip') === 'roundtrip';

  const refined = await Promise.all(
    places.map(async (place) => {
      const route = await fetchOsrmRoute(
        location,
        { lat: place.lat, lng: place.lng },
        mode,
      );
      if (!route) return place;

      const distanceKm = Math.round(route.distanceKm * 10) / 10;
      return {
        ...place,
        distanceKm,
        travelMinutes: estimateTravelMinutes(distanceKm, mode),
      };
    }),
  );

  // OSRM 보정 결과로 왕복/편도 시간이 자투리 시간을 초과하게 된 장소는 제외한다.
  const filtered = refined.filter((p) => {
    const required = isRoundtrip ? p.travelMinutes * 2 : p.travelMinutes;
    return required < availableMinutes;
  });

  return filtered;
}

/**
 * Claude가 제안한 장소명을 카카오 검색으로 좌표 보정하고,
 * 자투리 시간 도달 가능 여부로 필터링한다.
 */
async function resolveLlmPlaces(
  req: RecommendationRequest,
  suggestions: { name: string; category: string; description: string }[],
): Promise<Place[]> {
  const { location, availableMinutes, mode, tripType } = req;
  const isRoundtrip = (tripType ?? 'roundtrip') === 'roundtrip';

  // 좌표 보정은 카카오 REST 키가 있을 때만 가능하다.
  if (!isKakaoSearchAvailable()) {
    return [];
  }

  const resolved = await Promise.all(
    suggestions.map(async (s, index) => {
      try {
        const kakao = await searchPlace(s.name, location);
        if (!kakao) return null;

        const distanceKm = haversineKm(location, kakao.location);
        const travelMinutes = estimateTravelMinutes(distanceKm, mode);
        const requiredMinutes = isRoundtrip
          ? travelMinutes * 2
          : travelMinutes;

        if (requiredMinutes >= availableMinutes) {
          return null;
        }

        const place: Place = {
          id: `llm-${index}`,
          name: kakao.name,
          category: s.category || kakao.category,
          lat: kakao.location.lat,
          lng: kakao.location.lng,
          travelMinutes,
          distanceKm: Math.round(distanceKm * 10) / 10,
          description: s.description || undefined,
        };
        return place;
      } catch (err) {
        console.error(`[recommendation] "${s.name}" 좌표 보정 실패:`, err);
        return null;
      }
    }),
  );

  const places = resolved.filter((p): p is Place => p !== null);

  // 같은 장소(좌표 근접)가 중복 추천되는 경우 제거한다.
  const seen = new Set<string>();
  const unique = places.filter((p) => {
    const key = `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  unique.sort((a, b) => a.travelMinutes - b.travelMinutes);
  return unique.slice(0, MAX_RESULTS);
}

/**
 * 규칙 기반 추천 (폴백).
 *
 * 1. 각 후보의 편도 이동시간을 추정한다.
 * 2. 자투리 시간 내 도달 가능 여부로 필터링한다.
 *    - roundtrip: 왕복(편도×2)이 availableMinutes 이내여야 한다.
 *    - oneway: 편도가 availableMinutes 이내여야 한다.
 * 3. 이동시간·거리·태그 일치도로 스코어링하여 정렬한다.
 */
export function recommendByRules(req: RecommendationRequest): Place[] {
  const { location, availableMinutes, mode, tags, tripType } = req;
  const requestedTags = new Set(tags ?? []);
  const isRoundtrip = (tripType ?? 'roundtrip') === 'roundtrip';

  const scored: ScoredPlace[] = [];

  for (const candidate of CANDIDATE_PLACES) {
    const distanceKm = haversineKm(location, candidate.location);
    const travelMinutes = estimateTravelMinutes(distanceKm, mode);
    const requiredMinutes = isRoundtrip ? travelMinutes * 2 : travelMinutes;

    // 이동에 자투리 시간을 모두 써버리면 체류 시간이 없으므로 제외한다.
    if (requiredMinutes >= availableMinutes) {
      continue;
    }

    // 태그 일치 개수 (요청 태그가 없으면 0)
    const tagMatches =
      requestedTags.size === 0
        ? 0
        : candidate.tags.filter((t) => requestedTags.has(t)).length;

    // 스코어: 이동시간이 짧을수록, 태그가 많이 맞을수록 높게.
    // 남은 체류 시간 비율(0~1)에 태그 보너스를 더한다.
    const remainingRatio = 1 - requiredMinutes / availableMinutes;
    const tagBonus = tagMatches * 0.5;
    const score = remainingRatio + tagBonus;

    scored.push({
      place: {
        id: candidate.id,
        name: candidate.name,
        category: candidate.category,
        lat: candidate.location.lat,
        lng: candidate.location.lng,
        travelMinutes,
        distanceKm: Math.round(distanceKm * 10) / 10,
        thumbnail: candidate.thumbnail,
        description: candidate.description,
      },
      score,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, MAX_RESULTS).map((s) => s.place);
}
