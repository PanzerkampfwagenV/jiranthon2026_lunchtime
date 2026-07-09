import type { LatLng, TravelMode } from './types.js';
import { haversineKm } from './geo.js';

/** 경로 좌표 목록 + 실제 소요시간/거리 */
export interface RouteResult {
  /** 지도에 그릴 경로 좌표 목록 (출발지 → 도착지 순서) */
  path: LatLng[];
  /** 실제(또는 추정) 소요시간(분) */
  durationMinutes: number;
  /** 실제(또는 추정) 거리(km) */
  distanceKm: number;
  /** 실제 도로 경로를 가져왔는지 여부. false면 직선 대체. */
  isActualRoute: boolean;
}

const KAKAO_DIRECTIONS_URL =
  'https://apis-navi.kakaomobility.com/v1/directions';

interface KakaoDirectionsResponse {
  routes: {
    result_code: number;
    summary: { distance: number; duration: number }; // m, s
    sections: {
      roads: { vertexes: number[] }[];
    }[];
  }[];
}

/**
 * 두 지점 간 경로를 계산한다.
 * - driving: Kakao Mobility 자동차 길찾기 API로 실제 도로 경로/시간을 가져온다.
 * - walking/transit: Kakao Mobility가 도보·대중교통 경로를 제공하지 않으므로
 *   직선(대체) 경로를 반환한다.
 */
export async function getRoute(
  origin: LatLng,
  destination: LatLng,
  mode: TravelMode,
): Promise<RouteResult> {
  if (mode === 'driving') {
    const restKey = process.env.KAKAO_REST_API_KEY;
    if (restKey) {
      try {
        return await fetchDrivingRoute(origin, destination, restKey);
      } catch (err) {
        console.error('[route] 자동차 길찾기 실패, 직선으로 대체:', err);
      }
    }
  }

  return straightLineRoute(origin, destination, mode);
}

/** Kakao Mobility 자동차 길찾기 호출 */
async function fetchDrivingRoute(
  origin: LatLng,
  destination: LatLng,
  restKey: string,
): Promise<RouteResult> {
  const params = new URLSearchParams({
    origin: `${origin.lng},${origin.lat}`,
    destination: `${destination.lng},${destination.lat}`,
  });

  const res = await fetch(`${KAKAO_DIRECTIONS_URL}?${params.toString()}`, {
    headers: { Authorization: `KakaoAK ${restKey}` },
  });
  if (!res.ok) {
    throw new Error(`Kakao 길찾기 실패: ${res.status}`);
  }

  const data = (await res.json()) as KakaoDirectionsResponse;
  const route = data.routes[0];
  if (!route || route.result_code !== 0) {
    throw new Error('경로를 찾을 수 없습니다.');
  }

  // vertexes는 [x1, y1, x2, y2, ...] 형태의 평탄화된 좌표 배열
  const path: LatLng[] = [];
  for (const section of route.sections) {
    for (const road of section.roads) {
      const v = road.vertexes;
      for (let i = 0; i < v.length; i += 2) {
        path.push({ lat: v[i + 1], lng: v[i] });
      }
    }
  }

  return {
    path: path.length > 0 ? path : [origin, destination],
    durationMinutes: Math.round(route.summary.duration / 60),
    distanceKm: Math.round((route.summary.distance / 1000) * 10) / 10,
    isActualRoute: true,
  };
}

/** 실제 경로 API를 쓸 수 없을 때의 직선 대체 경로 */
function straightLineRoute(
  origin: LatLng,
  destination: LatLng,
  mode: TravelMode,
): RouteResult {
  const distanceKm = haversineKm(origin, destination);
  const AVG_SPEED_KMH: Record<TravelMode, number> = {
    walking: 4.5,
    transit: 18,
    driving: 22,
  };
  const durationMinutes = Math.round((distanceKm / AVG_SPEED_KMH[mode]) * 60);

  return {
    path: [origin, destination],
    durationMinutes,
    distanceKm: Math.round(distanceKm * 10) / 10,
    isActualRoute: false,
  };
}
