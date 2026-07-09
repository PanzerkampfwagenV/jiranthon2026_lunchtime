# 자투리 시간 여행 추천 웹앱

현재 위치(GPS) 또는 지정 위치와 자투리 시간을 입력받아, 그 시간 안에 다녀올 수 있는 여행 장소를 추천하는 웹 서비스입니다.

## 저장소 구조

- `frontend/` — React + TypeScript + Vite 프론트엔드
- `docs/` — 기획/작업 문서 (PRD, TASKS, planning, devlog, 진행 대시보드)

백엔드(`backend/`)는 개발자 C가 추후 추가할 예정입니다.

## 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

- 기본 주소: http://localhost:5173/
- 환경변수는 `frontend/.env.example` 참고 (`.env` 로 복사해 사용, 키는 커밋 금지)
- `VITE_API_BASE_URL` 이 비어 있으면 Mock 추천 데이터로 동작합니다.

## 문서

- 제품 요구사항: [docs/PRD.md](docs/PRD.md)
- 작업 리스트: [docs/TASKS.md](docs/TASKS.md)
- 진행 대시보드: [docs/dashboard/index.html](docs/dashboard/index.html)
- 개발 로그: [docs/devlog/](docs/devlog/)