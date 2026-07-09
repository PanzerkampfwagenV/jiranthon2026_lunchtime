import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Kakao 개발자 콘솔에 등록된 도메인이 http://localhost:5173 이므로
    // 포트를 고정한다. strictPort로 5173이 점유된 경우 5174로 넘어가
    // Kakao SDK가 401(ERR_BLOCKED_BY_ORB)로 차단되는 문제를 방지한다.
    port: 5173,
    strictPort: true,
  },
})
