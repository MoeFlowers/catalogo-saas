# PHASE 0 — Final Consistency Audit

- **Status:** Complete
- **Date:** 2026-08-21
- **Auditor:** Principal engineering team (audit role)
- **Mandate:** Verify cross-document consistency of the approved Phase 0 architecture before Phase 1 planning. No code, no Git, no Docker, no implementation.
- **Authority rule:** Approved Phase 0 decisions (ADR-0001..0004, confirmed D3–D9) are authoritative. Approved architectural decisions are **not** silently modified; refinements are logged as Important/Minor issues and explicit assumptions for the relevant future phase.

---

## 1. Executive summary

The approved Phase 0 architecture is **internally consistent and implementable**. Across 8 documents there are **zero BLOCKING inconsistencies**. Three **IMPORTANT** items and three **MINOR** items were found; all are *refinements/documentation* to apply in the phase that first touches them (P2 for RLS scoping, P8 for FX timestamp, P3 for the UTC quota computation) — **none affect Phase 1 (Foundation)**, which builds only tooling/DB-plumbing and no domain tables.

The most substantive finding is an RLS **scoping refinement**: operator-scoped tables (`businesses`, `plans`, `operators`) must use a **role-aware** policy so a `BUSINESS_USER` cannot read *sibling* businesses' configuration within the same operator. This does not contradict ADR-0002 (business remains the primary tenant); it makes isolation stricter and is a P2 task.

**Verdict: `READY FOR PHASE 1`.**

---

## 2. Documents audited

| # | Document | Read | Role in architecture |
|---|---|---|---|
| 1 | `PLAN-DE-DESARROLLO.md` | ✅ | Business/PM plan (pre-directive). Contains a **superseded** technical stack. |
| 2 | `docs/PHASE-0-DISCOVERY.md` | ✅ | Master Phase 0 report; decision log (approved). |
| 3 | `docs/DOMAIN-MODEL.md` | ✅ | Aggregates, VOs, states, invariants, order state machine. |
| 4 | `docs/DATABASE-DESIGN.md` | ✅ | Schema, roles, RLS, indexes. |
| 5 | `docs/adr/ADR-0001-stack-and-architecture.md` | ✅ | Accepted: Next.js modular monolith + Drizzle + PostgreSQL; Redis deferred. |
| 6 | `docs/adr/ADR-0002-multi-tenancy.md` | ✅ | Accepted: defense in depth (context + scoped DAL + RLS). |
| 7 | `docs/adr/ADR-0003-money-and-currency.md` | ✅ | Accepted: integer minor units + Money VO; immutable snapshots. |
| 8 | `docs/adr/ADR-0004-image-storage.md` | ✅ | Accepted: object storage behind a port. |

---

## 3. Consistency matrix

Legend — **Consistent?**: ✅ yes · ⚠️ yes-with-refinement · ❌ contradiction. **Risk**: severity if unaddressed.

