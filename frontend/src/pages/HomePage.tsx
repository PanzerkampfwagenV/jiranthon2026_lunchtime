import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../store/SearchContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { usePlaceSearch } from '../hooks/usePlaceSearch';
import { fetchRecommendations } from '../api/recommendations';
import PolaroidBackdrop from '../components/PolaroidBackdrop';
import LanguageSwitch from '../components/LanguageSwitch';
import { useI18n } from '../i18n/LanguageContext';
import {
  APP_SETTINGS,
  applyTheme,
  getStoredTheme,
  storeTheme,
  type ThemeMode,
} from '../config/settings';
import type { TravelMode, MbtiType, CuisineType } from '../types';
import './HomePage.css';

const TIME_PRESETS = [30, 60, 90, 120];

const MODE_OPTIONS: { value: TravelMode; icon: string }[] = [
  { value: 'walking', icon: '🚶' },
  { value: 'transit', icon: '🚌' },
  { value: 'driving', icon: '🚗' },
];

const MBTI_OPTIONS: MbtiType[] = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
];

const CUISINE_OPTIONS: { value: CuisineType; icon: string }[] = [
  { value: 'korean', icon: '🍚' },
  { value: 'chinese', icon: '🥢' },
  { value: 'japanese', icon: '🍣' },
  { value: 'western', icon: '🍝' },
  { value: 'salad', icon: '🥗' },
  { value: 'coffee', icon: '☕' },
  { value: 'dessert', icon: '🍰' },
  { value: 'snack', icon: '🍢' },
];

const THEME_OPTIONS: ThemeMode[] = ['system', 'light', 'dark'];

const THEME_ICONS: Record<ThemeMode, string> = {
  system: '🌗',
  light: '☀️',
  dark: '🌙',
};

