import type { LatLng, TravelMode, RouteResult } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * 출발지→도착지 경로를 조회한다.
 * - 백엔드 미설정(Mock 모드) 시 직선 대체 경로를 반환한다.
 * - driving은 백엔드에서 Kakao Mobility 실제 경로/시간을 받아온다.
 * - walking/transit은 백엔드도 직선 대체를 반환한다(Kakao 미제공).
 */
export async function fetchRoute(
  origin: LatLng,
  destination: LatLng,
  mode: TravelMode,
): Promise<RouteResult> {
  if (!API_BASE_URL) {
    return straightLineFallback(origin, destination);
  }

  const params = new URLSearchParams({
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    mode,
  });

  const res = await fetch(`${API_BASE_URL}/api/route?${params.toString()}`);
  if (!res.ok) {
    // 경로 조회 실패는 지도 표시에 치명적이지 않으므로 직선으로 대체한다.
    return straightLineFallback(origin, destination);
  }

  return (await res.json()) as RouteResult;
}

function straightLineFallback(origin: LatLng, destination: LatLng): RouteResult {
  return {
    path: [origin, destination],
    durationMinutes: 0,
    distanceKm: 0,
    isActualRoute: false,
  };
}
