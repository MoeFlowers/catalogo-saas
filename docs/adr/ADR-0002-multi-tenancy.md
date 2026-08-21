# ADR-0002 — Multi-Tenancy Isolation Strategy

- **Status:** **Accepted** (Director approved 2026-08-21 — Option D, defense in depth)
- **Date:** 2026-08-21
- **Severity:** Cross-tenant leakage is a **release-blocking** security defect.

## Context

Hierarchy: `Platform → Operator → Business → Business Data`. Business data must **never** leak across tenants. The directive requires **defense in depth**, forbids trusting frontend/client tenant IDs, and mandates automated cross-tenant access tests.

**Tenant boundary (decision D2):** the **Business** is the primary data tenant (`business_id`). Operator-scoped resources (plans, branding, operator users) are keyed by `operator_id`. A Business always belongs to exactly one Operator.

## Options considered

- **A. Shared schema with `business_id`/`tenant_id`, application filtering only.** Simple, cheap; but a single missed `WHERE business_id = ?` leaks data. Single layer of defense → rejected as sole strategy.
- **B. PostgreSQL Row-Level Security only.** Strong DB backstop; but without an app-level tenant context it's easy to run queries as a superuser/owner role that bypasses RLS, and error messages/joins get awkward. Good as a *layer*, not alone.
- **C. Application-level filtering only.** Same weakness as A; explicitly discouraged by the directive.
- **D. Application-level tenant scoping **+** PostgreSQL RLS (defense in depth).** Two independent layers: a bug in one is caught by the other.

## Decision (proposed): Option D — defense in depth

### Layer 1 — Server-resolved tenant context (never from client)
- On each authenticated request, resolve the acting user's `operator_id` and (for business users) `business_id` from the **session** (server-side), not from URL/body/headers.
- A request-scoped `TenantContext { operatorId, businessId?, role }` is created server-side and passed explicitly. Client-supplied tenant IDs are **ignored** for authorization (they may be used only to *look up*, then validated against context).

### Layer 2 — Tenant-scoped data-access layer
- All business-data reads/writes go through a repository layer that **injects the tenant predicate** and opens a transaction that sets Postgres session variables:
  ```sql
  SET LOCAL app.current_operator = '<operatorId>';
  SET LOCAL app.current_business = '<businessId>';
  ```
- Raw ad-hoc queries against business tables outside this layer are prohibited (enforced by review + lint boundary; the DB role has no bypass privilege).

### Layer 3 — PostgreSQL Row-Level Security (backstop)
- The application connects with a **non-owner, non-superuser** role that is subject to RLS (`FORCE ROW LEVEL SECURITY` on tenant tables).
- Every business-owned table has policies, e.g.:
  ```sql
  ALTER TABLE products ENABLE ROW LEVEL SECURITY;
  ALTER TABLE products FORCE ROW LEVEL SECURITY;
  CREATE POLICY products_tenant ON products
    USING (business_id = current_setting('app.current_business')::uuid)
    WITH CHECK (business_id = current_setting('app.current_business')::uuid);
  ```
- Operator-scoped tables use `operator_id = current_setting('app.current_operator')::uuid`.
- Public storefront reads use a **dedicated read path** that sets the business context from the resolved public route (business slug/subdomain) and additionally filters on **published + active business + non-suspended operator** (invariant enforcement, not just tenancy).

### Migrations & seeds
- The migration role (owner) is separate from the runtime role. RLS policies are created in migrations. Seeds run as owner.

## Testing (release-blocking)
An automated **cross-tenant suite** (integration, real Postgres) must:
1. Create Operator O1/Business B1 and Operator O2/Business B2 with data in each.
2. Authenticate as B1 and attempt, through **every protected repository/route**, to read/update/delete B2's catalogs, products, orders, users.
3. Assert **zero** rows returned / **all** writes rejected.
4. Repeat for operator-scoping (O1 cannot see O2's plans/businesses).
5. Attempt tampering: forged `business_id` in body/URL while authenticated as B1 → must be ignored/blocked by both Layer 1 and Layer 3.

Any leak = CI failure = no release.

## Consequences

- **Positive:** a single forgotten filter does not cause a breach (RLS catches it); explicit, testable, DB-enforced.
- **Negative / mitigations:** every request must open a transaction and `SET LOCAL` the context (small overhead, acceptable); connection pooling must not leak session GUCs across requests → use `SET LOCAL` inside a transaction per request and/or a pool that resets state.
- **Non-negotiable:** frontend restrictions are UX only; the server + DB are the source of truth.
