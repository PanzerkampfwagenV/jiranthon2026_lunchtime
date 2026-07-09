import type { PlaceDetailInfo } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * 장소의 상세 정보(활동, 하이라이트, 소개)를 조회한다.
 * - 백엔드 미설정(Mock 모드) 또는 요청 실패 시 빈 폴백을 반환한다(모달 표시에 치명적이지 않음).
 */
export async function fetchPlaceDetail(
  name: string,
  category: string,
): Promise<PlaceDetailInfo> {
  if (!API_BASE_URL) {
    return fallback();
  }

  const params = new URLSearchParams({ name, category });

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/place-detail?${params.toString()}`,
    );
    if (!res.ok) return fallback();
    return (await res.json()) as PlaceDetailInfo;
  } catch {
    return fallback();
  }
}

function fallback(): PlaceDetailInfo {
  return { activities: [], highlights: [], summary: '', generated: false };
}
