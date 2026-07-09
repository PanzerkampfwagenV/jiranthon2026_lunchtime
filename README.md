# 자투리 시간 여행 추천 웹앱

현재 위치(GPS) 또는 지정 위치와 자투리 시간을 입력받아, 그 시간 안에 다녀올 수 있는 여행 장소를 추천하는 웹 서비스입니다.

## 저장소 구조

- `frontend/` — React + TypeScript + Vite 프론트엔드
- `docs/` — 기획/작업 문서 (제품 요구사항, 작업 체크리스트, planning, devlog, 진행 대시보드)

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
- `VITE_KAKAO_MAP_KEY` 가 있어야 지도가 표시됩니다. 없으면 목록만 동작합니다.
  카카오 개발자 콘솔에서 앱의 Web 플랫폼 도메인에 `http://localhost:5173` 을 등록해야 합니다.

## 개발 서버 관리 스크립트

포그라운드로 매번 실행하는 대신, 백그라운드에서 서버를 시작/중지/재시작할 수 있는 스크립트를 제공합니다.

```bash
./scripts/dev-server.sh start     # 백그라운드로 서버 시작 (필요 시 npm install 자동 실행)
./scripts/dev-server.sh stop      # 서버 중지
./scripts/dev-server.sh restart   # 재시작
./scripts/dev-server.sh status    # 실행 여부 확인
./scripts/dev-server.sh logs      # 로그 실시간 확인 (Ctrl+C 로 종료)
```

- PID/로그는 `.run/` 에 저장되며 Git 에서 제외됩니다.
- 로그 파일: `.run/dev-server.log`


## 문서

- 제품 요구사항 (무엇을·왜): [docs/product-requirements.md](docs/product-requirements.md)
- 작업 체크리스트 (어디까지): [docs/task-checklist.md](docs/task-checklist.md)
- 진행 대시보드: [docs/dashboard/index.html](docs/dashboard/index.html)
- 개발 로그: [docs/devlog/](docs/devlog/)