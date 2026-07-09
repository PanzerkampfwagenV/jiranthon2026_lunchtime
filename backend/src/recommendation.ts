import { CANDIDATE_PLACES } from './data/places.js';
import { estimateTravelMinutes, haversineKm } from './geo.js';
import { isLlmAvailable, recommendWithLlm } from './llm.js';
import { searchPlace, isKakaoSearchAvailable } from './kakao.js';
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
        return places;
      }
      // LLM 결과를 좌표/시간 조건으로 걸러 아무것도 안 남으면 폴백.
    } catch (err) {
      console.error('[recommendation] LLM 추천 실패, 규칙 기반으로 폴백:', err);
    }
  }

  return recommendByRules(req);
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
