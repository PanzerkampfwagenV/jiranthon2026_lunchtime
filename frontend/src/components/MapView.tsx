import { useEffect, useRef } from 'react';
import type { LatLng, Place } from '../types';
import { useKakaoLoader } from '../hooks/useKakaoLoader';

interface MapViewProps {
  /** 출발지(사용자) 좌표 */
  origin: LatLng;
  /** 추천 장소 목록 */
  places: Place[];
  /** 현재 강조(선택)된 장소 id */
  selectedId: string | null;
  /** 마커 클릭 시 호출 */
  onSelect: (id: string) => void;
}

/**
 * Kakao Map 시각화 컴포넌트.
 * - 사용자 위치 + 추천 장소 마커 표시
 * - 마커 클릭 시 InfoWindow + 상위로 선택 알림
 * - selectedId 변경 시 해당 마커 강조 및 지도 중심 이동
 * SDK 키가 없으면 안내 플레이스홀더를 렌더링한다.
 */
export default function MapView({
  origin,
  places,
  selectedId,
  onSelect,
}: MapViewProps) {
  const status = useKakaoLoader();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<Map<string, kakao.maps.Marker>>(new Map());
  const infoWindowRef = useRef<kakao.maps.InfoWindow | null>(null);
  // onSelect가 매 렌더마다 바뀌어도 리스너를 다시 달지 않도록 ref로 보관
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // 지도 초기화 + 마커 렌더링
  useEffect(() => {
    if (status !== 'ready' || !containerRef.current) return;

    const { kakao } = window;
    const originLatLng = new kakao.maps.LatLng(origin.lat, origin.lng);

    const map = new kakao.maps.Map(containerRef.current, {
      center: originLatLng,
      level: 6,
    });
    mapRef.current = map;

    const infoWindow = new kakao.maps.InfoWindow({ zIndex: 10 });
    infoWindowRef.current = infoWindow;

    const bounds = new kakao.maps.LatLngBounds();
    bounds.extend(originLatLng);

    // 출발지 마커 (구분을 위해 title만 지정)
    new kakao.maps.Marker({
      position: originLatLng,
      map,
      title: '출발지',
      zIndex: 5,
    });

    // 추천 장소 마커
    const markers = new Map<string, kakao.maps.Marker>();
    places.forEach((place) => {
      const pos = new kakao.maps.LatLng(place.lat, place.lng);
      const marker = new kakao.maps.Marker({
        position: pos,
        map,
        title: place.name,
      });
      kakao.maps.event.addListener(marker, 'click', () => {
        onSelectRef.current(place.id);
      });
      markers.set(place.id, marker);
      bounds.extend(pos);
    });
    markersRef.current = markers;

    // 모든 마커가 보이도록 영역 맞춤
    if (places.length > 0) {
      map.setBounds(bounds);
    }

    return () => {
      markers.forEach((m) => m.setMap(null));
      markers.clear();
      infoWindow.close();
      mapRef.current = null;
    };
  }, [status, origin.lat, origin.lng, places]);

  // 선택 장소 변경 시: InfoWindow 열고 중심 이동
  useEffect(() => {
    if (status !== 'ready') return;
    const map = mapRef.current;
    const infoWindow = infoWindowRef.current;
    if (!map || !infoWindow) return;

    if (!selectedId) {
      infoWindow.close();
      return;
    }

    const marker = markersRef.current.get(selectedId);
    const place = places.find((p) => p.id === selectedId);
    if (!marker || !place) return;

    infoWindow.setContent(
      `<div style="padding:6px 10px;font-size:13px;font-weight:600;white-space:nowrap;">${escapeHtml(
        place.name,
      )}</div>`,
    );
    infoWindow.open(map, marker);
    map.setCenter(marker.getPosition());
  }, [selectedId, status, places]);

  if (status === 'no-key') {
    return (
      <div className="map-view map-view--placeholder" role="img" aria-label="지도 미리보기 없음">
        <p>
          지도를 표시하려면 <code>VITE_KAKAO_MAP_KEY</code>를 설정하세요.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="map-view map-view--placeholder" role="alert">
        <p>지도를 불러오지 못했습니다.</p>
      </div>
    );
  }

  return (
    <div className="map-view">
      <div ref={containerRef} className="map-view__canvas" />
      {status !== 'ready' && (
        <div className="map-view__loading" role="status">
          지도 불러오는 중…
        </div>
      )}
    </div>
  );
}

/** InfoWindow에 사용자 데이터를 넣기 전 XSS 방지용 이스케이프 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
