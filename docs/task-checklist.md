# 작업 체크리스트 — 자투리 시간 여행 추천 웹앱

> **이 문서의 역할**: 실행 체크리스트. *어디까지 했는가*를 개발자별 작업 항목과 완료 상태(`[x]`/`[ ]`)로 추적합니다.
> **함께 보는 문서**: 제품 개요·기술 스택·역할 분담·API 계약·마일스톤 등 *무엇을·왜*는 [product-requirements.md](product-requirements.md)를 기준으로 합니다. 이 문서는 이를 중복 서술하지 않고, 각 항목에 PRD 기능 ID(예: `M-01`)를 연결합니다.
>
> 진행 현황은 [dashboard/index.html](dashboard/index.html)에서도 시각화됩니다.

---

## 공통 선행 작업 (전원 협의)

> 상세 배경은 [product-requirements.md — Phase 0 셋업 & 합의](product-requirements.md#phase-0--셋업--합의-전원-함께--선행-필수) 참고.

- [x] 저장소 구조 결정 (monorepo vs FE/BE 분리) — **FE/BE 분리** 채택
- [x] 사용할 지도/길찾기 API 확정 (Kakao/Naver/Google 중 택1) — **Kakao Map**
- [x] **API 계약 확정** — 요청/응답 스키마는 [product-requirements.md — 3. API 계약](product-requirements.md#3-api-계약-contract--병렬-작업의-기준) 참조
- [x] 브랜치 전략 / 커밋 컨벤션 / 코드 리뷰 규칙 합의
- [x] 환경변수(.env) 및 API 키 관리 방식 합의 (키는 저장소에 커밋 금지)
- [ ] 디자인 시안 / 와이어프레임 공유

---

## 개발자 A — 프론트엔드 (입력 & 첫 화면)

> 역할·범위: [product-requirements.md — 개발자 A 입력 화면](product-requirements.md#개발자-a--입력-화면)

### 초기 세팅
- [x] React + TypeScript + Vite 프로젝트 생성
- [x] 라우팅 구성 (첫 화면 → 결과 화면)
- [x] 공통 UI 컴포넌트 / 스타일 시스템 세팅 (예: Tailwind, CSS Modules)

### 첫 화면 & 위치 입력 (`M-01`)
- [x] 첫 화면(랜딩) 레이아웃 구현
- [x] **현재 위치(GPS)** 가져오기 — `navigator.geolocation` 연동
- [x] GPS 권한 거부 / 실패 시 예외 처리 및 안내 UI
- [ ] **지정 위치 입력** — 주소/장소 검색 자동완성 (지도 API 연동) *(현재 라벨만 입력, 좌표 임시 고정)*
- [ ] 위치 선택 결과를 지도 마커/좌표로 확정

### 자투리 시간 입력 (`M-02`, `M-03`, `M-04`)
- [x] 자투리 시간 입력 UI (슬라이더 10~180분 / 프리셋 버튼 30·60·90·120분 / 직접 입력)
- [x] 이동 수단 선택 옵션 (도보 / 대중교통 / 자동차)
- [x] 입력값 유효성 검증 (시간 범위, 위치 필수 등)

### 상태 관리 & 연동
- [x] 전역 상태 관리 세팅 (Context/Zustand 등)
- [x] 추천 요청 API 호출 및 로딩/에러 상태 처리 (`M-09`)
- [x] 결과 화면으로 데이터 전달

---

## 개발자 B — 프론트엔드 (결과 & 지도 시각화)

> 역할·범위: [product-requirements.md — 개발자 B 결과 화면 & 지도](product-requirements.md#개발자-b--결과-화면--지도)

### 추천 결과 화면 (`M-07`, `M-09`)
- [x] 추천 결과 목록 화면 레이아웃 — `ResultsPage` + 전용 CSS 분리
- [x] 장소 카드 컴포넌트 (이름, 카테고리, 이동시간, 거리, 썸네일) — `PlaceCard`
- [x] 정렬/필터 기능 (이동시간순, 거리순, 카테고리별) — `ResultControls`
- [x] 결과 없음 / 로딩 / 에러 상태 UI — 결과없음·필터결과없음·지도 로딩/에러 처리

### 지도 시각화 (`M-08`)
- [x] 지도 컴포넌트 통합 (Kakao SDK) — `MapView` + `useKakaoLoader` (키 미설정 시 폴백)
- [x] 사용자 위치 마커 + 추천 장소 마커 표시
- [x] 마커 클릭 시 장소 정보 팝업(InfoWindow) — HTML escape로 XSS 방지
- [x] 목록 ↔ 지도 상호 연동 (카드 hover/클릭 시 마커 강조, 마커 클릭 시 카드 강조)
- [ ] 경로/이동시간 시각화 (선택) *(미구현)*

### 상세 & 마무리 (`E-06`)
- [x] 장소 상세 화면/모달 (설명, 사진, 외부 지도 길찾기 링크) — `PlaceDetailModal`
- [x] 반응형(모바일 우선) 레이아웃 대응 — 768px↑ 지도·목록 2단
- [x] 접근성(ARIA, 키보드 내비게이션) 점검 — dialog role·ESC 닫기·포커스 이동, aria-pressed

---

## 개발자 C — 백엔드 & 추천 로직

> 역할·범위: [product-requirements.md — 개발자 C 백엔드 & 추천 로직](product-requirements.md#개발자-c--백엔드--추천-로직)

### 서버 세팅
- [x] 백엔드 프로젝트 초기화 (Express/FastAPI) — **Node.js + Express + TypeScript** (`backend/`)
- [x] 프로젝트 구조 / 라우팅 / 에러 핸들링 미들웨어 구성 — `app.ts` 중앙 에러 핸들러
- [x] CORS, 환경변수, 로깅 설정 — `CORS_ORIGIN`/`PORT` env, `.env.example`
- [ ] API 문서화 (Swagger/OpenAPI) *(README에 계약 기재, Swagger 미도입)*

### 외부 API 연동 (`M-06`)
- [ ] 지도/장소 검색 API 연동 (주변 여행지 조회) *(현재 시드 데이터로 대체)*
- [ ] 길찾기/이동시간 API 연동 (출발지 → 각 장소 소요시간) *(Haversine + 속도 추정으로 대체)*
- [ ] 외부 API 응답 캐싱 / 호출 최적화 (요금·속도 고려)

### 추천 로직 (`M-05`, `M-06`)
- [x] `POST /api/recommendations` 엔드포인트 구현 — 계약은 [product-requirements.md — 3. API 계약](product-requirements.md#3-api-계약-contract--병렬-작업의-기준)
- [x] 입력 위치 기준 후보 장소 수집 — `data/places.ts` 시드 12곳
- [x] **자투리 시간 내 도달 가능 여부 필터링** — 편도/왕복(`tripType`) 기준 적용
- [x] 이동수단별 이동시간 계산 로직 — `geo.ts` (도보/대중교통/자동차 속도·우회 보정)
- [x] 추천 랭킹/스코어링 (이동시간, 거리, 인기도 등 가중치) — 잔여시간 비율 + 태그 보너스
- [x] 입력값 유효성 검증 및 에러 응답 규격화 ([product-requirements.md — 3.3 에러 응답 규격](product-requirements.md#33-에러-응답-규격))

### 데이터 & 배포
- [x] 여행지 데이터 소스 확보/정제 (또는 검색 API 실시간 조회) — 서울 도심 시드 데이터
- [ ] 필요 시 DB 설계 (장소, 카테고리) *(현재 인메모리 시드)*
- [ ] 단위 테스트 (추천 로직 핵심 케이스)
- [ ] 배포 환경 구성 및 API 키 보안 관리

---

## 통합 & 마무리 (전원)

> 단계별 계획·완료 기준은 [product-requirements.md — Phase 2 연동 & 통합](product-requirements.md#phase-2--연동--통합--전원-일부-병렬) 및 [Phase 4 마무리 & 데모](product-requirements.md#phase-4--마무리--데모-전원) 참고.

- [ ] FE ↔ BE 통합 테스트
- [ ] 주요 시나리오 E2E 확인 (GPS 추천 / 지정 위치 추천 / 시간대별)
- [ ] 예외 케이스 점검 (위치 실패, 결과 없음, API 오류)
- [ ] 성능 점검 (응답 속도, 지도 렌더링)
- [ ] 배포 및 데모 준비

---

> **마일스톤 / 단계별 계획**은 [product-requirements.md — 5. 단계별 구현 계획](product-requirements.md#5-단계별-구현-계획-phased-implementation)과 [6. 마일스톤 요약](product-requirements.md#6-마일스톤-요약)을 단일 기준으로 합니다.
