import { useEffect, useRef } from 'react';
import type { LatLng, Place } from '../types';

interface PlaceDetailModalProps {
  place: Place | null;
  /** 출발지 좌표 (외부 지도 길찾기 링크 생성용) */
  origin: LatLng | null;
  onClose: () => void;
}

/** 장소 상세 정보 모달. 설명 + 외부 카카오맵 길찾기 링크 제공. */
export default function PlaceDetailModal({
  place,
  origin,
  onClose,
}: PlaceDetailModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // ESC로 닫기 + 열릴 때 닫기 버튼에 포커스
  useEffect(() => {
    if (!place) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [place, onClose]);

  if (!place) return null;

  // 카카오맵 길찾기 딥링크 (출발지 → 도착지)
  const directionsUrl = origin
    ? `https://map.kakao.com/link/from/출발지,${origin.lat},${origin.lng}/to/${encodeURIComponent(
        place.name,
      )},${place.lat},${place.lng}`
    : `https://map.kakao.com/link/to/${encodeURIComponent(place.name)},${place.lat},${place.lng}`;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
      onClick={onClose}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button
          ref={closeRef}
          type="button"
          className="modal__close"
          onClick={onClose}
          aria-label="닫기"
        >
          ✕
        </button>
        {place.thumbnail && (
          <img className="modal__thumb" src={place.thumbnail} alt="" />
        )}
        <h2 id="detail-title" className="modal__title">
          {place.name}
        </h2>
        <p className="modal__meta">
          {place.category} · 약 {place.travelMinutes}분 · {place.distanceKm}km
        </p>
        {place.description && (
          <p className="modal__desc">{place.description}</p>
        )}
        <a
          className="btn btn--primary btn--full"
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          카카오맵에서 길찾기 →
        </a>
      </div>
    </div>
  );
}
