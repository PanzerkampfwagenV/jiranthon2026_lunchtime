import { CANDIDATE_PLACES } from './data/places.js';
import { estimateTravelMinutes, haversineKm } from './geo.js';
import { isLlmAvailable, recommendWithLlm } from './llm.js';
import { searchPlace, isKakaoSearchAvailable, reverseGeocode } from './kakao.js';
import { fetchOsrmRoute, isOsrmSupported } from './osrm.js';
import type { Place, RecommendationRequest } from './types.js';

/** 추천 결과 최대 개수 */
const MAX_RESULTS = 12;

interface ScoredPlace {
  place: Place;
  score: number;
}

/** 추천 결과 + 태그 대체 여부 */
export interface RecommendationResult {
  places: Place[];
  /**
   * 요청에 태그가 있었지만 근처에 일치하는 장소가 없어 다른 장소로
   * 대체했는지 여부. 태그 요청이 없었으면 항상 false.
   */
  tagFallback: boolean;
}

/**
 * 추천 진입점. 조건에 맞는 장소 목록을 계산한다.
 *
 * - Claude API 키가 있으면 LLM 기반 추천을 시도한다.
 * - 키가 없거나 LLM/좌표 보정에 실패하면 규칙 기반 추천으로 폴백한다.
 */
export async function recommendPlaces(
  req: RecommendationRequest,
): Promise<RecommendationResult> {
  const hasTags = Boolean(req.tags && req.tags.length > 0);

  if (isLlmAvailable()) {
    try {
      // 출발지의 행정구역명을 구해 LLM이 지역을 정확히 인지하도록 한다.
      const originLabel = (await reverseGeocode(req.location)) ?? undefined;

      const llmPlaces = await recommendWithLlm({
        originLabel,
        origin: req.location,
        availableMinutes: req.availableMinutes,
        mode: req.mode,
        tags: req.tags,
        tripType: req.tripType ?? 'roundtrip',
      });

      const resolved = await resolveLlmPlaces(req, llmPlaces);
      if (resolved.places.length > 0) {
        const places = await refineWithOsrm(req, resolved.places);
        return {
          places,
          tagFallback: hasTags && !resolved.hasTagMatch,
        };
      }
      // LLM 결과를 좌표/시간 조건으로 걸러 아무것도 안 남으면 폴백.
    } catch (err) {
      console.error('[recommendation] LLM 추천 실패, 규칙 기반으로 폴백:', err);
    }
  }

  const ruleResult = recommendByRules(req);
  const places = await refineWithOsrm(req, ruleResult.places);
  return {
    places,
    tagFallback: hasTags && !ruleResult.hasTagMatch,
  };
}

/**
 * 프론트에서 보낸 음식 종류 태그(한식/중식/일식/양식/샐러드/커피·카페/디저트/분식)를
 * 카카오 카테고리 문자열(예: "음식점 > 한식", "카페")에서 찾을 수 있는 키워드로 매핑한다.
 * 카카오는 세부 요리 종류(한식/중식 등)까지 정확히 구분해주지 않고 "음식점"처럼
 * 상위 카테고리만 주는 경우가 많아, 요리 계열 태그는 "음식점" 자체도 매칭으로 인정한다.
 */
const TAG_CATEGORY_KEYWORDS: Record<string, string[]> = {
  한식: ['한식', '음식점'],
  중식: ['중식', '중국', '음식점'],
  일식: ['일식', '돈까스', '일본', '음식점'],
  양식: ['양식', '패밀리레스토랑', '스테이크', '파스타', '음식점'],
  샐러드: ['샐러드', '음식점'],
  '커피/카페': ['카페', '커피'],
  디저트: ['디저트', '베이커리', '제과', '카페'],
  분식: ['분식', '음식점'],
};

/**
 * 카카오에서 실제로 받아온 카테고리(category_group_name/category_name)가
 * 요청 태그와 일치하는지 판단한다. 태그 문자열이 카테고리 안에 그대로
 * 포함되거나, 매핑 테이블의 키워드가 포함되면 일치로 본다.
 */
function matchesTagByCategory(
  kakaoCategory: string,
  tags?: string[],
): boolean {
  if (!tags || tags.length === 0) return false;
  const normalized = kakaoCategory.toLowerCase();
  return tags.some((tag) => {
    if (normalized.includes(tag.toLowerCase())) return true;
    const keywords = TAG_CATEGORY_KEYWORDS[tag] ?? [];
    return keywords.some((kw) => normalized.includes(kw.toLowerCase()));
  });
}

