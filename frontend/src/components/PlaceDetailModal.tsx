import { useEffect, useRef, useState } from 'react';
import type { LatLng, Place, PlaceDetailInfo } from '../types';
import { fetchPlaceDetail } from '../api/placeDetail';
import { useI18n } from '../i18n/LanguageContext';

interface PlaceDetailModalProps {
  place: Place | null;
  /** 출발지 좌표 (외부 지도 길찾기 링크 생성용) */
  origin: LatLng | null;
  onClose: () => void;
}

/** 장소 상세 정보 모달. 설명 + LLM 기반 활동/하이라이트 + 외부 카카오맵 길찾기 링크 제공. */
export default function PlaceDetailModal({
  place,
  origin,
  onClose,
}: PlaceDetailModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [detail, setDetail] = useState<PlaceDetailInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

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

  // 장소가 바뀔 때마다 상세 정보(활동/하이라이트/소개)를 불러온다.
  useEffect(() => {
    if (!place) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetail(null);
    setLoading(true);
    fetchPlaceDetail(place.name, place.category)
      .then((result) => {
        if (!cancelled) setDetail(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [place]);

  if (!place) return null;

  // 카카오맵 길찾기 딥링크 (출발지 → 도착지)
  const directionsUrl = origin
    ? `https://map.kakao.com/link/from/${encodeURIComponent(t.mapOriginTitle)},${origin.lat},${origin.lng}/to/${encodeURIComponent(
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
          aria-label={t.closeLabel}
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
          {place.category} · {t.approxPrefix}{place.travelMinutes}{t.minuteUnit} · {place.distanceKm}km
        </p>
        {place.description && (
          <p className="modal__desc">{place.description}</p>
        )}

        {loading && (
          <p className="modal__loading" role="status">
            {t.detailLoading}
          </p>
        )}

        {!loading && detail?.summary && (
          <p className="modal__ai-summary">{detail.summary}</p>
        )}

        {!loading && detail && detail.activities.length > 0 && (
          <div className="modal__section">
            <h3 className="modal__section-title">{t.activitiesTitle}</h3>
            <ul className="modal__tag-list">
              {detail.activities.map((a) => (
                <li key={a} className="modal__tag">
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!loading && detail && detail.highlights.length > 0 && (
          <div className="modal__section">
            <h3 className="modal__section-title">{t.highlightsTitle}</h3>
            <ul className="modal__tag-list">
              {detail.highlights.map((h) => (
                <li key={h} className="modal__tag modal__tag--highlight">
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        <a
          className="btn btn--primary btn--full"
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t.directionsButton}
        </a>
      </div>
    </div>
  );
}
