import type { LatLng, TravelMode } from './types.js';

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** 두 좌표 간 대원 거리(km)를 Haversine 공식으로 계산한다. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * 이동수단별 평균 속도(km/h).
 * 외부 길찾기 API 미연동 상태의 추정치. 도심 실측 기반 근사값.
 */
const AVG_SPEED_KMH: Record<TravelMode, number> = {
  walking: 4.5,
  transit: 18,
  driving: 22,
};

/** 직선거리를 실제 경로에 근사시키기 위한 우회 보정 계수 */
const DETOUR_FACTOR: Record<TravelMode, number> = {
  walking: 1.25,
  transit: 1.4,
  driving: 1.3,
};

/**
 * 직선거리와 이동수단으로 편도 이동시간(분)을 추정한다.
 * TODO(개발자 C): Kakao 길찾기 API 연동 시 실제 소요시간으로 대체.
 */
export function estimateTravelMinutes(
  distanceKm: number,
  mode: TravelMode,
): number {
  const effectiveKm = distanceKm * DETOUR_FACTOR[mode];
  const minutes = (effectiveKm / AVG_SPEED_KMH[mode]) * 60;
  return Math.round(minutes);
}
