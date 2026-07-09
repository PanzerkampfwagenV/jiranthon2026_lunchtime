# Backend — 자투리 시간 여행 추천 API

Node.js + Express + TypeScript 기반 추천 API 서버.

## 실행

```bash
npm install
cp .env.example .env   # 필요 시 값 수정
npm run dev            # 개발 (tsx watch)
```

빌드 후 실행:

```bash
npm run build
npm start
```

## 환경변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `PORT` | 4000 | 서버 포트 |
| `CORS_ORIGIN` | (전체 허용) | 허용 오리진, 쉼표 구분 |
| `KAKAO_REST_API_KEY` | - | (선택) 외부 API 연동용 |

## API

### `GET /health`

```json
{ "status": "ok" }
```

### `POST /api/recommendations`

요청/응답/에러 규격은 [docs/product-requirements.md — 3. API 계약](../docs/product-requirements.md#3-api-계약-contract--병렬-작업의-기준) 기준.

요청 예:

```json
{
  "location": { "lat": 37.5665, "lng": 126.978 },
  "availableMinutes": 90,
  "mode": "driving",
  "tags": ["cafe", "nature"],
  "tripType": "roundtrip"
}
```

## 프론트엔드 연동

프론트엔드 `.env`에 다음을 설정하면 Mock 대신 이 서버를 호출한다:

```
VITE_API_BASE_URL=http://localhost:4000
```

## 구조

```
src/
  server.ts          # 진입점
  app.ts             # Express 앱 구성 (CORS, 라우팅, 에러 핸들러)
  routes.ts          # /api 라우터
  validation.ts      # 요청 검증
  recommendation.ts  # 추천 로직 (필터링 + 스코어링)
  geo.ts             # 거리/이동시간 계산
  errors.ts          # AppError (에러 코드 규격)
  types.ts           # 공용 타입
  data/places.ts     # 후보 장소 시드 데이터
```

## TODO

- Kakao 장소 검색 API 실시간 조회로 후보 데이터 대체
- Kakao 길찾기 API로 이동시간 추정 대체
- 외부 API 응답 캐싱
