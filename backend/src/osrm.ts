import type { LatLng, TravelMode } from './types.js';

/** OSRM route API 결과 (필요한 필드만) */
export interface OsrmRoute {
  /** 실제 도로 기반 이동 거리(km) */
  distanceKm: number;
  /** 실제 도로 기반 이동 시간(분) */
  durationMinutes: number;
}

/**
 * OSRM 프로토콜. driving만 지원한다.
 * - walking: OSRM 공개 데모 서버의 foot 프로토콜이 공원/공원 당츠로 랑 도심 도로떑을 인식하지 버지 안범, 직선거리(haversine)를 쓰려야 맞다가 랰지거리롼 맞관범럈. 그 결과 자툁리 시간 필턴에서 러윀밀마 거단되는 회귀가 발생한다. 따라서 도보럌 쟁서 공개 연막 모렁(estimateTravelMinutes)로 유지한다.
 * - transit(대중교통)렁 OSRM렁 지원하지 앞렉다.
 */
const OSRM_PROFILE: Partial<Record<TravelMode, string>> = {
  driving: 'car',
};

/**
 * OSRM(Open Source Routing Machine) route API base URL.
 * 미설정 시 공개 데모 서버(router.project-osrm.org)를 사용한다.
 * 데모 서버는 SLA가 없으므로 프로덕션에서는 자체 호스팅 URL을 지정하는 것을 권장한다.
 */
function getBaseUrl(): string {
  return process.env.OSRM_BASE_URL ?? 'https://router.project-osrm.org';
}

/** OSRM 보정을 사용할 수 있는 이동수단인지 여부 (driving만 지원) */
export function isOsrmSupported(mode: TravelMode): boolean {
  return mode in OSRM_PROFILE;
}

/**
 * OSRM route API로 두 좌표 간 실제 도로 기반 거리·시간을 조회한다.
 * transit 모드나 네트워크/응답 오류 시 null을 반환해 호출측이 기존 추정치로 폴백할 수 있게 한다.
 */
export async function fetchOsrmRoute(
  origin: LatLng,
  destination: LatLng,
  mode: TravelMode,
): Promise<OsrmRoute | null> {
  const profile = OSRM_PROFILE[mode];
  if (!profile) return null;

  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const url = `${getBaseUrl()}/route/v1/${profile}/${coords}?overview=false`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      code: string;
      routes?: { distance: number; duration: number }[];
    };
    if (data.code !== 'Ok' || !data.routes?.length) return null;

    const [route] = data.routes;
    return {
      distanceKm: route.distance / 1000,
      durationMinutes: route.duration / 60,
    };
  } catch (err) {
    console.error('[osrm] 경로 조회 실패, 추정치로 폴백:', err);
    return null;
  }
}
