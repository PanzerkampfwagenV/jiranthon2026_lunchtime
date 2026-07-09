# AGENTS.md

> Refer to [.user-agents.md](.user-agents.md) for all rules and guidelines.
> Record personal agent instructions in [.user-agents.md](.user-agents.md), and shared instructions in this file (AGENTS.md).

## Git Commit Convention

Always use the following commit message format:

```
[<scope>] <summary>
- detail 1
- detail 2
```

Split commits into logical units. Do not lump unrelated changes into a single commit.

Write commit messages in Korean whenever possible.

## Devlog Convention

Record development progress under `docs/devlog/` after major work is completed and committed.

- Add a devlog entry when a major task ends and its commit is done.
- Filename format: `YYYY-MM-DD-HH-mm-<topic>.md`.
- Each entry should include:
  - 작업 요약 (Work summary)
  - 변경 사항 (Changes: key files/features)
  - 관련 커밋 해시 (Related commit hashes)
  - 다음 단계 / 남은 작업 (Next steps, optional)
