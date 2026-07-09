# 전체 문서 최신화

## 작업 요약

프로젝트가 초기 기획 이후 크게 발전했으나 README/체크리스트가 뒤처져 있어 최신 상태로 정리했다. 특히 루트 README는 여전히 "백엔드는 추후 추가 예정"이라고 안내하고 있었고, backend/frontend README는 실제 구현(LLM 추천, OSRM, 경로/상세 API, 해시태그 UI 등)을 반영하지 못한 상태였다.

## 변경 사항

- **README.md (루트)**: 백엔드 완성 반영. 아키텍처 개요(Mermaid) 추가, `dev-server.sh` 사용법(front/back/all 인자) 갱신, 프론트/백 수동 실행 절차 및 문서 링크 정리.
- **backend/README.md**: 환경변수 전체(Claude/게이트웨이/OSRM/Kakao) 문서화, OpenAI 호환 게이트웨이 주의사항 명시, 추천 처리 흐름(Mermaid) 추가, `GET /api/route`·`GET /api/place-detail` 엔드포인트 및 실제 `src/` 파일 구조(llm/kakao/osrm/route) 반영.
- **frontend/README.md**: Vite 기본 템플릿 문서를 프로젝트 실제 내용으로 교체. 실행/환경변수/화면 흐름(Mermaid)/디렉터리 구조/백엔드 연동 정리, 포트 고정(strictPort) 배경 설명.
- **docs/task-checklist.md**: 최근 완료 기능 반영 — 폴라로이드 배경·글래스모피즘·테마, 해시태그 기반 설정 UI, MBTI/럭키데이 선택 옵션, OSRM 경로 시각화, LLM 장소 상세 모달, place-detail 캐시.

## 검증

- 4개 문서 마크다운 오류 없음.
- README에서 링크한 경로(dashboard, AGENTS.md, 각 README, PRD/체크리스트, dev-server.sh) 실제 존재 확인.

## 관련 커밋 해시

- (이번 문서 최신화 커밋 추가 예정)
- 참고 기반 커밋: `ade0afb`(럭키데이), `a63db2d`(MBTI), `c1b84b0`(해시태그 UI), `5984262`(place-detail), `eca3534`(OSRM), `3e3a8c8`(route API)

## 다음 단계

- MBTI/럭키데이 기반 추천 로직 백엔드 반영.
- 추천/경로 응답 캐싱, 추천 로직 단위 테스트, 배포 환경 구성.
