# PHASE 1 — Foundation — Execution Plan (PLAN ONLY)

- **Status:** Proposed — awaiting Director approval to implement
- **Date:** 2026-08-21
- **Depends on:** Phase 0 approved + `PHASE-0-FINAL-AUDIT.md` verdict = **READY FOR PHASE 1**
- **Implements:** ADR-0001..0004 (foundation subset only)
- **Hard rule:** Foundation ONLY. **No** auth, users, roles, operators, businesses, catalogs, products, carts, orders, WhatsApp, plans, subscriptions, analytics, or exchange-rate providers. The only entities permitted are the **minimum** required to prove the infrastructure works (a throwaway `health_probe` row — see Sprint 1.3).
- **This is a plan. Nothing here is implemented until you approve.**

## Sprint map & order

```
1.1 Repository Foundation
      ↓
1.2 Application Foundation
      ↓
1.3 Database Foundation  ←──┐
      ↓                      │ (1.4 wraps 1.2/1.3 in containers)
1.4 Docker Foundation  ──────┘
      ↓
1.5 Testing Foundation
      ↓
1.6 CI Foundation
```

Each sprint is a small branch that leaves lint + typecheck + tests + build **green** before merge to `develop`.

---

## Sprint 1.1 — Repository Foundation

### Goal
Establish the versioned project skeleton, conventions, and language/tooling baseline so all later work is reproducible and consistent.

### Scope
- Git init; branch model `main` / `develop` / `feature|fix|chore/*`; conventional-commits.
- Repository layout (top-level dirs, `src/`, `docs/` already present, `test/`, `e2e/`).
- `.gitignore`, `.gitattributes` (LF), `.editorconfig`, `.nvmrc` (Node 22).
- Package manager = **pnpm 10**; `package.json` + scripts placeholders.
- **TypeScript strict** config (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, no implicit `any`).
- Environment strategy + `.env.example`; Zod-based env schema stub (used in 1.2).

### Out of Scope
- Any application/runtime code, Next.js, DB, Docker, CI (later sprints).
- Remote git hosting / branch protection / secrets.

### Tasks (ordered)
1. `git init`; create `develop` from `main`; document branch rules in `CONTRIBUTING.md`.
2. Add `.gitignore` (node, next, env, coverage, docker volumes), `.gitattributes`, `.editorconfig`, `.nvmrc`.
3. `pnpm init`; set `packageManager`, `engines.node >=22`.
4. Add `tsconfig.json` (strict base) + `tsconfig.paths` aliases (`@/modules/*`, `@/lib/*`).
5. Add commit convention (`commitlint.config.cjs`) + `CHANGELOG.md` (Keep a Changelog) + PR template.
6. Draft `.env.example` and `src/lib/env.ts` schema stub (no secrets).

### Files
`.gitignore` · `.gitattributes` · `.editorconfig` · `.nvmrc` · `package.json` · `pnpm-workspace.yaml` (single package for now) · `tsconfig.json` · `commitlint.config.cjs` · `CHANGELOG.md` · `.github/pull_request_template.md` · `.env.example` · `CONTRIBUTING.md`.

### Dependencies
None (greenfield).

### Tests
None yet (no runtime code); `pnpm typecheck` must pass on the empty project.

### Acceptance Criteria
- Repo initialized; `develop` branch exists; conventions documented.
- `pnpm install` succeeds; `pnpm typecheck` passes on an empty `src/`.
- `.env.example` present; no real secrets tracked.

### Definition of Done
Conventions committed; typecheck green; `CONTRIBUTING.md` describes branch/commit/DoD.

### Risks
- Windows line-ending/path friction → mitigated by `.gitattributes` (LF) + `.editorconfig`.

### Rollback
Discard the `chore/repo-init` branch; nothing external created.

---

## Sprint 1.2 — Application Foundation

### Goal
Boot a minimal Next.js (App Router) modular monolith shell with linting, formatting, module-boundary enforcement, base error handling, and a health endpoint.

