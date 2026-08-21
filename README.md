# Catalogo+WA

Multi-tenant, white-label **catalog + WhatsApp ordering** SaaS. An operator runs the platform under its own brand for multiple businesses; each business publishes a catalog, customers build an order, and the order is handed off to **WhatsApp** via a `wa.me` link.

> **Status:** Sprint 1.1 — Repository Foundation. No application, database, Docker, or product code yet (by design). See the roadmap below.

## Documentation (authoritative)

The architecture is decided and recorded in `docs/`. Read these rather than relying on this README for design detail:

- Planning & audit: [`docs/PHASE-0-DISCOVERY.md`](docs/PHASE-0-DISCOVERY.md) · [`docs/PHASE-0-FINAL-AUDIT.md`](docs/PHASE-0-FINAL-AUDIT.md) · [`docs/PHASE-1-PLAN.md`](docs/PHASE-1-PLAN.md)
- Design: [`docs/DOMAIN-MODEL.md`](docs/DOMAIN-MODEL.md) · [`docs/DATABASE-DESIGN.md`](docs/DATABASE-DESIGN.md)
- Decisions: [`docs/adr/`](docs/adr/) (ADR-0001 stack · ADR-0002 multi-tenancy · ADR-0003 money · ADR-0004 image storage)
- Business context: [`PLAN-DE-DESARROLLO.md`](PLAN-DE-DESARROLLO.md) *(business plan; its technical stack is **superseded** by ADR-0001)*

## Toolchain policy

| Tool | Policy |
|---|---|
| **Node.js** | **22 LTS** — enforced via [`.nvmrc`](.nvmrc) (`22`) and `engines.node` (`>=22.11.0 <23`). Do not use experimental/newer majors. |
| **Package manager** | **pnpm** only (no npm/yarn). Version pinned via `packageManager: pnpm@10.33.0`; enable with **Corepack**. |
| **Language** | **TypeScript strict** — see [`tsconfig.json`](tsconfig.json). No `any` as a shortcut. |
| **Line endings** | **LF** in the repo (`.gitattributes` / `.editorconfig`); Windows-dev safe. |

## Getting started (current sprint)

```bash
# 1. Use the pinned Node version
nvm use            # reads .nvmrc (or install Node 22 LTS)

# 2. Enable pnpm via Corepack (no global install of pnpm needed)
corepack enable
corepack use pnpm@10.33.0

# 3. Environment
cp .env.example .env   # fill values locally; .env is git-ignored
```

> There are **no dependencies to install yet** — application initialization begins in **Sprint 1.2**. Running the app, database, Docker, and tests arrives in later sprints (see below).

## Repository workflow

- Branches: `main` (stable) · `develop` (integration) · `feature/*` · `fix/*` · `chore/*`.
- Conventional Commits; small, logical commits.
- Full contribution rules and Definition of Done: [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Roadmap (phase-gated)

Foundation (**Phase 1**) → Identity & Multi-Tenancy (**Phase 2**) → Plans & Entitlements → Catalog → Storefront → Cart & Orders → Operator Admin → Multi-Currency → Analytics → Hardening → Release. Each phase is planned and approved before implementation. Current: **Phase 1 / Sprint 1.1**.

## Ownership

Proprietary software owned by the developer; licensed to operators (rental model). Not for redistribution.