| Area | Source documents | Decision | Consistent? | Classification | Risk |
|---|---|---|---|---|---|
| Application architecture | PHASE-0 §4/§5, ADR-0001 | Modular monolith (Next.js + Drizzle) | ✅ | — | Low |
| — vs. business plan stack | PLAN-DE-DESARROLLO §8 | Plan still lists NestJS + Redis | ❌ (doc drift) | **IMPORTANT** | Confusion; no build impact |
| Multi-tenancy | DOMAIN §4, DB §3, ADR-0002 | Defense in depth + RLS | ✅ | — | Low |
| — operator-scoped read scoping | DB §3, ADR-0002 | `businesses`/`plans`/`operators` RLS by `operator_id` | ⚠️ | **IMPORTANT** | Intra-operator business-config over-read |
| Operator hierarchy | DOMAIN §1, DB §2 | Operator → Business (business = data tenant) | ✅ | — | Low |
| Authentication | PHASE-0 D8, ADR-0001, DB `sessions` | DB-backed sessions (httpOnly), argon2 | ✅ | — | Low |
| Plans | DOMAIN §1, DB `plans` | Operator-scoped, generic limits | ✅ | — | Low |
| Entitlements | DOMAIN §6, PHASE-0 §10 | Generic capability system (`canX`), no hardcoded plan names | ✅ | — | Low |
| Monthly quotas | PHASE-0 D5, DB `usage_counters` | Calendar month, **UTC** | ⚠️ | **MINOR** | UTC derivation not yet spelled out |
| Money | DOMAIN VO, DB money cols, ADR-0003 | Integer minor units + `currency` | ✅ | — | Low |
| Historical prices | DOMAIN INV-5, DB `order_items` | Immutable snapshots (name/unit price/currency/qty) | ✅ | — | Low |
| Exchange rates | DOMAIN, DB `orders`/`exchange_rates`, ADR-0003 | Historical rate captured on order | ⚠️ | **IMPORTANT** | `orders` lacks FX **timestamp** column |
| Image storage | DB `product_images`, ADR-0004 | Storage port; DB stores refs; no binaries in PG | ✅ | — | Low |
| Public routing | PHASE-0 D4, DB slugs | Subdomain/slug resolution for MVP | ✅ | — | Low |
| Future custom domains | PHASE-0 D4, ADR-0002 public path | Deferred, architecturally supported | ⚠️ | **MINOR** | Resolver indirection to be made explicit |
| Product SEO | PHASE-0 D7, DB product slug | Canonical product route `/{business}/p/{slug}` | ✅ | — | Low |
| Email verification | PHASE-0 D6, DOMAIN/DB (`users.email_verified_at`) | Architecture present, enforcement deferred | ✅ | — | Low |

**No `BLOCKING` inconsistencies.**

---

## 4. Confirmed architecture (authoritative baseline for Phase 1+)

- **App:** single **Next.js (App Router) modular monolith**, TypeScript strict, one deployable. Internal `modules/*` with enforced boundaries (ADR-0001).
- **Data:** **PostgreSQL 16** via **Drizzle** with explicit migrations. Two DB roles: `app_owner` (DDL/seed, offline) and `app_runtime` (non-owner, `FORCE ROW LEVEL SECURITY`, cannot bypass).
- **Tenancy:** business is the primary data tenant (`business_id`); operator data keyed by `operator_id`. **Defense in depth** = server-resolved `TenantContext` + tenant-scoped data layer (`SET LOCAL` GUCs in a per-request transaction) + **RLS** backstop (ADR-0002).
- **Auth:** DB-backed sessions, httpOnly cookie, argon2 hashing. Email-verification architecture wired, enforcement off (D6).
- **Money:** `bigint` minor units + ISO-4217 `currency`; `Money` VO; half-up display rounding; immutable order snapshots; historical FX recorded on the order (ADR-0003).
- **Images:** object storage behind a `Storage` port (MinIO dev / R2 prod); DB stores references; MIME allow-list, re-encode, size caps (ADR-0004).
- **Entitlements:** centralized `canX(business)` API; numeric limits + boolean features + unlimited sentinel; monthly usage counters; server-side enforcement (DOMAIN §6).
- **Redis:** **not present**; documented triggers to add later (ADR-0001).
- **Ops target:** single VPS, infra ≤ ~$75/mo; dev via Docker Compose (app + postgres + minio + mailpit).

---

## 5. Blocking issues

**None.** No approved decision contradicts another in a way that prevents Phase 1.

---

## 6. Important issues (resolve in the noted phase; not blocking Phase 1)

### I-1 — Stack documentation drift (PLAN-DE-DESARROLLO.md)
- **Finding:** the business plan §8/§11/§15 still prescribes **NestJS + Redis** and "exchange-rate cache in Redis," contradicting the accepted ADR-0001 (Next.js modular monolith, Redis deferred, FX cache in a DB table).
- **Impact:** reader confusion only; no engineering impact (ADR-0001 is authoritative).
- **Resolution (P1 docs task, non-code):** add a **superseded** banner at the top of `PLAN-DE-DESARROLLO.md` pointing to ADR-0001, or annotate §8. Do not edit the ADR.