### Scope
- Next.js (App Router, TS) minimal app that builds and serves.
- Module skeleton `src/modules/*` (empty **placeholder contracts** only) per PHASE-0 §10.
- Path aliases; ESLint (TS + import + **boundary** rules via `dependency-cruiser`/`eslint-plugin-boundaries`); Prettier.
- Pre-commit (lightweight): `lint-staged` + Husky running format/lint/typecheck on staged files (**justified**: cheap guard against broken commits).
- Base error handling: a typed `AppError` + a route-level error boundary; structured logging (`pino`).
- **Health endpoints:** `GET /api/health` (liveness, static 200) — DB readiness added in 1.3.

### Out of Scope
- DB access, migrations, Docker (1.3/1.4).
- Any real module logic, auth, UI beyond a placeholder page + health route.

### Tasks (ordered)
1. Scaffold Next.js App Router app (`src/app`), strict TS wired to 1.1 tsconfig.
2. Create empty `src/modules/<name>/index.ts` placeholder contracts for all 16 modules.
3. Configure ESLint + Prettier; add `dependency-cruiser` rule: modules may not import another module's internals (only its `index.ts`).
4. Add `pino` logger (`src/lib/logger.ts`) and `AppError` (`src/lib/errors.ts`) + app error boundary.
5. Wire Zod env validation (`src/lib/env.ts`) to run at server bootstrap (fail-fast).
6. Implement `GET /api/health` (liveness).
7. Add Husky + lint-staged pre-commit.

### Files
`next.config.ts` · `src/app/layout.tsx` · `src/app/page.tsx` · `src/app/api/health/route.ts` · `src/modules/*/index.ts` (16) · `.eslintrc.cjs` · `.dependency-cruiser.cjs` · `.prettierrc` · `src/lib/{env,logger,errors}.ts` · `.husky/pre-commit` · `lint-staged` config.

### Dependencies
Sprint 1.1 (tooling/TS/env stub).

### Tests
- Unit smoke: env loader rejects an invalid env; `AppError` shape.
- Boundary check: a deliberate cross-module import fails `pnpm lint` (verified locally, not committed).

### Acceptance Criteria
- `pnpm dev` serves the app; `GET /api/health` = 200.
- `pnpm lint`, `pnpm typecheck`, `pnpm build` pass.
- Boundary rule blocks illegal cross-module imports.

### Definition of Done
App builds/serves; health liveness green; lint/typecheck/build green; boundaries enforced; pre-commit active.

### Risks
- Boundary tooling false positives → start with a documented, permissive rule set; tighten iteratively.
- Over-scaffolding → modules are **empty** placeholders; no speculative code.

### Rollback
Discard `chore/app-foundation`; no persistent state.

---

## Sprint 1.3 — Database Foundation

### Goal
Provision PostgreSQL access with Drizzle, a working migration system, the DB **role model**, seed/test strategies, and prove connectivity via a DB readiness health check.

### Scope
- Drizzle + drizzle-kit config; typed DB client (`src/lib/db`).
- **DB roles** (per audit §9): `app_owner` (DDL/seed, offline), `app_runtime` (non-owner, no `BYPASSRLS`), and an offline **maintenance** role note for future seeds. *(RLS policies themselves are P2 — not here.)*
- **Baseline migration** `0000_baseline`: enable extensions (`pgcrypto` for UUID), create roles/grants, and a single throwaway `health_probe(id, checked_at)` table used **only** to verify connectivity/migrations (removed or superseded in P2).
- Migration + seed npm scripts; dev seed = insert one `health_probe` row.
- **Test DB strategy:** ephemeral Postgres via **Testcontainers** (integration), migrations applied per run.
- **DB readiness:** `GET /api/health/db` runs `SELECT 1` as `app_runtime`.

### Out of Scope
- **No domain tables** (operators/businesses/products/orders/etc.), **no RLS policies** (P2), no entitlements, no money columns.
- No production DB provisioning.

### Tasks (ordered)
1. Add Drizzle + drizzle-kit; `drizzle.config.ts`; `src/lib/db/index.ts` (runtime client using `app_runtime`).
2. Author `0000_baseline` migration: extensions, `app_owner`/`app_runtime` roles + grants, `health_probe` table.
3. Add scripts: `db:migrate`, `db:seed` (insert probe row), `db:reset`.
4. Implement `GET /api/health/db` (readiness via `SELECT 1`).
5. Add Testcontainers harness (used fully in 1.5) to apply migrations to an ephemeral DB.

