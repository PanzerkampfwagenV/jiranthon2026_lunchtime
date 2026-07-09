import type { Place } from '../types';

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
}

/** 추천 장소 하나를 표현하는 카드. 목록과 지도가 공유한다. */
export default function PlaceCard({
  place,
  active = false,
  onHover,
  onSelect,
  onOpenDetail,
}: PlaceCardProps) {
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
            {place.category} · 약 {place.travelMinutes}분 · {place.distanceKm}km
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
          상세 보기
        </button>
      )}
    </li>
  );
}
