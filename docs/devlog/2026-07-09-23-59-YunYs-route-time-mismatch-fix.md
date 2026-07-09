# 2026-07-09 23:59 카드/지도 이동시간 불일치 수정

## 작업 요약

- 결과 목록 카드에 표시되는 이동시간(예: "약 18분")과, 지도에서 해당 장소를 선택했을 때 표시되는 이동시간(walking/transit 모드)이 서로 다르게 나오는 문제를 확인하고 수정했습니다.

## 원인 분석

```mermaid
flowchart LR
    A[Place.travelMinutes] -->|estimateTravelMinutes| B["거리 x 우회계수 / 속도"]
    C[GET /api/route 직선 대체] -->|straightLineRoute 이전| D["거리 / 속도 (우회계수 없음)"]
    B --> E[카드에 표시: 약 18분]
    D --> F[지도 선택 시 표시: 다른 값]
    E -.->|불일치| F
```

- `backend/src/geo.ts`의 `estimateTravelMinutes()`는 직선거리에 **우회 보정 계수**(walking 1.25, transit 1.4, driving 1.3)를 곱한 뒤 평균 속도로 나눠 이동시간을 추정합니다. 추천 목록(`Place.travelMinutes`)이 이 함수를 사용합니다.
- `backend/src/route.ts`의 `straightLineRoute()`(driving 모드에서 Kakao Mobility 실패 시, 또는 walking/transit에서 항상 사용되는 직선 대체 경로)는 **우회 계수 없이** 거리를 속도로만 나눠 별도로 계산하고 있었습니다.
- 같은 개념(추정 이동시간)에 대해 두 곳이 서로 다른 공식을 써서, walking/transit 모드에서 카드 목록과 지도 선택 시 표시가 어긋났습니다.

## 변경 사항

- `backend/src/route.ts`: `straightLineRoute()`가 자체 속도 상수(`AVG_SPEED_KMH`)로 재계산하던 부분을 제거하고, `geo.ts`의 `estimateTravelMinutes()`를 그대로 재사용하도록 통일.

## 검증

- `npm run typecheck` 통과.
- 동일한 `distanceKm`(예: 1.1km, walking)을 카드 계산식과 route API 계산식에 각각 넣어 두 값이 정확히 `18분`으로 일치함을 확인.
- driving 모드에서 Kakao Mobility 실제 경로 조회가 성공하는 경우는 여전히 실측값(`isActualRoute: true`)을 그대로 사용하며, 이 경우 추정치와 실측치가 다른 것은 의도된 정상 동작으로 유지.

## 관련 커밋 해시

- `c4446fb` [backend] 경로 조회 직선 대체 계산을 estimateTravelMinutes로 통일

## 다음 단계 / 남은 작업

- walking/transit도 실제 길찾기(대중교통 API 등) 연동 시 `isActualRoute: true`로 전환하는 부분은 아직 미구현.
