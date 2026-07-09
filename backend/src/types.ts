// 자투리 시간 여행 추천 - 백엔드 공용 타입
// docs/product-requirements.md 의 3. API 계약(Contract) 기준

/** 위도/경도 좌표 */
export interface LatLng {
  lat: number;
  lng: number;
}

/** 이동 수단 */
export type TravelMode = 'walking' | 'transit' | 'driving';

/** 편도/왕복 */
export type TripType = 'oneway' | 'roundtrip';

/** 추천 요청 (POST /api/recommendations) */
export interface RecommendationRequest {
  location: LatLng;
  availableMinutes: number;
  mode: TravelMode;
  tags?: string[];
  tripType?: TripType;
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

/** 에러 코드 */
export type ErrorCode = 'INVALID_INPUT' | 'NO_RESULT' | 'UPSTREAM_ERROR';

/** 에러 응답 규격 */
export interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
  };
}