type PanelKey = 'location' | 'time' | 'mode' | 'mbti' | 'cuisine' | 'luckyDay';

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const {
    location,
    availableMinutes,
    mode,
    mbti,
    cuisines,
    luckyDay,
    setLocation,
    setAvailableMinutes,
    setMode,
    setMbti,
    setCuisines,
    setLuckyDay,
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
    reverseGeocode,
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

  // 럭키데이(오늘의 운세) 입력 폼 로컬 상태.
  const [birthDate, setBirthDate] = useState(luckyDay?.birthDate ?? '1990-05-23');
  const [birthTime, setBirthTime] = useState(luckyDay?.birthTime ?? '07:00');
  const [calendar, setCalendar] = useState<'solar' | 'lunar'>(
    luckyDay?.calendar ?? 'solar',
  );
  const [gender, setGender] = useState<'male' | 'female'>(
    luckyDay?.gender ?? 'female',
  );

  // 분 단위를 언어에 맞춰 "3시간", "1시간 30분", "45분" 형태로 표현.
  const formatMinutes = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}${t.hourUnit} ${m}${t.minuteUnit}`;
    if (h > 0) return `${h}${t.hourUnit}`;
    return `${m}${t.minuteUnit}`;
  };

  const MODE_LABELS: Record<TravelMode, string> = {
    walking: t.modeWalking,
    transit: t.modeTransit,
    driving: t.modeDriving,
  };

  const THEME_LABELS: Record<ThemeMode, string> = {
    system: t.themeSystem,
    light: t.themeLight,
    dark: t.themeDark,
  };

  const CUISINE_LABELS: Record<CuisineType, string> = {
    korean: t.cuisineKorean,
    chinese: t.cuisineChinese,
    japanese: t.cuisineJapanese,
    western: t.cuisineWestern,
    salad: t.cuisineSalad,
    coffee: t.cuisineCoffee,
    dessert: t.cuisineDessert,
    snack: t.cuisineSnack,
  };

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
      // 좌표를 가장 가까운 장소/주소 이름으로 변환해 라벨로 사용한다.
      // 실패하면 기본 라벨("현재 위치")로 폴백한다.
      const name = await reverseGeocode(coords);
      setLocation({ coords, label: name ?? t.currentLocation, fromGps: true });
      setManualLabel('');
      clearSuggestions();
      setCustomized((prev) => ({ ...prev, location: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorLocationFailed);
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

  // 맛집투어 음식 종류는 중복 선택. 같은 값을 다시 누르면 목록에서 제거한다.
  const handleToggleCuisine = (next: CuisineType) => {
    setCuisines(
      cuisines.includes(next)
        ? cuisines.filter((c) => c !== next)
        : [...cuisines, next],
    );
  };

  // 럭키데이 정보 저장. 생년월일은 필수 입력.
  const handleSaveLuckyDay = () => {
    if (!birthDate) return;
    setLuckyDay({ birthDate, birthTime, calendar, gender });
    setActivePanel(null);
  };

  // 럭키데이 정보 초기화.
  const handleClearLuckyDay = () => {
    setLuckyDay(null);
    setBirthDate('1990-05-23');
    setBirthTime('07:00');
    setCalendar('solar');
    setGender('female');
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      // 위치를 선택하지 않았으면 기본값으로 현재 위치를 사용한다.
      let effectiveLocation = location;
      if (!effectiveLocation) {
        const coords = await requestLocation();
        const name = await reverseGeocode(coords);
        effectiveLocation = { coords, label: name ?? t.currentLocation, fromGps: true };
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
        err instanceof Error ? err.message : t.errorRecommendFailed,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="home">
      <PolaroidBackdrop />
      <LanguageSwitch />
      <div className="theme-switch" role="group" aria-label={t.themeGroupLabel}>
        {THEME_OPTIONS.map((value) => (
          <button
            key={value}
            type="button"
            className={`theme-switch__option ${
              theme === value ? 'theme-switch__option--active' : ''
            }`}
            onClick={() => handleThemeChange(value)}
            aria-pressed={theme === value}
            aria-label={THEME_LABELS[value]}
            title={THEME_LABELS[value]}
          >
            {THEME_ICONS[value]}
          </button>
        ))}
      </div>
      <header className="home__hero">
        <h1 className="home__title">{t.homeTitle}</h1>
        <p className="home__subtitle">{t.homeSubtitle}</p>
      </header>

      <nav className="hashtags" aria-label={t.searchConditionsLabel}>
        <button
          type="button"
          className={`hashtag ${activePanel === 'location' ? 'hashtag--open' : ''} ${
            customized.location ? 'hashtag--set' : ''
          }`}
          onClick={() => togglePanel('location')}
          aria-expanded={activePanel === 'location'}
        >
          #{t.hashtagLocation}{location ? `·${location.label}` : ''}
        </button>
        <button
          type="button"
          className={`hashtag ${activePanel === 'time' ? 'hashtag--open' : ''} ${
            customized.time ? 'hashtag--set' : ''
          }`}
          onClick={() => togglePanel('time')}
          aria-expanded={activePanel === 'time'}
        >
          #{t.hashtagTime}·{formatMinutes(availableMinutes)}
        </button>
        <button
          type="button"
          className={`hashtag ${activePanel === 'mode' ? 'hashtag--open' : ''} ${
            customized.mode ? 'hashtag--set' : ''
          }`}
          onClick={() => togglePanel('mode')}
          aria-expanded={activePanel === 'mode'}
        >
          #{t.hashtagMode}·{MODE_LABELS[mode]}
        </button>
        <button
          type="button"
          className={`hashtag ${activePanel === 'mbti' ? 'hashtag--open' : ''} ${
            mbti ? 'hashtag--set' : ''
          }`}
          onClick={() => togglePanel('mbti')}
          aria-expanded={activePanel === 'mbti'}
        >
          #{t.hashtagMbti}{mbti ? `·${mbti}` : ''}
        </button>
        <button
          type="button"
          className={`hashtag ${activePanel === 'cuisine' ? 'hashtag--open' : ''} ${
            cuisines.length > 0 ? 'hashtag--set' : ''
          }`}
          onClick={() => togglePanel('cuisine')}
          aria-expanded={activePanel === 'cuisine'}
        >
          #{t.hashtagCuisine}{cuisines.length > 0 ? `·${cuisines.length}` : ''}
        </button>
        <button
          type="button"
          className={`hashtag ${activePanel === 'luckyDay' ? 'hashtag--open' : ''} ${
            luckyDay ? 'hashtag--set' : ''
          }`}
          onClick={() => togglePanel('luckyDay')}
          aria-expanded={activePanel === 'luckyDay'}
        >
          #{t.hashtagLuckyDay}{luckyDay ? `·${luckyDay.birthDate}` : ''}
        </button>
      </nav>

      {activePanel === 'location' && (
        <section className="card" aria-label={t.locationPanelLabel}>
          <p className="card__lead">{t.leadLocation}</p>
          <div className="location-actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleUseGps}
              disabled={gpsLoading}
            >
              {gpsLoading ? t.gpsLoading : t.useGps}
            </button>
            <div className="location-manual">
              <input
                type="text"
                className="input"
                placeholder={
                  searchAvailable ? t.searchPlaceholder : t.manualPlaceholder
                }
                value={manualLabel}
                onChange={(e) => handleManualChange(e.target.value)}
                aria-label={t.searchAriaLabel}
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
                  {t.confirm}
                </button>
              )}
            </div>

            {searchAvailable && (searchLoading || suggestions.length > 0) && (
              <ul className="suggestion-list" role="listbox">
                {searchLoading && (
                  <li className="suggestion-empty">{t.searching}</li>
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
              {t.selectedLocationPrefix}<strong>{location.label}</strong>{' '}
              <span className="location-coords">
                ({location.coords.lat.toFixed(1)}, {location.coords.lng.toFixed(1)})
              </span>
            </p>
          )}
          <p className="panel-hint">{t.locationHint}</p>
        </section>
      )}

      {activePanel === 'time' && (
        <section className="card" aria-label={t.timePanelLabel}>
          <p className="card__lead">{t.leadTime}</p>
          <div className="preset-group" role="group" aria-label={t.timePresetGroupLabel}>
            {TIME_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`chip ${availableMinutes === preset ? 'chip--active' : ''}`}
                onClick={() => handleSelectTime(preset)}
                aria-pressed={availableMinutes === preset}
              >
                {preset}{t.minutesSuffix}
              </button>
            ))}
          </div>
          <label className="slider-label">
            {t.adjustTime}<strong>{formatMinutes(availableMinutes)}</strong>
            <input
              type="range"
              min={10}
              max={180}
              step={5}
              value={availableMinutes}
              onChange={(e) => handleChangeTime(Number(e.target.value))}
              className="slider"
              aria-label={t.timeSliderLabel}
            />
          </label>
          <p className="panel-hint">{t.timeHint}</p>
        </section>
      )}

      {activePanel === 'mode' && (
        <section className="card" aria-label={t.modePanelLabel}>
          <p className="card__lead">{t.leadMode}</p>
          <div className="preset-group" role="group" aria-label={t.modeGroupLabel}>
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`chip ${mode === opt.value ? 'chip--active' : ''}`}
                onClick={() => handleSelectMode(opt.value)}
                aria-pressed={mode === opt.value}
              >
                {opt.icon} {MODE_LABELS[opt.value]}
              </button>
            ))}
          </div>
          <p className="panel-hint">{t.modeHint}</p>
        </section>
      )}

      {activePanel === 'mbti' && (
        <section className="card" aria-label={t.mbtiPanelLabel}>
          <p className="card__lead">{t.leadMbti}</p>
          <div className="mbti-grid" role="group" aria-label={t.mbtiGroupLabel}>
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
          <p className="panel-hint">{t.mbtiHint}</p>
        </section>
      )}

      {activePanel === 'cuisine' && (
        <section className="card" aria-label={t.cuisinePanelLabel}>
          <p className="card__lead">{t.homeFoodTour}</p>
          <div className="preset-group preset-group--wrap" role="group" aria-label={t.cuisineGroupLabel}>
            {CUISINE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`chip ${cuisines.includes(opt.value) ? 'chip--active' : ''}`}
                onClick={() => handleToggleCuisine(opt.value)}
                aria-pressed={cuisines.includes(opt.value)}
              >
                {opt.icon} {CUISINE_LABELS[opt.value]}
              </button>
            ))}
          </div>
          <p className="panel-hint">{t.cuisineHint}</p>
        </section>
      )}

      {activePanel === 'luckyDay' && (
        <section className="card" aria-label={t.luckyDayPanelLabel}>
          <p className="card__lead">{t.leadLuckyDay}</p>
          <div className="lucky-form">
            <label className="lucky-field">
              <span className="lucky-field__label">{t.birthDate}</span>
              <input
                type="date"
                className="input"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                aria-label={t.birthDate}
              />
            </label>

            <label className="lucky-field">
              <span className="lucky-field__label">{t.birthTime}</span>
              <input
                type="time"
                className="input"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                aria-label={t.birthTime}
              />
            </label>

            <div className="lucky-field">
              <span className="lucky-field__label">{t.calendar}</span>
              <div className="preset-group" role="group" aria-label={t.calendar}>
                <button
                  type="button"
                  className={`chip ${calendar === 'solar' ? 'chip--active' : ''}`}
                  onClick={() => setCalendar('solar')}
                  aria-pressed={calendar === 'solar'}
                >
                  {t.calendarSolar}
                </button>
                <button
                  type="button"
                  className={`chip ${calendar === 'lunar' ? 'chip--active' : ''}`}
                  onClick={() => setCalendar('lunar')}
                  aria-pressed={calendar === 'lunar'}
                >
                  {t.calendarLunar}
                </button>
              </div>
            </div>

            <div className="lucky-field">
              <span className="lucky-field__label">{t.gender}</span>
              <div className="preset-group" role="group" aria-label={t.gender}>
                <button
                  type="button"
                  className={`chip ${gender === 'female' ? 'chip--active' : ''}`}
                  onClick={() => setGender('female')}
                  aria-pressed={gender === 'female'}
                >
                  {t.genderFemale}
                </button>
                <button
                  type="button"
                  className={`chip ${gender === 'male' ? 'chip--active' : ''}`}
                  onClick={() => setGender('male')}
                  aria-pressed={gender === 'male'}
                >
                  {t.genderMale}
                </button>
              </div>
            </div>

            <div className="lucky-actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSaveLuckyDay}
                disabled={!birthDate}
              >
                {t.save}
              </button>
              {luckyDay && (
                <button
                  type="button"
                  className="btn"
                  onClick={handleClearLuckyDay}
                >
                  {t.reset}
                </button>
              )}
            </div>
          </div>
          <p className="panel-hint">{t.luckyDayHint}</p>
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
        {submitting ? t.submitLoading : t.submitIdle}
      </button>
    </main>
  );
}
