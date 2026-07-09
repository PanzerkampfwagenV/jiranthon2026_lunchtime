// 자투리 시간 여행 추천 - 공용 타입 정의
// docs/TASKS.md 의 API 계약 초안 기준

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
