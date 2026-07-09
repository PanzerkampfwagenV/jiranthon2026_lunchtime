import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../store/SearchContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { usePlaceSearch } from '../hooks/usePlaceSearch';
import { fetchRecommendations } from '../api/recommendations';
import PolaroidBackdrop from '../components/PolaroidBackdrop';
import {
  APP_SETTINGS,
  applyTheme,
  getStoredTheme,
  storeTheme,
  type ThemeMode,
} from '../config/settings';
import type { TravelMode, MbtiType } from '../types';
import './HomePage.css';

const TIME_PRESETS = [30, 60, 90, 120];

const MODE_OPTIONS: { value: TravelMode; label: string; icon: string }[] = [
  { value: 'walking', label: '도보', icon: '🚶' },
  { value: 'transit', label: '대중교통', icon: '🚌' },
  { value: 'driving', label: '자동차', icon: '🚗' },
];

const MBTI_OPTIONS: MbtiType[] = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
];

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: '시스템 설정' },
  { value: 'light', label: '라이트' },
  { value: 'dark', label: '다크' },
];

const THEME_ICONS: Record<ThemeMode, string> = {
  system: '🌗',
  light: '☀️',
  dark: '🌙',
};

type PanelKey = 'location' | 'time' | 'mode' | 'mbti';

const MODE_LABELS: Record<TravelMode, string> = {
  walking: '도보',
  transit: '대중교통',
  driving: '자동차',
};

// 분 단위를 "3시간", "1시간 30분", "45분" 형태로 표현.
function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  return `${m}분`;
}

