export type SortKey = 'travelMinutes' | 'distanceKm';

interface ResultControlsProps {
  sortKey: SortKey;
  onSortChange: (key: SortKey) => void;
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

/** 결과 목록의 정렬(이동시간/거리) + 카테고리 필터 컨트롤 */
export default function ResultControls({
  sortKey,
  onSortChange,
  categories,
  activeCategory,
  onCategoryChange,
}: ResultControlsProps) {
  return (
    <div className="result-controls">
      <div className="result-controls__row" role="group" aria-label="정렬 기준">
        <span className="result-controls__label">정렬</span>
        <button
          type="button"
          className={`chip ${sortKey === 'travelMinutes' ? 'chip--active' : ''}`}
          onClick={() => onSortChange('travelMinutes')}
          aria-pressed={sortKey === 'travelMinutes'}
        >
          이동시간순
        </button>
        <button
          type="button"
          className={`chip ${sortKey === 'distanceKm' ? 'chip--active' : ''}`}
          onClick={() => onSortChange('distanceKm')}
          aria-pressed={sortKey === 'distanceKm'}
        >
          거리순
        </button>
      </div>

      {categories.length > 0 && (
        <div
          className="result-controls__row"
          role="group"
          aria-label="카테고리 필터"
        >
          <span className="result-controls__label">종류</span>
          <button
            type="button"
            className={`chip ${activeCategory === null ? 'chip--active' : ''}`}
            onClick={() => onCategoryChange(null)}
            aria-pressed={activeCategory === null}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`chip ${activeCategory === cat ? 'chip--active' : ''}`}
              onClick={() => onCategoryChange(cat)}
              aria-pressed={activeCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
