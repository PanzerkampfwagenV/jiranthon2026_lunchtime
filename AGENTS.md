# AGENTS.md

> Also refer to [.user-agents.md](.user-agents.md).

## Memory Convention

Record persistent knowledge and things to remember in this file (AGENTS.md), not in the agent memory store.

Throughout every turn of the conversation, whenever something comes up that other teammates' agents should also remember, record it in this file (AGENTS.md) so the knowledge is shared across the team.

## Git Commit Convention

Always use the following commit message format:

```
[<scope>] <summary>
- detail 1
- detail 2
```

Split commits into logical units. Do not lump unrelated changes into a single commit.

Write commit messages in Korean whenever possible, using language that a mid-level IT engineer can understand.

## Documentation Convention

When writing Markdown documents, make full use of Mermaid diagrams so that humans can understand the content easily. Prefer diagrams (flowcharts, sequence diagrams, etc.) over long prose when explaining flows, architecture, or relationships.

## Devlog Convention

Record development progress under `docs/devlog/` after major work is completed and committed.

- Add a devlog entry when a major task ends and its commit is done.
- Filename format: `YYYY-MM-DD-HH-mm-<git-user-name>-<topic>.md` (use the value of `git config user.name` for the author).
- Each entry should include:
  - 작업 요약 (Work summary)
  - 변경 사항 (Changes: key files/features)
  - 관련 커밋 해시 (Related commit hashes)
  - 다음 단계 / 남은 작업 (Next steps, optional)

## Project Knowledge (팀 공유)

### LLM 추천 (백엔드)

- 추천 로직은 백엔드(`backend/src/recommendation.ts`)에서 처리한다. Claude 키가 있으면 LLM 추천, 없거나 실패하면 규칙 기반(거리/시간)으로 폴백한다.
- **사내 LLM 게이트웨이는 OpenAI 호환 형식**이다. Anthropic 네이티브 SDK(`/v1/messages` + `x-api-key`)가 아니라 `POST {BASE_URL}/chat/completions` + `Authorization: Bearer` 로 호출한다.
- Base URL: `ANTHROPIC_BASE_URL` (예: `https://jiran-llm.algorix.services/v1`), 모델: `ANTHROPIC_MODEL` (게이트웨이 지원 모델명 사용, 예: `claude-haiku-4.5`). 정식 Anthropic 모델명(`claude-3-5-*`)은 게이트웨이에서 404가 날 수 있다.
- Claude는 장소명만 생성하고, 실제 좌표는 카카오 로컬 검색(`KAKAO_REST_API_KEY`)으로 보정한다.

### 시크릿 관리

- 모든 API 키는 각 앱의 `.env`에만 두고 커밋하지 않는다(`.gitignore` 처리됨). Claude/카카오 REST 키는 반드시 **백엔드**에만 둔다. `VITE_` 접두사 변수는 브라우저에 노출되므로 프론트에는 지도 JavaScript 키처럼 노출돼도 되는 값만 둔다.
