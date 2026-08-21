# ADR-0001 — Stack & Application Architecture

- **Status:** **Accepted** (Director approved 2026-08-21)
- **Date:** 2026-08-21
- **Deciders:** Director (final), principal engineering team (proposer)
- **Supersedes:** the technical stack in `PLAN-DE-DESARROLLO.md` (NestJS + Redis)

## Context

We must pick the application architecture and stack for a multi-tenant catalog + WhatsApp SaaS MVP. Constraints from the master directive:

- **Modular monolith first**; microservices only with justification.
- **No Redis** (or any component) without a *demonstrated* need.
- Prefer **boring, proven** technology; explicit code; testability; server-side enforcement.
- Small team, fast MVP, SEO-critical public storefront, strict multi-tenancy, infra target **≤ ~$75/mo**.
- TypeScript, migrations, Docker reproducibility, no `any`.

The prior business plan proposed **Next.js + NestJS + Redis** (two apps). The directive explicitly says *do not blindly accept it* and to compare alternatives.

## Options considered

### Option A — Next.js (full-stack) + Drizzle + PostgreSQL + Docker (modular monolith)
One deployable Next.js app (App Router) providing SSR storefront **and** the API (route handlers + server actions). Internal `modules/` with explicit contracts. Drizzle ORM with explicit migrations. No Redis.

- **+** Lowest dev & ops complexity; one deploy target; one language; fastest MVP.
- **+** First-class SSR/SSG → best SEO for public catalogs.
- **+** Cheapest to run (single container + Postgres); fits ≤$75/mo.
- **+** Drizzle is SQL-first and lets us run raw SQL for **RLS / `SET LOCAL`** (needed for tenancy).
- **−** Module boundaries are a *discipline* (enforced by lint/deps tooling), not a process boundary.
- **−** Vertical scaling first; horizontal split needs extracting a module later.

### Option B — Next.js + NestJS + PostgreSQL + Redis (two apps)
Separate frontend (Next.js) and backend (NestJS) + Redis.

- **+** Strong service boundaries; independent scaling; Nest structure/DI.
- **−** Two deploy targets, more infra (incl. **Redis with no current need**), slower MVP, higher cost.
- **−** Cross-app auth/session plumbing; more surface for a small team.

### Option C — Monorepo with independently deployable FE/BE services
Turbo/nx monorepo, separate deployables.

- **+** Best long-term scalability and boundary enforcement.
- **−** Highest operational complexity now; premature for MVP scale and team size.

## Decision (proposed)

**Adopt Option A:** a **Next.js (App Router) modular monolith** with **Drizzle + PostgreSQL 16**, **TypeScript strict**, **Zod** validation, **server-side DB-backed sessions** with **argon2**, **object storage** for images (ADR-0004), packaged with **Docker Compose**. **Redis is deferred.**

Module boundaries are enforced with `dependency-cruiser`/`eslint-plugin-boundaries`. Each module exposes a typed contract; no module touches another's tables directly.

### "No Redis" — explicit triggers to revisit
Add Redis (or a queue) **only** when one of these is demonstrated:
1. Background/async work that must survive process restarts and retries (e.g., image processing at volume, WhatsApp Cloud API in a later phase, scheduled rate refresh at scale).
2. Cross-instance shared cache once we run **more than one app instance**.
3. Rate-limiting/session load that Postgres/in-process can no longer serve within SLOs.

Until then: exchange-rate cache = a `exchange_rates` table with `fetched_at`/TTL; rate limiting = Postgres or in-process token bucket; sessions = DB table.

## Consequences

- **Positive:** fastest correct MVP; minimal ops; strong SEO; low cost; clear upgrade path (extract a module behind its contract into a service if/when justified).
- **Negative / mitigations:** boundary erosion risk → enforced by tooling + review; single-process scaling ceiling → acceptable at target scale, revisit in P10 with load tests.
- **Follow-ups:** ADR-0002 (tenancy), ADR-0003 (money), ADR-0004 (storage). Possible future ADR for background jobs if a Redis trigger fires.

## Compliance with directive execution rules

- Modular monolith ✔ · no microservices ✔ · no premature Redis ✔ · no speculative abstractions ✔ · boring/proven ✔ · server-side enforcement enabled ✔ · testable (pure modules) ✔.
