# 2026-07-09 17:39 프론트엔드 스캐폴딩 및 입력 화면 구현

## 작업 요약

- FE/BE 분리 구조로 결정하고 `frontend/`에 Vite + React + TypeScript 프로젝트를 초기화했습니다.
- 지도 API는 Kakao Map으로 확정(연동은 추후), 현재는 Mock 추천 데이터로 전체 흐름을 동작시킵니다.
- 개발자 A 담당 영역인 입력 화면(위치/자투리 시간/이동 수단)과 라우팅, 전역 상태를 구현했습니다.

## 변경 사항

- `frontend/`: Vite React-TS 스캐폴딩 생성, `react-router-dom` 추가
- `frontend/src/types/index.ts`: API 계약(`docs/TASKS.md`) 기준 공용 타입 정의
- `frontend/src/api/recommendations.ts`: 추천 요청 함수. `VITE_API_BASE_URL` 미설정 시 Mock 응답 반환
- `frontend/src/store/SearchContext.tsx`: 위치/시간/이동수단/결과 전역 상태(Context)
- `frontend/src/hooks/useGeolocation.ts`: GPS 위치 조회 훅 + 권한 거부/실패 예외 처리
- `frontend/src/pages/HomePage.tsx`: 입력 화면(현재 위치/직접 입력, 시간 프리셋·슬라이더, 이동 수단, 추천 요청)
- `frontend/src/pages/ResultsPage.tsx`: 결과 목록 최소 구현(개발자 B 담당 영역 자리)
- `frontend/src/App.tsx`, `main.tsx`: 라우팅(`/`, `/results`) 및 Provider 구성
- `frontend/.env.example`: `VITE_API_BASE_URL`, `VITE_KAKAO_MAP_KEY` 예시(키는 커밋 금지)
- 기본 템플릿 파일(App.css, hero.png, 템플릿 index.css) 정리

## 검증

- `npm run build`(tsc + vite build), `npm run lint`(oxlint) 통과
- 브라우저에서 위치 입력 → 추천 받기 → 결과 목록 이동 흐름 정상 동작 확인

## 다음 단계

- 개발자 A: Kakao Map 장소 검색 자동완성으로 직접 위치 입력 교체(현재 좌표는 임시 고정)
- 개발자 B: 결과 화면 지도 시각화/장소 카드/정렬·필터 구현
- 개발자 C: `POST /api/recommendations` 백엔드 구현 후 `VITE_API_BASE_URL` 연동
- 대시보드(`docs/dashboard/index.html`) `DATA` 상태 업데이트
