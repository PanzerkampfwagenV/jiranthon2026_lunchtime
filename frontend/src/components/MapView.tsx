import { useEffect, useRef } from 'react';
import type { LatLng, Place, TravelMode } from '../types';
import { useKakaoLoader } from '../hooks/useKakaoLoader';
import { fetchRoute } from '../api/route';

interface MapViewProps {
  /** 출발지(사용자) 좌표 */
  origin: LatLng;
  /** 추천 장소 목록 */
  places: Place[];
  /** 현재 강조(선택)된 장소 id */
  selectedId: string | null;
  /** 마커 클릭 시 호출 */
  onSelect: (id: string) => void;
  /** 경로 계산에 사용할 이동 수단 */
  mode: TravelMode;
  /** 선택된 장소의 실제 경로 조회 결과가 바뀔 때 호출 (없으면 미사용) */
  onRouteChange?: (
    placeId: string,
    route: { durationMinutes: number; distanceKm: number; isActualRoute: boolean } | null,
  ) => void;
}

/**
 * Kakao Map 시각화 컴포넌트.
 * - 사용자 위치 + 추천 장소 마커 표시
 * - 마커 클릭 시 InfoWindow + 상위로 선택 알림
 * - selectedId 변경 시 해당 마커 강조, 지도 중심 이동, 출발지↔선택 장소 경로(Polyline) 표시
 * SDK 키가 없으면 안내 플레이스홀더를 렌더링한다.
 */
export default function MapView({
  origin,
  places,
  selectedId,
  onSelect,
  mode,
  onRouteChange,
}: MapViewProps) {
  const status = useKakaoLoader();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markersRef = useRef<Map<string, kakao.maps.Marker>>(new Map());
  const overlayRef = useRef<kakao.maps.CustomOverlay | null>(null);
  const polylineRef = useRef<kakao.maps.Polyline | null>(null);
  // onSelect/onRouteChange가 매 렌더마다 바뀌어도 effect를 다시 걸지 않도록 ref로 보관
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onRouteChangeRef = useRef(onRouteChange);
  onRouteChangeRef.current = onRouteChange;

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
      overlayRef.current?.setMap(null);
      overlayRef.current = null;
      polylineRef.current?.setMap(null);
      polylineRef.current = null;
      mapRef.current = null;
    };
  }, [status, origin.lat, origin.lng, places]);

  // 선택 장소 변경 시: 커스텀 오버레이(이름표) 표시 및 중심 이동, 출발지→장소 경로 표시
  useEffect(() => {
    if (status !== 'ready') return;
    const map = mapRef.current;
    if (!map) return;

    // 이전 오버레이/경로선 제거
    overlayRef.current?.setMap(null);
    overlayRef.current = null;
    polylineRef.current?.setMap(null);
    polylineRef.current = null;

    if (!selectedId) {
      onRouteChangeRef.current?.('', null);
      return;
    }

    const marker = markersRef.current.get(selectedId);
    const place = places.find((p) => p.id === selectedId);
    if (!marker || !place) return;

    const labelEl = document.createElement('div');
    labelEl.className = 'map-view__label';
    labelEl.textContent = place.name;
    labelEl.style.cssText =
      'padding:6px 10px;font-size:13px;font-weight:600;white-space:nowrap;' +
      'background:#1f2937;color:#ffffff;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,0.25);';

    const overlay = new window.kakao.maps.CustomOverlay({
      position: marker.getPosition(),
      content: labelEl,
      yAnchor: 1.4,
      zIndex: 10,
    });
    overlay.setMap(map);
    overlayRef.current = overlay;
    map.setCenter(marker.getPosition());

    // 실제(또는 대체) 경로를 조회해 Polyline으로 표시한다.
    let cancelled = false;
    fetchRoute(origin, { lat: place.lat, lng: place.lng }, mode)
      .then((route) => {
        if (cancelled || !mapRef.current) return;
        const path = route.path.map((p) => new window.kakao.maps.LatLng(p.lat, p.lng));
        const polyline = new window.kakao.maps.Polyline({
          path,
          strokeWeight: 4,
          strokeColor: route.isActualRoute ? '#2563eb' : '#94a3b8',
          strokeOpacity: 0.85,
          strokeStyle: route.isActualRoute ? 'solid' : 'shortdash',
          map: mapRef.current,
        });
        polylineRef.current = polyline;
        onRouteChangeRef.current?.(place.id, {
          durationMinutes: route.durationMinutes,
          distanceKm: route.distanceKm,
          isActualRoute: route.isActualRoute,
        });
      })
      .catch((err) => {
        console.error('경로 조회 실패:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId, status, places, origin, mode]);

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
