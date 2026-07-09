import { useCallback, useRef, useState } from 'react';
import type { LatLng } from '../types';
import { useKakaoLoader } from './useKakaoLoader';

/** 장소 검색 결과 항목 (UI에서 사용하는 최소 형태) */
export interface PlaceSuggestion {
  id: string;
  /** 장소명 (예: "카카오판교오피스") */
  name: string;
  /** 도로명 또는 지번 주소 */
  address: string;
  coords: LatLng;
}

interface UsePlaceSearchResult {
  suggestions: PlaceSuggestion[];
  loading: boolean;
  error: string | null;
  /** 사용 가능 여부 (SDK 로드 완료 + services 사용 가능) */
  available: boolean;
  search: (keyword: string) => void;
  clear: () => void;
}

/**
 * Kakao Places 키워드 검색 훅.
 * SDK 키가 없거나 로드 실패 시 available=false 로 안전하게 폴백한다.
 */
export function usePlaceSearch(): UsePlaceSearchResult {
  const status = useKakaoLoader();
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const placesRef = useRef<kakao.maps.services.Places | null>(null);

  const available = status === 'ready';

  const clear = useCallback(() => {
    setSuggestions([]);
    setError(null);
    setLoading(false);
  }, []);

  const search = useCallback(
    (keyword: string) => {
      const trimmed = keyword.trim();
      if (!trimmed) {
        clear();
        return;
      }
      if (status !== 'ready' || !window.kakao?.maps?.services) {
        setError('지도 서비스가 아직 준비되지 않았어요.');
        return;
      }

      if (!placesRef.current) {
        placesRef.current = new window.kakao.maps.services.Places();
      }

      setLoading(true);
      setError(null);

      placesRef.current.keywordSearch(
        trimmed,
        (result, searchStatus) => {
          setLoading(false);
          const { services } = window.kakao.maps;
          if (searchStatus === services.Status.OK) {
            setSuggestions(
              result.map((item) => ({
                id: item.id,
                name: item.place_name,
                address: item.road_address_name || item.address_name,
                coords: { lat: Number(item.y), lng: Number(item.x) },
              })),
            );
          } else if (searchStatus === services.Status.ZERO_RESULT) {
            setSuggestions([]);
          } else {
            setError('장소 검색 중 오류가 발생했어요.');
            setSuggestions([]);
          }
        },
        { size: 10 },
      );
    },
    [status, clear],
  );

  return { suggestions, loading, error, available, search, clear };
}
