import type {
  RecommendationRequest,
  RecommendationResponse,
  Place,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/** 백엔드가 아직 없을 때 사용하는 Mock 추천 데이터 */
const MOCK_PLACES: Place[] = [
  {
    id: 'p1',
    name: '남산공원',
    category: '공원',
    lat: 37.5512,
    lng: 126.9882,
    travelMinutes: 20,
    distanceKm: 5.2,
    description: '서울 도심 속 자연을 즐길 수 있는 대표 공원.',
  },
  {
    id: 'p2',
    name: '북촌한옥마을',
    category: '명소',
    lat: 37.5826,
    lng: 126.9831,
    travelMinutes: 25,
    distanceKm: 3.1,
    description: '전통 한옥이 밀집한 서울의 대표 관광지.',
  },
  {
    id: 'p3',
    name: '청계천',
    category: '산책',
    lat: 37.5696,
    lng: 126.9789,
    travelMinutes: 10,
    distanceKm: 1.4,
    description: '도심을 가로지르는 산책하기 좋은 하천.',
  },
];

/**
 * 추천 요청. 현재는 Mock 응답을 반환하며,
 * VITE_API_BASE_URL 이 설정되면 실제 백엔드로 요청한다.
 */
export async function fetchRecommendations(
  req: RecommendationRequest,
): Promise<RecommendationResponse> {
  if (!API_BASE_URL) {
    // Mock 모드: 자투리 시간 내 도달 가능한 장소만 필터링 (편도 기준)
    await new Promise((resolve) => setTimeout(resolve, 500));
    const places = MOCK_PLACES.filter(
      (p) => p.travelMinutes <= req.availableMinutes,
    );
    // Mock 데이터는 음식 관련 카테고리가 없어 태그 요청 시 항상 대체된 것으로 처리한다.
    const tagFallback = Boolean(req.tags && req.tags.length > 0);
    return { places, tagFallback };
  }

  const res = await fetch(`${API_BASE_URL}/api/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    // 백엔드 에러 규격: { error: { code, message } }
    const body = (await res.json().catch(() => null)) as {
      error?: { code?: string; message?: string };
    } | null;
    const code = body?.error?.code;

    // 도달 가능한 장소가 없는 경우: Mock 모드와 동일하게 빈 결과로 처리해
    // 결과 화면의 "조건에 맞는 장소가 없어요" 빈 상태 UI를 보여준다.
    if (code === 'NO_RESULT') {
      return { places: [], tagFallback: false };
    }

    throw new Error(body?.error?.message ?? `추천 요청 실패: ${res.status}`);
  }

  return (await res.json()) as RecommendationResponse;
}
