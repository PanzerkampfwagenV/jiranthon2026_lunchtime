import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../store/SearchContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { fetchRecommendations } from '../api/recommendations';
import type { TravelMode } from '../types';
import './HomePage.css';

const TIME_PRESETS = [30, 60, 90, 120];

const MODE_OPTIONS: { value: TravelMode; label: string; icon: string }[] = [
  { value: 'walking', label: '도보', icon: '🚶' },
  { value: 'transit', label: '대중교통', icon: '🚌' },
  { value: 'driving', label: '자동차', icon: '🚗' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const {
    location,
    availableMinutes,
    mode,
    setLocation,
    setAvailableMinutes,
    setMode,
    setPlaces,
  } = useSearch();
  const { loading: gpsLoading, requestLocation } = useGeolocation();

  const [manualLabel, setManualLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUseGps = async () => {
    setError(null);
    try {
      const coords = await requestLocation();
      setLocation({ coords, label: '현재 위치', fromGps: true });
      setManualLabel('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '위치를 가져오지 못했습니다.');
    }
  };

  // TODO(개발자 A): Kakao Map 장소 검색 자동완성으로 교체 예정.
  // 지금은 라벨만 입력받고 좌표는 서울시청으로 임시 지정한다.
  const handleManualConfirm = () => {
    const trimmed = manualLabel.trim();
    if (!trimmed) return;
    setLocation({
      coords: { lat: 37.5665, lng: 126.978 },
      label: trimmed,
      fromGps: false,
    });
  };

  const canSubmit =
    location !== null && availableMinutes > 0 && !submitting;

  const handleSubmit = async () => {
    if (!location) {
      setError('먼저 위치를 선택해 주세요.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const { places } = await fetchRecommendations({
        location: location.coords,
        availableMinutes,
        mode,
      });
      setPlaces(places);
      navigate('/results');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '추천을 불러오지 못했습니다.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="home">
      <header className="home__hero">
        <h1 className="home__title">자투리 시간, 어디로 떠날까?</h1>
        <p className="home__subtitle">
          지금 위치와 남는 시간을 알려주면 다녀올 수 있는 곳을 찾아드려요.
        </p>
      </header>

      <section className="card" aria-labelledby="location-heading">
        <h2 id="location-heading" className="card__heading">
          1. 위치
        </h2>
        <div className="location-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleUseGps}
            disabled={gpsLoading}
          >
            {gpsLoading ? '위치 확인 중…' : '📍 현재 위치 사용'}
          </button>
          <div className="location-manual">
            <input
              type="text"
              className="input"
              placeholder="장소/주소 직접 입력"
              value={manualLabel}
              onChange={(e) => setManualLabel(e.target.value)}
              aria-label="장소 또는 주소 직접 입력"
            />
            <button
              type="button"
              className="btn"
              onClick={handleManualConfirm}
              disabled={!manualLabel.trim()}
            >
              확인
            </button>
          </div>
        </div>
        {location && (
          <p className="location-selected" role="status">
            선택된 위치: <strong>{location.label}</strong>
          </p>
        )}
      </section>

      <section className="card" aria-labelledby="time-heading">
        <h2 id="time-heading" className="card__heading">
          2. 자투리 시간
        </h2>
        <div className="preset-group" role="group" aria-label="시간 프리셋">
          {TIME_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={`chip ${availableMinutes === preset ? 'chip--active' : ''}`}
              onClick={() => setAvailableMinutes(preset)}
              aria-pressed={availableMinutes === preset}
            >
              {preset}분
            </button>
          ))}
        </div>
        <label className="slider-label">
          직접 조절: <strong>{availableMinutes}분</strong>
          <input
            type="range"
            min={10}
            max={180}
            step={5}
            value={availableMinutes}
            onChange={(e) => setAvailableMinutes(Number(e.target.value))}
            className="slider"
            aria-label="자투리 시간(분)"
          />
        </label>
      </section>

      <section className="card" aria-labelledby="mode-heading">
        <h2 id="mode-heading" className="card__heading">
          3. 이동 수단
        </h2>
        <div className="preset-group" role="group" aria-label="이동 수단">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`chip ${mode === opt.value ? 'chip--active' : ''}`}
              onClick={() => setMode(opt.value)}
              aria-pressed={mode === opt.value}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        className="btn btn--primary btn--full"
        onClick={handleSubmit}
        disabled={!canSubmit}
      >
        {submitting ? '추천 찾는 중…' : '추천 받기'}
      </button>
    </main>
  );
}
