import { Link } from 'react-router-dom';
import { useSearch } from '../store/SearchContext';

// 개발자 B 담당: 추천 결과 목록 + 지도 시각화.
// 지금은 입력 화면과 연동되는 최소 목록만 표시한다.
export default function ResultsPage() {
  const { location, availableMinutes, mode, places } = useSearch();

  return (
    <main className="home">
      <header className="home__hero">
        <h1 className="home__title">추천 결과</h1>
        {location && (
          <p className="home__subtitle">
            {location.label} · {availableMinutes}분 · {mode}
          </p>
        )}
      </header>

      {places.length === 0 ? (
        <section className="card">
          <p>조건에 맞는 장소가 없어요. 시간을 늘리거나 이동 수단을 바꿔보세요.</p>
        </section>
      ) : (
        <ul className="result-list">
          {places.map((place) => (
            <li key={place.id} className="card result-item">
              <div className="result-item__body">
                <h2 className="result-item__name">{place.name}</h2>
                <p className="result-item__meta">
                  {place.category} · 약 {place.travelMinutes}분 ·{' '}
                  {place.distanceKm}km
                </p>
                {place.description && (
                  <p className="result-item__desc">{place.description}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Link to="/" className="btn btn--full">
        ← 다시 검색
      </Link>
    </main>
  );
}