### I-2 — RLS role-aware scoping on operator-scoped tables
- **Finding:** DB §3 scopes `businesses`/`plans` by `operator_id` only, and `operators` is **not** in the RLS list. A `BUSINESS_USER` whose request sets `app.current_operator` could read **sibling** businesses' config (WhatsApp number, base currency) and the operator's plans — intra-operator over-read.
- **Impact:** business-to-business metadata exposure within one operator (not customer data, but still an isolation defect).
- **Resolution (P2, with the first tenant tables):** role-aware policies, e.g.:
  ```sql
  -- businesses
  USING (
    operator_id = current_setting('app.current_operator')::uuid
    AND (
      current_setting('app.current_role') IN ('OWNER','OPERATOR_ADMIN')
      OR id = current_setting('app.current_business')::uuid
    )
  )
  ```
  Add an analogous policy to `plans` (business sees only its own plan) and **add RLS to `operators`** (`id = current_operator OR role = 'OWNER'`). The cross-tenant test suite must include an **intra-operator** case (business A cannot read business B under the same operator).

### I-3 — Order FX snapshot lacks a timestamp
- **Finding:** `orders` has `fx_rate`, `fx_source` but **no** FX timestamp. Special Audit C requires distinguishing the exchange rate **and its timestamp/source**.
- **Impact:** an order converted for display/record wouldn't retain *when* the rate was taken — weakens historical auditability.
- **Resolution (P8, before any converted total is persisted):** add `orders.fx_rate_at timestamptz` (denormalized snapshot, not an FK, to preserve immutability if the `exchange_rates` cache is pruned). Base-currency-only orders leave FX columns null.

---

## 7. Minor issues

### M-1 — UTC quota computation not yet spelled out
`usage_counters.period_yyyymm` supports monthly bucketing but the **exact UTC derivation** isn't documented. Resolution: see Assumption A-1 (§8). P3.

### M-2 — Custom-domain resolver indirection implicit
Future custom domains require host→business resolution to be a **separate concern** from catalog logic. The design already routes by `business_id`, but the indirection should be explicit. Resolution: see Assumption A-4 (§8). Design-only until P7+.

### M-3 — `product_id` nullability vs soft delete
`order_items.product_id` is nullable (snapshot survives deletion) while products use **soft delete** (ARCHIVED). Consistent, but note the invariant that **order display always uses the snapshot**, never a live product join. Resolution: reaffirmed in Assumption A-3. No change needed.

---

## 8. Explicit implementation assumptions

These are the authoritative clarifications the audit adopts (do not contradict approved ADRs).

- **A-1 (UTC monthly quota — Special Audit A).** The quota period is `[YYYY-MM-01T00:00:00.000Z, first instant of next month UTC)`. Canonical key: `period_yyyymm = ((year*100)+month)` computed from `now() AT TIME ZONE 'UTC'`. The **same UTC period** is used by: entitlement checks (`canReceiveOrder`), usage increment (in the order transaction), all DB reads of `usage_counters`, any future scheduled reset, and analytics that group by plan period. **Never** use server local time; queries pin the period via UTC. No cron is required for reset (period is derived, not mutated); an optional maintenance job may pre-create rows.
- **A-2 (Tenant context & RLS — Special Audit B).** Answers in §10 below are authoritative for P2.
- **A-3 (Money & historical orders — Special Audit C).** Seven distinct concepts are kept separate: current product price (`products.price_minor`/`currency`), product base currency (`businesses.base_currency`/product `currency`), displayed converted price (computed at render, **not stored**), order unit-price snapshot (`order_items.unit_price_minor`/`currency`), order total snapshot (`orders.total_minor`/`currency`), exchange rate used (`orders.fx_rate`/`fx_source`), and exchange-rate timestamp (`orders.fx_rate_at` — **added per I-3**). An order stays correct after product price/currency change, FX change, or product deactivation/deletion because display never joins to live product for historical rows.
- **A-4 (Future custom domains — Special Audit E).** Public catalog resolution is a **two-step indirection**: `resolveTenant(host) → { operatorId, businessId }` (a dedicated resolver), then catalog domain logic operates purely on `businessId`. MVP resolver handles `business.platform.example` (slug/subdomain). Evolving to `catalog.business.example` adds a `custom_domains(host UNIQUE, business_id, operator_id, verified_at)` lookup **in the resolver only** — catalog/product/order modules are untouched.
- **A-5 (Operator-scoped plans — Special Audit D).** Plans belong to operators (`plans.operator_id`); a business reads only its own plan (I-2 policy); plan **names never drive logic** (only `plans.limits` jsonb is read via the entitlements module); limits are generic numeric/boolean with an explicit **unlimited sentinel** (`-1` or `null` → documented as "unlimited"); usage is measured via `usage_counters` with a **`UNIQUE(business_id, period_yyyymm)` upsert + atomic increment inside the order transaction**, avoiding race conditions.
- **A-6 (Docs supersession — I-1).** `PLAN-DE-DESARROLLO.md` is a business artifact; its technical stack is superseded by ADR-0001. A superseded banner will be added as a P1 docs task.

