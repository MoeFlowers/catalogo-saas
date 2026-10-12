# Contributing: Vitrina

This project runs a **phase-gated** process. Implementation happens only for the currently approved sprint; architectural decisions live in `docs/adr/` and must not be changed silently.

## Branch strategy

| Branch | Purpose |
|---|---|
| `main` | Stable/release history. Protected (protection enabled on the remote in a later step). |
| `develop` | Integration branch; sprint work merges here. |
| `feature/*` | A new capability (one purpose per branch). |
| `fix/*` | A bug fix. |
| `chore/*` | Tooling, config, docs, maintenance. |

- No direct pushes to protected branches (once protection is enabled).
- One purpose per branch; keep branches small.
- Do **not** create feature branches ahead of the sprint that needs them.

## Commits

- **Conventional Commits**: `type(scope): summary` — types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `ci`, `build`.
- Small, logical commits. Before each commit: `git status`, `git diff`, review the changed files; never stage unrelated files, secrets, or machine-specific paths.
- Commit tooling (commitlint + a pre-commit hook) is added in **Sprint 1.2**; until then follow the convention manually.

## Definition of Done (applies from the first code sprint)

A change is done only when: requirements/acceptance criteria are met; tests exist and pass; typecheck, lint, and build pass; security and tenant-isolation implications were considered; docs updated when needed; it works in Docker; and no unrelated code was modified.

## Environment & secrets

- Copy `.env.example` → `.env` (git-ignored). **Never** commit a real `.env` or any secret.
- Add an environment variable only when an approved sprint needs it. Runtime validation (Zod) lands in Sprint 1.2 (`src/lib/env.ts`).

## Platform note (Windows)

Windows is the primary development environment. The repo normalizes line endings to **LF** (`.gitattributes`, `.editorconfig`); do not commit CRLF. Repository scripts must not assume Linux-only shell behavior.

## Toolchain

Node **22 LTS** (`.nvmrc` / `engines`), **pnpm** via Corepack (`packageManager` pin), TypeScript **strict** (`tsconfig.json`). See [`README.md`](README.md).