export default function HomePage() {
  const navigate = useNavigate();
  const {
    location,
    availableMinutes,
    mode,
    mbti,
    setLocation,
    setAvailableMinutes,
    setMode,
    setMbti,
    setPlaces,
  } = useSearch();
  const { loading: gpsLoading, requestLocation } = useGeolocation();
  const {
    suggestions,
    loading: searchLoading,
    error: searchError,
    available: searchAvailable,
    search,
    clear: clearSuggestions,
  } = usePlaceSearch();

  const [manualLabel, setManualLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 현재 펼쳐진 설정 패널. null이면 모두 접힌 상태.
  const [activePanel, setActivePanel] = useState<PanelKey | null>(null);
  // 사용자가 기본값에서 직접 바꾼 항목 추적 → 해시태그 강조에 사용.
  // (mbti는 선택 옵션이라 값 존재 여부로 강조를 판단하므로 제외)
  const [customized, setCustomized] = useState<{
    location: boolean;
    time: boolean;
    mode: boolean;
  }>({
    location: false,
    time: false,
    mode: false,
  });
  const [theme, setTheme] = useState<ThemeMode>(
    () => getStoredTheme() ?? APP_SETTINGS.theme,
  );

  const togglePanel = (key: PanelKey) => {
    setActivePanel((prev) => (prev === key ? null : key));
  };

  const handleThemeChange = (next: ThemeMode) => {
    setTheme(next);
    storeTheme(next);
    applyTheme(next);
  };

  const handleUseGps = async () => {
    setError(null);
    try {
      const coords = await requestLocation();
      setLocation({ coords, label: '현재 위치', fromGps: true });
      setManualLabel('');
      clearSuggestions();
      setCustomized((prev) => ({ ...prev, location: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : '위치를 가져오지 못했습니다.');
    }
  };

  // 입력값 변경 시 Kakao 장소 검색 실행 (SDK 사용 가능할 때만)
  const handleManualChange = (value: string) => {
    setManualLabel(value);
    if (searchAvailable) {
      search(value);
    }
  };

  // 검색 결과에서 장소 선택 → 실제 좌표로 위치 확정
  const handleSelectSuggestion = (
    name: string,
    coords: { lat: number; lng: number },
  ) => {
    setLocation({ coords, label: name, fromGps: false });
    setManualLabel(name);
    clearSuggestions();
    setCustomized((prev) => ({ ...prev, location: true }));
  };

  // SDK 미사용(키 없음) 시 폴백: 라벨만 입력받고 좌표는 서울시청으로 임시 지정.
  const handleManualConfirm = () => {
    const trimmed = manualLabel.trim();
    if (!trimmed) return;
    setLocation({
      coords: { lat: 37.5665, lng: 126.978 },
      label: trimmed,
      fromGps: false,
    });
    setCustomized((prev) => ({ ...prev, location: true }));
  };

  const handleSelectTime = (preset: number) => {
    setAvailableMinutes(preset);
    setCustomized((prev) => ({ ...prev, time: true }));
  };

  const handleChangeTime = (minutes: number) => {
    setAvailableMinutes(minutes);
    setCustomized((prev) => ({ ...prev, time: true }));
  };

  const handleSelectMode = (next: TravelMode) => {
    setMode(next);
    setCustomized((prev) => ({ ...prev, mode: true }));
  };

  // MBTI는 선택 옵션. 같은 값을 다시 누르면 선택 해제한다.
  const handleSelectMbti = (next: MbtiType) => {
    setMbti(mbti === next ? null : next);
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      // 위치를 선택하지 않았으면 기본값으로 현재 위치를 사용한다.
      let effectiveLocation = location;
      if (!effectiveLocation) {
        const coords = await requestLocation();
        effectiveLocation = { coords, label: '현재 위치', fromGps: true };
        setLocation(effectiveLocation);
      }
      const { places } = await fetchRecommendations({
        location: effectiveLocation.coords,
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
      <PolaroidBackdrop />
      <div className="theme-switch" role="group" aria-label="화면 모드 선택">
        {THEME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`theme-switch__option ${
              theme === opt.value ? 'theme-switch__option--active' : ''
            }`}
            onClick={() => handleThemeChange(opt.value)}
            aria-pressed={theme === opt.value}
            aria-label={opt.label}
            title={opt.label}
          >
            {THEME_ICONS[opt.value]}
          </button>
        ))}
      </div>
      <header className="home__hero">
        <h1 className="home__title">자투리 시간, 어디로 떠날까?</h1>
        <p className="home__subtitle">
          지금 위치와 남는 시간을 알려주면 다녀올 수 있는 곳을 찾아드려요.
        </p>
      </header>

      <nav className="hashtags" aria-label="검색 조건 설정">
        <button
          type="button"
          className={`hashtag ${activePanel === 'location' ? 'hashtag--open' : ''} ${
            customized.location ? 'hashtag--set' : ''
          }`}
          onClick={() => togglePanel('location')}
          aria-expanded={activePanel === 'location'}
        >
          #위치{location ? `·${location.label}` : ''}
        </button>
        <button
          type="button"
          className={`hashtag ${activePanel === 'time' ? 'hashtag--open' : ''} ${
            customized.time ? 'hashtag--set' : ''
          }`}
          onClick={() => togglePanel('time')}
          aria-expanded={activePanel === 'time'}
        >
          #자투리·{formatMinutes(availableMinutes)}
        </button>
        <button
          type="button"
          className={`hashtag ${activePanel === 'mode' ? 'hashtag--open' : ''} ${
            customized.mode ? 'hashtag--set' : ''
          }`}
          onClick={() => togglePanel('mode')}
          aria-expanded={activePanel === 'mode'}
        >
          #이동수단·{MODE_LABELS[mode]}
        </button>
        <button
          type="button"
          className={`hashtag ${activePanel === 'mbti' ? 'hashtag--open' : ''} ${
            mbti ? 'hashtag--set' : ''
          }`}
          onClick={() => togglePanel('mbti')}
          aria-expanded={activePanel === 'mbti'}
        >
          #MBTI{mbti ? `·${mbti}` : ''}
        </button>
      </nav>

      {activePanel === 'location' && (
        <section className="card" aria-label="위치 설정">
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
                placeholder={
                  searchAvailable ? '장소/주소 검색' : '장소/주소 직접 입력'
                }
                value={manualLabel}
                onChange={(e) => handleManualChange(e.target.value)}
                aria-label="장소 또는 주소 검색"
                role="combobox"
                aria-expanded={suggestions.length > 0}
                aria-autocomplete="list"
                autoComplete="off"
              />
              {!searchAvailable && (
                <button
                  type="button"
                  className="btn"
                  onClick={handleManualConfirm}
                  disabled={!manualLabel.trim()}
                >
                  확인
                </button>
              )}
            </div>

            {searchAvailable && (searchLoading || suggestions.length > 0) && (
              <ul className="suggestion-list" role="listbox">
                {searchLoading && (
                  <li className="suggestion-empty">검색 중…</li>
                )}
                {!searchLoading &&
                  suggestions.map((s) => (
                    <li key={s.id} role="option" aria-selected={false}>
                      <button
                        type="button"
                        className="suggestion-item"
                        onClick={() => handleSelectSuggestion(s.name, s.coords)}
                      >
                        <span className="suggestion-name">{s.name}</span>
                        <span className="suggestion-addr">{s.address}</span>
                      </button>
                    </li>
                  ))}
              </ul>
            )}

            {searchError && (
              <p className="error" role="alert">
                {searchError}
              </p>
            )}
          </div>
          {location && (
            <p className="location-selected" role="status">
              선택된 위치: <strong>{location.label}</strong>{' '}
              <span className="location-coords">
                ({location.coords.lat.toFixed(6)}, {location.coords.lng.toFixed(6)})
              </span>
            </p>
          )}
          <p className="panel-hint">
            설정하지 않으면 <strong>현재 위치</strong>를 사용해요.
          </p>
        </section>
      )}

      {activePanel === 'time' && (
        <section className="card" aria-label="자투리 시간 설정">
          <div className="preset-group" role="group" aria-label="시간 프리셋">
            {TIME_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`chip ${availableMinutes === preset ? 'chip--active' : ''}`}
                onClick={() => handleSelectTime(preset)}
                aria-pressed={availableMinutes === preset}
              >
                {preset}분
              </button>
            ))}
          </div>
          <label className="slider-label">
            직접 조절: <strong>{formatMinutes(availableMinutes)}</strong>
            <input
              type="range"
              min={10}
              max={180}
              step={5}
              value={availableMinutes}
              onChange={(e) => handleChangeTime(Number(e.target.value))}
              className="slider"
              aria-label="자투리 시간(분)"
            />
          </label>
          <p className="panel-hint">
            설정하지 않으면 <strong>3시간</strong>을 사용해요.
          </p>
        </section>
      )}

      {activePanel === 'mode' && (
        <section className="card" aria-label="이동 수단 설정">
          <div className="preset-group" role="group" aria-label="이동 수단">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`chip ${mode === opt.value ? 'chip--active' : ''}`}
                onClick={() => handleSelectMode(opt.value)}
                aria-pressed={mode === opt.value}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
          <p className="panel-hint">
            설정하지 않으면 <strong>대중교통</strong>을 사용해요.
          </p>
        </section>
      )}

      {activePanel === 'mbti' && (
        <section className="card" aria-label="MBTI 선택">
          <div className="mbti-grid" role="group" aria-label="MBTI 유형">
            {MBTI_OPTIONS.map((type) => (
              <button
                key={type}
                type="button"
                className={`chip ${mbti === type ? 'chip--active' : ''}`}
                onClick={() => handleSelectMbti(type)}
                aria-pressed={mbti === type}
              >
                {type}
              </button>
            ))}
          </div>
          <p className="panel-hint">
            선택 사항이에요. 성향에 맞는 여행지를 곧 추천해 드릴게요.
          </p>
        </section>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        className="btn btn--primary btn--full"
        onClick={handleSubmit}
        disabled={submitting}
      >
        {submitting ? '설레는 곳 찾는 중…' : '✨ 지금 떠나볼까요?'}
      </button>
    </main>
  );
}
