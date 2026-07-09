# AGENTS.md

> Also refer to [.user-agents.md](.user-agents.md).

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
- Filename format: `YYYY-MM-DD-HH-mm-<topic>.md`.
- Each entry should include:
  - 작업 요약 (Work summary)
  - 변경 사항 (Changes: key files/features)
  - 관련 커밋 해시 (Related commit hashes)
  - 다음 단계 / 남은 작업 (Next steps, optional)
