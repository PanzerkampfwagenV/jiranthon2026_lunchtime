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
  const geocoderRef = useRef<kakao.maps.services.Geocoder | null>(null);

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

      const { services } = window.kakao.maps;

      if (!placesRef.current) {
        placesRef.current = new services.Places();
      }
      if (!geocoderRef.current) {
        geocoderRef.current = new services.Geocoder();
      }

      setLoading(true);
      setError(null);

      // 카카오맵 자동완성과 동일하게 주소 검색과 장소명(POI) 검색을 함께 호출해
      // 결과를 합친다. addressSearch만 우선 시도하면 "서울"처럼
      // 행정구역명과 정확히 일치하는 주소 1건만 나오고 "서울역", "서울숲" 같은
      // 관련 결과가 가려지는 문제가 있었다.
      //
      // "OO시/도/구/군"처럼 입력하면 관공서(OO청)를 기대하는 경우가 많은데,
      // keywordSearch는 이를 지역명으로 해석해 관광명소 위주 결과를 우선
      // 반환하고, 실제 행정기관은 검색되지 않는다(예: "서울시" 검색에
      // "서울특별시청"이 없음. "서울시청"으로 검색해야 나옴).
      // 이를 보정하기 위해 "OO시/도/구/군" 뒤에 "청"을 붙인 별칭으로도
      // 함께 검색해 관공서를 후보에 포함시킨다.
      const officeAlias = trimmed.match(/^(.+?[시도구군])$/)?.[1];

      let addressDone = false;
      let keywordDone = false;
      let officeDone = !officeAlias;
      let addressItems: PlaceSuggestion[] = [];
      let keywordItems: PlaceSuggestion[] = [];
      let officeItems: PlaceSuggestion[] = [];

      const commitIfDone = () => {
        if (!addressDone || !keywordDone || !officeDone) return;
        setLoading(false);
        // 관공서 보정 결과를 최우선으로, 그 다음 주소 검색, 마지막으로
        // 장소명 검색 결과를 이어붙이고 좌표가 거의 같은 중복 항목은 제거한다.
        const seen = new Set<string>();
        const merged = [...officeItems, ...addressItems, ...keywordItems].filter(
          (item) => {
            const key = `${item.coords.lat.toFixed(4)},${item.coords.lng.toFixed(4)}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          },
        );
        // 카카오맵 자동완성처럼 입력어로 "시작하는" 이름을 우선 노출한다.
        // keywordSearch는 정확도순(전문검색)이라 "서울" 입력 시 이름/주소에
        // "서울"이 포함된 임의의 장소가 뒤섞이는데, 접두어 일치 항목을
        // 앞으로 재정렬하면 "서울역", "서울숲"처럼 기대에 맞는 결과가 위로 온다.
        const startsWith = (name: string) => name.startsWith(trimmed);
        merged.sort((a, b) => Number(startsWith(b.name)) - Number(startsWith(a.name)));
        setSuggestions(merged);
      };

      if (officeAlias) {
        placesRef.current.keywordSearch(
          `${officeAlias}청`,
          (result, searchStatus) => {
            if (searchStatus === services.Status.OK) {
              officeItems = result.slice(0, 3).map((item) => ({
                id: item.id,
                name: item.place_name,
                address: item.road_address_name || item.address_name,
                coords: { lat: Number(item.y), lng: Number(item.x) },
              }));
            }
            officeDone = true;
            commitIfDone();
          },
          { size: 5, category_group_code: 'PO3' },
        );
      }

      geocoderRef.current.addressSearch(trimmed, (addressResult, addressStatus) => {
        if (addressStatus === services.Status.OK) {
          addressItems = addressResult.map((item, index) => ({
            id: `addr-${index}-${item.address_name}`,
            name: item.address_name,
            address: item.address_name,
            coords: { lat: Number(item.y), lng: Number(item.x) },
          }));
        }
        addressDone = true;
        commitIfDone();
      });

      placesRef.current.keywordSearch(
        trimmed,
        (result, searchStatus) => {
          if (searchStatus === services.Status.OK) {
            keywordItems = result.map((item) => ({
              id: item.id,
              name: item.place_name,
              address: item.road_address_name || item.address_name,
              coords: { lat: Number(item.y), lng: Number(item.x) },
            }));
          } else if (searchStatus !== services.Status.ZERO_RESULT) {
            setError('장소 검색 중 오류가 발생했어요.');
          }
          keywordDone = true;
          commitIfDone();
        },
        { size: 10 },
      );
    },
    [status, clear],
  );

  return { suggestions, loading, error, available, search, clear };
}
