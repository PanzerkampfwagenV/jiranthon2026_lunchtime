import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { SearchProvider } from './store/SearchContext'
import {
  APP_SETTINGS,
  applyGlassmorphismSettings,
  applyTheme,
  getStoredTheme,
} from './config/settings'

// 화면이 그려지기 전에 테마·유리효과 설정을 적용해 깜빡임(FOUC)을 방지한다.
applyGlassmorphismSettings(APP_SETTINGS)
applyTheme(getStoredTheme() ?? APP_SETTINGS.theme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SearchProvider>
        <App />
      </SearchProvider>
    </BrowserRouter>
  </StrictMode>,
)