### Files
`drizzle.config.ts` · `src/lib/db/index.ts` · `src/lib/db/schema/health.ts` (probe only) · `drizzle/0000_baseline.sql` · `scripts/seed.ts` · `src/app/api/health/db/route.ts`.

### Dependencies
Sprint 1.2 (app + env); local/Docker Postgres (Docker container arrives in 1.4; until then a local/temporary Postgres or the Testcontainers harness proves it).

### Tests
- Integration smoke (Testcontainers): boot Postgres → run `0000_baseline` → connect as `app_runtime` → `SELECT 1` → insert/read one `health_probe` row.
- Assert `app_runtime` is **not** a superuser and lacks `BYPASSRLS`.

### Acceptance Criteria
- Migration applies cleanly from an empty DB; seed inserts the probe row.
- `GET /api/health/db` = 200 when DB reachable, 503 when not.
- Integration smoke green.

### Definition of Done
Migrations reproducible; roles created with least privilege; readiness endpoint green; integration smoke green.

### Risks
- Role/grant nuances on managed Postgres later → keep role creation idempotent and documented; revisit for prod in P11.
- Accidental scope creep into domain tables → guarded by the "probe table only" rule.

### Rollback
`db:reset` drops/recreates; discard `feat/db-foundation` branch. No production data exists.

---

## Sprint 1.4 — Docker Foundation

### Goal
Make the whole stack reproducible with Docker Compose for development, with health checks and a persistent DB volume, plus a production Dockerfile strategy (defined, not deployed).

