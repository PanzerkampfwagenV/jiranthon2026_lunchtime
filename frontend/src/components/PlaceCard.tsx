import type { Place } from '../types';
import { useI18n } from '../i18n/LanguageContext';

interface PlaceCardProps {
  place: Place;
  /** 지도 마커와 연동된 강조 상태 */
  active?: boolean;
  /** 카드 hover/focus 시 (지도 마커 강조용) */
  onHover?: (id: string | null) => void;
  /** 카드 클릭 시 (지도 이동 + 선택) */
  onSelect?: (id: string) => void;
  /** 상세 보기 열기 */
  onOpenDetail?: (place: Place) => void;
  /** 지도에서 조회한 실제(또는 대체) 경로 결과. 이 카드가 선택된 경우에만 전달된다. */
  liveRoute?: { durationMinutes: number; isActualRoute: boolean };
}

/** 추천 장소 하나를 표현하는 카드. 목록과 지도가 공유한다. */
export default function PlaceCard({
  place,
  active = false,
  onHover,
  onSelect,
  onOpenDetail,
  liveRoute,
}: PlaceCardProps) {
  const { t } = useI18n();

  return (
    <li
      className={`card result-item ${active ? 'result-item--active' : ''}`}
      onMouseEnter={() => onHover?.(place.id)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(place.id)}
      onBlur={() => onHover?.(null)}
    >
      <button
        type="button"
        className="result-item__main"
        onClick={() => onSelect?.(place.id)}
        aria-pressed={active}
      >
        {place.thumbnail && (
          <img
            className="result-item__thumb"
            src={place.thumbnail}
            alt=""
            loading="lazy"
          />
        )}
        <div className="result-item__body">
          <h2 className="result-item__name">{place.name}</h2>
          <p className="result-item__meta">
            {place.category} ·{' '}
            {liveRoute && liveRoute.isActualRoute ? (
              <>{t.actualApproxPrefix}{liveRoute.durationMinutes}{t.minuteUnit}</>
            ) : (
              <>{t.approxPrefix}{place.travelMinutes}{t.minuteUnit}</>
            )}{' '}
            · {place.distanceKm}km
          </p>
          {place.description && (
            <p className="result-item__desc">{place.description}</p>
          )}
        </div>
      </button>
      {onOpenDetail && (
        <button
          type="button"
          className="result-item__detail-btn"
          onClick={() => onOpenDetail(place)}
        >
          {t.detailButton}
        </button>
      )}
    </li>
  );
}
