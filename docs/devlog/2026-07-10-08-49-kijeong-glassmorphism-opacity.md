# 2026-07-10 08:49 메인 화면 글래스모피즘 투명도 상향

## 작업 요약

- 메인 화면의 히어로 카드와 버튼/칩 UI가 배경보다 너무 불투명해 보인다는 피드백에 따라, 글래스모피즘 배경 불투명도를 낮춰 더 투명하게 조정했습니다.
- 투명도 수치는 `frontend/src/config/settings.ts`의 `glassmorphism` 설정 한 곳에서 관리되며, CSS 변수(`--glass-hero-card-opacity`, `--glass-button-chip-opacity`)로 주입됩니다.

## 변경 사항

```mermaid
flowchart LR
    A[settings.ts<br/>APP_SETTINGS.glassmorphism] --> B[applyGlassmorphismSettings]
    B --> C[":root CSS 변수<br/>--glass-hero-card-opacity<br/>--glass-button-chip-opacity"]
    C --> D[HomePage.css<br/>rgba(255,255,255, var(...))]
```

- `frontend/src/config/settings.ts`
  - `heroCardOpacity`: `0.5` → `0.25` (히어로 카드 배경 불투명도)
  - `buttonChipOpacity`: `0.4` → `0.15` (버튼/칩 배경 불투명도)
  - 값이 낮을수록 배경이 더 비쳐 보인다(더 투명).

## 참고

- 전역 폰트를 손글씨체(`Gaegu`)로 바꾸는 시도도 있었으나, 가독성이 떨어져 시스템 폰트로 원복했다. 폴라로이드 캡션(`PolaroidBackdrop.css`)의 `Gaegu`는 그대로 유지된다.

## 관련 커밋

- `31b9d22` [frontend] 메인 화면 글래스모피즘 투명도 상향