### Scope
- `docker-compose.yml` (base) + `docker-compose.override.yml` (dev): **app**, **postgres:16**, **minio** (dev object storage, required now so ADR-0004's port has a dev backend), **mailpit** (dev email capture, for later phases; cheap to include).
- Health checks for app + postgres (+ minio); named **persistent volume** for postgres; `restart` policies for prod compose.
- `docker-compose.prod.yml` **skeleton** (app + postgres + Caddy) — defined only.
- Multi-stage **production Dockerfile** (non-root user) — defined; not built/deployed.
- Environment separation via compose overrides + `.env` (validated).

### Out of Scope
- Any real deployment, TLS issuance, staging/prod infrastructure.
- Redis (deferred, ADR-0001).

### Tasks (ordered)
1. Write `Dockerfile` (multi-stage; `node:22`; non-root).
2. Write `docker-compose.yml` + `docker-compose.override.yml` (dev services + healthchecks + volume).
3. Add `docker-compose.prod.yml` skeleton + `Caddyfile` skeleton (no domains yet).
4. Document `docker compose up` dev flow and recovery in `README.md`.

### Files
`Dockerfile` · `docker-compose.yml` · `docker-compose.override.yml` · `docker-compose.prod.yml` · `Caddyfile` · `.dockerignore` · `README.md` (run/recover section).

### Dependencies
Sprints 1.2 (app) + 1.3 (db).

### Tests
- Manual/scripted: `docker compose up` → app healthy, `GET /api/health` and `/api/health/db` = 200 from inside the compose network.
- Healthchecks report `healthy` for app + postgres.

### Acceptance Criteria
- `docker compose up` boots app + postgres + minio + mailpit with green healthchecks.
- DB data persists across `down`/`up` (named volume).
- Prod Dockerfile builds locally (`docker build`) without being deployed.

### Definition of Done
Reproducible dev environment; healthchecks green; volume persists; prod Dockerfile builds; README documents startup/recovery.

### Risks
- Docker Desktop/WSL quirks on Windows → document required Docker settings; keep images small.
- MinIO/mailpit unused until later phases → included now only because dev parity is cheap; revisit if it adds friction.

### Rollback
`docker compose down -v` clears state; discard `feat/docker-foundation`.

---

## Sprint 1.5 — Testing Foundation

### Goal
Stand up the test pyramid harness (unit, integration, e2e) with a clean test-DB lifecycle and first smoke tests, plus stable test commands.

### Scope
- **Unit:** Vitest config.
- **Integration:** Vitest + **Testcontainers** (ephemeral Postgres, migrations applied, torn down).
- **e2e:** Playwright bootstrap against the running app.
- Test commands: `test:unit`, `test:int`, `test:e2e`, `test` (unit+int).
- Coverage baseline (report only; no arbitrary threshold gate yet).

### Out of Scope
- Domain/business test suites (later phases), cross-tenant RLS suite (P2), money/entitlement tests (P3/P6).

### Tasks (ordered)
1. Add Vitest config + `test/unit/*` smoke (env, error).
2. Add Testcontainers integration setup (`test/integration/setup.ts`) reusing 1.3 migration flow; `test/integration/db.smoke.test.ts`.
3. Add Playwright config + `e2e/smoke.spec.ts` (app serves; `/api/health` 200).
4. Wire coverage reporting.

### Files
`vitest.config.ts` · `test/unit/smoke.test.ts` · `test/integration/setup.ts` · `test/integration/db.smoke.test.ts` · `playwright.config.ts` · `e2e/smoke.spec.ts`.

### Dependencies
Sprints 1.2 (app) + 1.3 (db/migrations).

### Tests
This sprint **is** the tests: one green smoke per layer.

### Acceptance Criteria
- `pnpm test` (unit + integration) green; `pnpm test:e2e` green.
- Integration spins/tears down Postgres cleanly (no leaked containers).

### Definition of Done
All three layers runnable and green locally; commands documented; coverage report emitted.

### Risks
- Testcontainers needs Docker available (local + CI) → documented; CI provides Docker.
- Flaky e2e on cold start → add readiness wait before Playwright runs.

### Rollback
Discard `test/harness`; no persistent state.

---

## Sprint 1.6 — CI Foundation

### Goal
A GitHub Actions pipeline that runs the quality gate on every PR and keeps `develop`/`main` green.

### Scope
- Workflow: `install → lint → typecheck → unit → integration → build`.
- pnpm cache; Docker available for Testcontainers integration job.
- Dependency audit + basic secret scan steps.
- Branch protection **documented** (enable is a manual GitHub action, not performed here).

### Out of Scope
- **Deployment/CD** (no staging/prod deploy in Phase 1).
- e2e in CI initially optional (can run nightly) to keep PRs fast — decision noted, default: run e2e nightly + on storefront-touching PRs (from P5).

### Tasks (ordered)
1. `.github/workflows/ci.yml`: matrix Node 22; steps install→lint→typecheck→unit→integration→build.
2. Add pnpm store cache; enable Docker for the integration job.
3. Add `pnpm audit` (non-blocking initially) + secret scan (e.g., gitleaks) step.
4. Document required status checks + branch protection in `CONTRIBUTING.md`.

### Files
`.github/workflows/ci.yml` · `CONTRIBUTING.md` (CI + protection section).

### Dependencies
Sprints 1.1–1.5 (everything the pipeline runs).

### Tests
- The pipeline itself is validated by a green run on `develop` with the empty foundation.

### Acceptance Criteria
- CI runs the full gate and is **green** on the empty app.
- A failing lint/type/test **fails** the pipeline (verified with a temporary failing commit, then reverted).
- Secret scan runs.

### Definition of Done
CI green on `develop`; gate blocks on failures; protection documented (enable is a Director/GitHub action).

### Risks
- Integration job time (container pulls) → cache images/layers; keep Postgres image pinned.
- Secret-scan false positives → allowlist documented.

### Rollback
Disable/remove the workflow; discard `ci/pipeline`. CI has no external side effects.

---

## Phase 1 exit criteria (all sprints)
- App builds and serves; `/api/health` + `/api/health/db` green.
- `docker compose up` reproduces the full dev stack with healthchecks.
- Migrations apply from clean DB via least-privilege roles.
- Unit + integration smoke green; e2e smoke green; CI green.
- Module boundaries enforced; no product features; no domain tables (only the `health_probe`).
- Docs: `README` (run/recover), `ARCHITECTURE.md` (links ADRs + module map), `CONTRIBUTING.md`.
- **Then:** proceed to the Phase 2 plan (Identity & Multi-Tenancy), where RLS + the cross-tenant suite (ADR-0002, audit I-2/§9) are implemented.