/**
 * 최종 추천 목록(최대 MAX_RESULTS개)에 대해서만 OSRM으로 실제 도로 기반
 * 거리를 재계산해 덮어쓴다. 후보 스코어링 단계는 haversine 추정치를
 * 그대로 사용해 빠르게 유지하고, 사용자에게 노출되는 최종 결과만 정확도를 높인다.
 *
 * 이동시간은 OSRM의 duration이 아니라 보정된 거리에 estimateTravelMinutes를
 * 다시 적용해 계산한다.
 *
 * - driving만 대상으로 한다. walking은 OSRM 공개 데모 서버의 foot 프로필이
 *   도심의 등산로·보행로를 인식하지 못해 haversine 직선거리보다 훨씬 긴
 *   차도 우회 경로를 잡는 경우가 많아(예: 실측 1.9km 구간을 4.6km로 산출),
 *   자투리 시간 필터에서 실제로 걸어갈 수 있는 장소까지 전부 걸러지는
 *   회귀가 있어 제외했다. transit도 OSRM이 지원하지 않아 건드리지 않는다.
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
  suggestions: {
    name: string;
    category: string;
    description: string;
    matchesTag: boolean;
  }[],
): Promise<{ places: Place[]; hasTagMatch: boolean }> {
  const { location, availableMinutes, mode, tripType } = req;
  const isRoundtrip = (tripType ?? 'roundtrip') === 'roundtrip';

  // 좌표 보정은 카카오 REST 키가 있을 때만 가능하다.
  if (!isKakaoSearchAvailable()) {
    return { places: [], hasTagMatch: false };
  }

  const resolved = await Promise.all(
    suggestions.map(async (s, index) => {
      try {
        const kakao = await searchPlace(s.name, location);
        if (!kakao) return null;

        const distanceKm = haversineKm(location, kakao.location);

        // LLM이 출발지 자체(또는 출발지와 사실상 같은 지점)를 추천 장소로
        // 다시 제안하는 경우가 있다(예: 출발지가 "OO역"일 때 "OO역"을 추천).
        // 이동거리가 사실상 0이면 "자투리 시간 내 다녀올 곳"이라는 취지에
        // 맞지 않으므로 제외한다.
        const MIN_DISTANCE_KM = 0.1;
        if (distanceKm < MIN_DISTANCE_KM) {
          return null;
        }

        const travelMinutes = estimateTravelMinutes(distanceKm, mode);
        const requiredMinutes = isRoundtrip
          ? travelMinutes * 2
          : travelMinutes;

        if (requiredMinutes >= availableMinutes) {
          return null;
        }

        const place: Place & { matchesTag: boolean } = {
          id: `llm-${index}`,
          name: kakao.name,
          category: s.category || kakao.category,
          lat: kakao.location.lat,
          lng: kakao.location.lng,
          travelMinutes,
          distanceKm: Math.round(distanceKm * 10) / 10,
          description: s.description || undefined,
          // 최종 판정은 카카오에서 실제로 받아온 카테고리만 신뢰한다.
          // LLM이 표시한 matchesTag는 상호명만 보고 추측한 값이라 부정확한
          // 경우가 많아(예: "한식" 태그에 카페거리를 true로 표시) 사용하지 않는다.
          matchesTag: matchesTagByCategory(kakao.category, req.tags),
        };
        console.error(
          `[debug] "${kakao.name}" kakaoCategory="${kakao.category}" tags=${JSON.stringify(req.tags)} matchesTag=${place.matchesTag}`,
        );
        return place;
      } catch (err) {
        console.error(`[recommendation] "${s.name}" 좌표 보정 실패:`, err);
        return null;
      }
    }),
  );

  const places = resolved.filter(
    (p): p is Place & { matchesTag: boolean } => p !== null,
  );

  // 같은 장소(좌표 근접)가 중복 추천되는 경우 제거한다.
  const seen = new Set<string>();
  const unique = places.filter((p) => {
    const key = `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  unique.sort((a, b) => a.travelMinutes - b.travelMinutes);
  const hasTagMatch = unique.some((p) => p.matchesTag);
  const finalPlaces = unique.slice(0, MAX_RESULTS).map(
    ({ matchesTag, ...place }) => place,
  );
  return { places: finalPlaces, hasTagMatch };
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
export function recommendByRules(
  req: RecommendationRequest,
): { places: Place[]; hasTagMatch: boolean } {
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
  const places = scored.slice(0, MAX_RESULTS).map((s) => s.place);

  // CANDIDATE_PLACES 시드 데이터는 음식 관련 태그(예: 한식/카페 등)를
  // 거의 보유하지 않아, 태그 요청이 있어도 실질적으로 항상 매칭되지 않는다.
  // 이 경우 tagFallback으로 표시되어 프론트에서 대체 안내를 보여준다.
  const hasTagMatch =
    requestedTags.size === 0
      ? true
      : CANDIDATE_PLACES.some(
          (c) =>
            places.some((p) => p.id === c.id) &&
            c.tags.some((t) => requestedTags.has(t)),
        );

  return { places, hasTagMatch };
}