---

## 9. Special Audit B — Tenant context & RLS (11 answers, authoritative for P2)

1. **How is tenant context derived?** From the authenticated **session** (server-side): the session → user → membership(s) → `operatorId` (+ `businessId` for business users) + `role`. Never from URL/body/headers.
2. **Where is it stored during a request?** In a request-scoped `TenantContext` object created server-side; propagated explicitly to the data layer. No global mutable state.
3. **How does the app layer scope queries?** All business-data access goes through a tenant-scoped repository that (a) injects the `business_id`/`operator_id` predicate and (b) runs inside a transaction that issues `SET LOCAL app.current_operator/business/role`.
4. **How is RLS context established?** Via `SET LOCAL` GUCs (`app.current_operator`, `app.current_business`, `app.current_role`) inside the per-request transaction; RLS policies read them with `current_setting(...)`.
5. **Can a client-provided `business_id` override context?** **No.** Client-supplied IDs are ignored for authorization; they may be used only to *look up* a resource, whose returned row is still filtered by RLS + the context predicate. Forged IDs are covered by an explicit tampering test.
6. **Which role runs migrations?** `app_owner` (offline), plus a dedicated **maintenance/seed role with `BYPASSRLS`** used **only** for migrations/seeds, never by the app.
7. **Which role runs the application?** `app_runtime` — non-owner, non-superuser, **no `BYPASSRLS`**, tables are `FORCE ROW LEVEL SECURITY`.
8. **Which roles can bypass RLS?** Only the offline migration/seed maintenance role (`BYPASSRLS`). `app_runtime` can **never** bypass. No production runtime path bypasses RLS.
9. **How does Super Admin (platform owner) access work?** The owner console reads **platform-level tables** (`operators`, `audit_log`, aggregated health) — `operators` gains an RLS policy allowing `role = 'OWNER'`. To inspect a specific operator/business (support), the owner performs an **explicit, audited impersonation** that sets the GUC context to that operator/business — still **subject to RLS**, never a DB-role bypass.
10. **How are public unauthenticated catalog requests scoped?** A dedicated public read path resolves the business from the host/slug (A-4), sets `app.current_business` for that business, and applies an additional predicate `catalog.status='PUBLISHED' AND business.status='ACTIVE' AND operator.status='ACTIVE'` (INV-3/INV-4). No user session is required; the context is derived from the resolved public route, not the client.
11. **How will integration tests prove RLS is active (not just app filtering)?** A test connects **as `app_runtime`**, sets context to business A, then issues **raw SQL** (bypassing the app repository) to `SELECT/UPDATE` business B's rows → must return **0 rows / reject writes**. This isolates the DB layer, proving RLS itself is enforcing, independent of application filtering. Runs in CI against ephemeral Postgres.

*All 11 answers are clear → none BLOCKING.*

---

## 10. Phase 1 prerequisites

Phase 1 (Foundation) may proceed once this audit is accepted. Concretely, Phase 1 needs:
- Accepted architecture baseline (§4) — **done**.
- Confirmed toolchain — **verified** (Node 22, pnpm 10, Docker 29/Compose v5, git, gh).
- DB role model (`app_owner`, `app_runtime`, offline maintenance/`BYPASSRLS` role) — **specified** (§9); Phase 1 provisions `app_owner`/`app_runtime` and the extension baseline; RLS policies themselves land in P2.
- The IMPORTANT/MINOR items are **explicitly deferred** to their phases (I-1→P1 docs banner; I-2→P2; I-3→P8; M-1→P3; M-2→P7+): none block Phase 1.

---

## 11. Final audit verdict

```
READY FOR PHASE 1
```

Rationale: zero blocking inconsistencies; the approved architecture is coherent and implementable; all Important/Minor findings are refinements scheduled for the phase that first exercises them and do not affect the Foundation phase.
