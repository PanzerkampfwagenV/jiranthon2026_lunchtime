# 2026-07-09 18:33 세션 핸드오프 — 프론트엔드 현황 및 다음 작업 가이드

> 다른 세션/작업자가 이 프로젝트를 바로 이어받기 위한 인수인계 문서입니다.

## 현재 상태 한줄 요약

프론트엔드(개발자 A) 입력 화면까지 구현·커밋·푸시 완료. Mock 데이터로 입력→추천→결과 흐름이 동작함. 백엔드(개발자 C)는 미착수, 개발자 B 결과/지도는 최소 구현만 존재.

## 저장소 구조

- `frontend/` — React + TypeScript + Vite (구현 진행 중)
- `backend/` — **아직 없음** (개발자 C가 생성 예정)
- `docs/` — 문서
  - `product-requirements.md` — 제품 요구사항(SSOT, *무엇을·왜*)  ※ 과거 `PRD.md`에서 이름 변경됨
  - `task-checklist.md` — 작업 체크리스트(*어디까지*)          ※ 과거 `TASKS.md`에서 이름 변경됨
  - `dashboard/index.html` — 진행 대시보드(`DATA` 객체 수정으로 갱신)
  - `planning/` — 기획 배경 자료
  - `devlog/` — 개발 로그

## 확정된 팀 결정 사항

- 저장소 구조: **FE/BE 분리**
- 지도/길찾기 API: **Kakao Map** (JavaScript 키 필요, 아직 미발급/미연동)
- API 계약: `POST /api/recommendations` — 상세는 product-requirements.md 3. API 계약 참조
- 환경변수: 키는 커밋 금지, `frontend/.env.example` 참고

## 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173/
npm run build   # 타입체크(tsc -b) + vite build
npm run lint    # oxlint
```

- `VITE_API_BASE_URL` 이 비어 있으면 `src/api/recommendations.ts` 의 **Mock 응답**을 사용.
- 값이 있으면 `${VITE_API_BASE_URL}/api/recommendations` 로 실제 요청.

## 프론트엔드 파일 맵

- `src/types/index.ts` — API 계약 기준 공용 타입(`LatLng`, `TravelMode`, `Place`, 요청/응답)
- `src/api/recommendations.ts` — 추천 요청 래퍼 + Mock 데이터(남산공원/북촌/청계천)
- `src/store/SearchContext.tsx` — 전역 상태(위치/시간/이동수단/결과)
- `src/hooks/useGeolocation.ts` — GPS 조회 + 권한 거부/실패 예외 처리
- `src/pages/HomePage.tsx` — 입력 화면(위치·시간·이동수단·추천요청)
- `src/pages/ResultsPage.tsx` — 결과 목록(개발자 B 담당, 현재 최소 구현)
- `src/App.tsx` / `main.tsx` — 라우팅(`/`, `/results`) + Provider

## 알려진 임시/미완 사항 (중요)

- **직접 위치 입력 좌표가 서울시청(37.5665, 126.978)으로 하드코딩**됨.
  `HomePage.tsx` 의 `handleManualConfirm` — Kakao 장소 검색 자동완성으로 교체 필요.
- 결과 화면에 **지도 시각화 없음**, 정렬/필터/상세 없음(개발자 B 작업).
- 백엔드 없음 → 실제 추천 로직/외부 API 연동 없음(개발자 C 작업).

## 다음 작업 후보 (우선순위 제안)

1. **개발자 C 백엔드 스캐폴딩** — 키 없이 착수 가능, FE는 Mock로 병렬 진행 중이라 대기 없음.
   `backend/` 초기화 → `POST /api/recommendations` 구현 → 완료 시 FE `.env` 의 `VITE_API_BASE_URL` 연결.
2. **개발자 B 결과·지도** — 데모 완성도 향상. Kakao Map SDK 마커/InfoWindow, 장소 카드, 정렬/필터.
3. **개발자 A 마무리** — Kakao 장소 검색 자동완성(키 발급 전제), 위치 좌표 확정.

## 참고 규칙 (AGENTS.md)

- 커밋: `[<scope>] <summary>` + 본문 불릿, 논리 단위로 분리, 한국어 우선.
- devlog: 주요 작업/커밋 후 `docs/devlog/YYYY-MM-DD-HH-mm-<topic>.md` 추가.
- main 직접 푸시는 이 저장소 기존 흐름상 허용되어 왔음.

## 관련 커밋

- `ac342ad` [devlog] 프론트엔드 스캐폴딩 작업 기록
- `2ae49d1` [docs] 프론트엔드 진행 상황 반영 및 README 정비
- `386806f` [frontend] Vite+React+TS 스캐폴딩 및 입력 화면 구현
- (이 커밋) [docs] 문서 파일명 변경 참조 정리 + 세션 핸드오프 문서
