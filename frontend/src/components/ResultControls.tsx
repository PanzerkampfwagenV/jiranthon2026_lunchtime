import { useI18n } from '../i18n/LanguageContext';

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
  const { t } = useI18n();

  return (
    <div className="result-controls">
      <div className="result-controls__row" role="group" aria-label={t.sortGroupLabel}>
        <span className="result-controls__label">{t.sortLabel}</span>
        <button
          type="button"
          className={`chip ${sortKey === 'travelMinutes' ? 'chip--active' : ''}`}
          onClick={() => onSortChange('travelMinutes')}
          aria-pressed={sortKey === 'travelMinutes'}
        >
          {t.sortByTime}
        </button>
        <button
          type="button"
          className={`chip ${sortKey === 'distanceKm' ? 'chip--active' : ''}`}
          onClick={() => onSortChange('distanceKm')}
          aria-pressed={sortKey === 'distanceKm'}
        >
          {t.sortByDistance}
        </button>
      </div>

      {categories.length > 0 && (
        <div
          className="result-controls__row"
          role="group"
          aria-label={t.categoryFilterLabel}
        >
          <span className="result-controls__label">{t.categoryLabel}</span>
          <button
            type="button"
            className={`chip ${activeCategory === null ? 'chip--active' : ''}`}
            onClick={() => onCategoryChange(null)}
            aria-pressed={activeCategory === null}
          >
            {t.categoryAll}
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
