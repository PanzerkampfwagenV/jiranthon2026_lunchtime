export type ThemeMode = 'system' | 'light' | 'dark';

export interface AppSettings {
  theme: ThemeMode;
  glassmorphism: {
    heroCardOpacity: number;
    buttonChipOpacity: number;
  };
}

// 앱 전역 설정. 값을 바꾸려면 이 파일을 수정 후 다시 빌드/배포한다.
export const APP_SETTINGS: AppSettings = {
  theme: 'system',
  glassmorphism: {
    heroCardOpacity: 0.25,
    buttonChipOpacity: 0.15,
  },
};

const THEME_STORAGE_KEY = 'app-theme';

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

// 사용자가 직접 선택한 테마는 로컬 스토리지에 저장해 APP_SETTINGS 기본값보다 우선한다.
export function getStoredTheme(): ThemeMode | null {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeMode(stored) ? stored : null;
}

export function storeTheme(theme: ThemeMode): void {
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

// data-theme 속성을 <html>에 반영. 'system'이면 속성을 제거해 OS 설정(미디어쿼리)을 따르게 한다.
export function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;
  if (theme === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

// 설정값을 :root의 CSS 변수로 주입해 CSS에서 var()로 사용할 수 있게 한다.
export function applyGlassmorphismSettings(settings: AppSettings): void {
  const root = document.documentElement;
  root.style.setProperty(
    '--glass-hero-card-opacity',
    String(settings.glassmorphism.heroCardOpacity),
  );
  root.style.setProperty(
    '--glass-button-chip-opacity',
    String(settings.glassmorphism.buttonChipOpacity),
  );
}

