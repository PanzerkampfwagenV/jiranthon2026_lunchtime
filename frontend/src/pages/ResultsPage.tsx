import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearch } from '../store/SearchContext';
import MapView from '../components/MapView';
import PlaceCard from '../components/PlaceCard';
import ResultControls, { type SortKey } from '../components/ResultControls';
import PlaceDetailModal from '../components/PlaceDetailModal';
import type { Place } from '../types';
import './ResultsPage.css';

// 개발자 B 담당: 추천 결과 목록 + 지도 시각화.
export default function ResultsPage() {
  const { location, availableMinutes, mode, places } = useSearch();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('travelMinutes');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [detailPlace, setDetailPlace] = useState<Place | null>(null);
  // 선택된 장소의 실제(또는 대체) 경로 조회 결과. 지도에서 경로를 그리면서 갱신된다.
  const [routeInfo, setRouteInfo] = useState<{
    placeId: string;
    durationMinutes: number;
    distanceKm: number;
    isActualRoute: boolean;
  } | null>(null);

  // 결과에 존재하는 카테고리 목록 (중복 제거)
  const categories = useMemo(
    () => [...new Set(places.map((p) => p.category))],
    [places],
  );

  // 필터 + 정렬 적용
  const visiblePlaces = useMemo(() => {
    const filtered = activeCategory
      ? places.filter((p) => p.category === activeCategory)
      : places;
    return [...filtered].sort((a, b) => a[sortKey] - b[sortKey]);
  }, [places, activeCategory, sortKey]);

  // 위치 정보 없이 직접 진입한 경우
  if (!location) {
    return (
      <main className="home">
        <section className="card">
          <p>검색 정보가 없어요. 처음부터 다시 시작해 주세요.</p>
        </section>
        <Link to="/" className="btn btn--full">
          ← 검색하러 가기
        </Link>
      </main>
    );
  }

  return (
    <main className="results">
      <header className="home__hero">
        <h1 className="home__title">추천 결과</h1>
        <p className="home__subtitle">
          {location.label} · {availableMinutes}분 · {mode}
        </p>
      </header>

      {places.length === 0 ? (
        <section className="card results__empty">
          <p>조건에 맞는 장소가 없어요.</p>
          <p className="results__empty-hint">
            시간을 늘리거나 이동 수단을 바꿔보세요.
          </p>
        </section>
      ) : (
        <div className="results__layout">
          <div className="results__map">
            <MapView
              origin={location.coords}
              places={visiblePlaces}
              selectedId={selectedId}
              onSelect={setSelectedId}
              mode={mode}
              onRouteChange={(placeId, route) =>
                setRouteInfo(
                  route ? { placeId, ...route } : null,
                )
              }
            />
            {routeInfo && !routeInfo.isActualRoute && (
              <p className="results__route-note">
                {mode === 'transit'
                  ? '대중교통 경로는 지도에서 제공되지 않아 직선으로 표시돼요.'
                  : '실제 경로를 불러오지 못해 직선으로 표시돼요.'}
              </p>
            )}
          </div>

          <div className="results__list-panel">
            <ResultControls
              sortKey={sortKey}
              onSortChange={setSortKey}
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />

            {visiblePlaces.length === 0 ? (
              <p className="results__empty-hint">
                선택한 종류에 해당하는 장소가 없어요.
              </p>
            ) : (
              <ul className="result-list">
                {visiblePlaces.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    active={selectedId === place.id}
                    onHover={setSelectedId}
                    onSelect={setSelectedId}
                    onOpenDetail={setDetailPlace}
                    liveRoute={
                      routeInfo?.placeId === place.id
                        ? routeInfo
                        : undefined
                    }
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <Link to="/" className="btn btn--full">
        ← 다시 검색
      </Link>

      <PlaceDetailModal
        place={detailPlace}
        origin={location.coords}
        onClose={() => setDetailPlace(null)}
      />
    </main>
  );
}
