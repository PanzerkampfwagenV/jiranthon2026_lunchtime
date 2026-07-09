import { CANDIDATE_PLACES } from './data/places.js';
import { estimateTravelMinutes, haversineKm } from './geo.js';
import type { Place, RecommendationRequest } from './types.js';

/** 추천 결과 최대 개수 */
const MAX_RESULTS = 12;

interface ScoredPlace {
  place: Place;
  score: number;
}

/**
 * 요청 조건에 맞는 추천 장소 목록을 계산한다.
 *
 * 1. 각 후보의 편도 이동시간을 추정한다.
 * 2. 자투리 시간 내 도달 가능 여부로 필터링한다.
 *    - roundtrip: 왕복(편도×2)이 availableMinutes 이내여야 한다.
 *    - oneway: 편도가 availableMinutes 이내여야 한다.
 * 3. 이동시간·거리·태그 일치도로 스코어링하여 정렬한다.
 */
export function recommendPlaces(req: RecommendationRequest): Place[] {
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
