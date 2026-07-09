// 자투리 시간 여행 추천 - 공용 타입 정의
// docs/product-requirements.md 의 3. API 계약(Contract) 기준

/** 위도/경도 좌표 */
export interface LatLng {
  lat: number;
  lng: number;
}

/** 이동 수단 */
export type TravelMode = 'walking' | 'transit' | 'driving';

/** 선택된 위치 정보 (좌표 + 표시용 라벨) */
export interface SelectedLocation {
  coords: LatLng;
  /** 사용자에게 보여줄 위치 이름/주소 (예: "현재 위치", "서울시청") */
  label: string;
  /** GPS로 얻은 위치인지 여부 */
  fromGps: boolean;
}

/** 추천 요청 (POST /api/recommendations) */
export interface RecommendationRequest {
  location: LatLng;
  availableMinutes: number;
  mode: TravelMode;
}

/** 추천된 장소 */
export interface Place {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  travelMinutes: number;
  distanceKm: number;
  thumbnail?: string;
  description?: string;
}

/** 추천 응답 */
export interface RecommendationResponse {
  places: Place[];
}

/** GET /api/route 응답: 두 지점 간 경로와 실제(또는 추정) 소요시간/거리 */
export interface RouteResult {
  /** 지도에 그릴 경로 좌표 목록 (출발지 → 도착지 순서) */
  path: LatLng[];
  /** 실제(또는 추정) 소요시간(분) */
  durationMinutes: number;
  /** 실제(또는 추정) 거리(km) */
  distanceKm: number;
  /** 실제 도로 경로를 가져왔는지 여부 (false면 직선 대체) */
  isActualRoute: boolean;
}

/** GET /api/place-detail 응답: LLM 기반 장소 상세 정보 */
export interface PlaceDetailInfo {
  /** 이곳에서 할 수 있는 활동 목록 */
  activities: string[];
  /** 유명한 것/포토스팟 등 하이라이트 */
  highlights: string[];
  /** 상세 소개 */
  summary: string;
  /** LLM으로 생성됐는지 여부 (false면 정적 폴백) */
  generated: boolean;
}
