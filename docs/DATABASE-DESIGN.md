# Initial Database Design — `Catalogo+WA`

- **Status:** Proposed (Phase 0) — awaiting Director approval
- **Engine:** PostgreSQL 16 · **ORM/migrations:** Drizzle + drizzle-kit (explicit migrations only)
- **Conventions:** UUID v7 PKs (`id`), `snake_case`, `created_at`/`updated_at timestamptz`, money as `bigint` minor units + `currency char(3)`, all business tables under **RLS** (ADR-0002).

> This is a **design**, not a migration. Tables are created via versioned migrations in Phase 1+. No speculative indexes — each index below states its query pattern.

## 1. Roles (least privilege)
- `app_owner` — migration/DDL + seeds. Not used at runtime.
- `app_runtime` — application role; **non-superuser, non-owner**, subject to `FORCE ROW LEVEL SECURITY`. Cannot bypass RLS.

## 2. Tables (core)

### identity / tenancy
```
operators(id, name, status[ACTIVE|SUSPENDED], branding jsonb, primary_domain text?, created_at, updated_at)
users(id, email UNIQUE, password_hash, email_verified_at?, created_at, updated_at)
memberships(id, user_id FK, operator_id FK, business_id FK?, role[OWNER|OPERATOR_ADMIN|BUSINESS_ADMIN|BUSINESS_USER], created_at)
sessions(id, user_id FK, expires_at, created_at, last_seen_at, ip?, user_agent?)   -- DB-backed sessions (ADR-0001)
```

### operator-scoped
```
plans(id, operator_id FK, name, limits jsonb, price_minor bigint, currency char(3), is_active, created_at, updated_at)
businesses(id, operator_id FK, name, slug, status[DRAFT|ACTIVE|SUSPENDED|ARCHIVED],
           whatsapp_e164 text?, base_currency char(3), created_at, updated_at,
           UNIQUE(operator_id, slug))
subscriptions(id, business_id FK UNIQUE, plan_id FK, status[ACTIVE|PAST_DUE|CANCELLED],
              period_start date, period_end date, created_at, updated_at)
usage_counters(id, business_id FK, period_yyyymm int, orders_count int DEFAULT 0,
               UNIQUE(business_id, period_yyyymm))   -- monthly order counter (D5: calendar month UTC)
```

### catalog domain (business-scoped)
```
catalogs(id, business_id FK, name, slug, status[DRAFT|PUBLISHED|ARCHIVED], created_at, updated_at,
         UNIQUE(business_id, slug))
categories(id, business_id FK, catalog_id FK, name, position int, created_at)
products(id, business_id FK, catalog_id FK, category_id FK?, name, slug, description text?,
         price_minor bigint, currency char(3), stock int?, status[DRAFT|ACTIVE|ARCHIVED],
         created_at, updated_at, UNIQUE(business_id, catalog_id, slug))
product_images(id, business_id FK, product_id FK, object_key text, content_type, width int,
               height int, size_bytes int, alt text?, position int, created_at)
```

### orders (business-scoped, immutable snapshots)
```
orders(id, business_id FK, reference text UNIQUE, status[NEW|CONTACTED|CLOSED],
        customer_name text, customer_phone text, note text?,
        total_minor bigint, currency char(3),
        fx_rate numeric?, fx_source text?,          -- exchange rate USED, if a conversion was captured
        whatsapp_e164 text, whatsapp_link_generated boolean DEFAULT false,
        created_at, updated_at)
order_items(id, order_id FK, business_id FK, product_id FK?,   -- product_id nullable: snapshot survives product deletion
            name_snapshot text, unit_price_minor bigint, currency char(3), quantity int,
            line_total_minor bigint)
```

### currencies
```
currencies(code char(3) PK, minor_unit_exponent int, symbol text, name text)   -- ISO-4217 reference (seed)
exchange_rates(id, base_currency char(3), quote_currency char(3), rate numeric,
               source text, fetched_at timestamptz,
               UNIQUE(base_currency, quote_currency, source, fetched_at))       -- cache + history (ADR-0003)
```

### audit
```
audit_log(id, actor_user_id?, operator_id?, business_id?, action, entity, entity_id, meta jsonb, created_at)
```

## 3. Row-Level Security (ADR-0002)
- **Business-scoped tables** (`catalogs, categories, products, product_images, orders, order_items, subscriptions, usage_counters`): `USING/WITH CHECK (business_id = current_setting('app.current_business')::uuid)`, `ENABLE` + `FORCE ROW LEVEL SECURITY`.
- **Operator-scoped tables** (`plans, businesses`): keyed on `operator_id = current_setting('app.current_operator')::uuid`.
- **Public read path**: a dedicated query that sets `app.current_business` from the resolved public route and additionally filters `catalogs.status='PUBLISHED' AND business.status='ACTIVE' AND operator.status='ACTIVE'` (invariants INV-3/INV-4).
- Context set per-request via `SET LOCAL` inside a transaction; runtime role cannot bypass RLS.

## 4. Indexes (each justified by a query pattern)
| Index | Query pattern it serves |
|---|---|
| `businesses(operator_id, slug)` UNIQUE | Resolve business by slug within operator (routing, uniqueness). |
| `catalogs(business_id, status)` | List a business's catalogs / fetch published ones. |
| `products(business_id, catalog_id)` | Render a catalog's products (primary storefront query). |
| `products(business_id, category_id)` | Filter products by category. |
| `products(business_id, catalog_id, slug)` UNIQUE | Product detail page + slug uniqueness. |
| `orders(business_id, created_at DESC)` | Order history/list (admin) + monthly analytics. |
| `orders(reference)` UNIQUE | Look up order by public reference. |
| `usage_counters(business_id, period_yyyymm)` UNIQUE | O(1) monthly order-limit check/increment. |
| `memberships(user_id)` / `memberships(business_id)` | Resolve tenant context on login; list business users. |
| `product_images(product_id, position)` | Ordered images for a product. |
| `exchange_rates(base_currency, quote_currency, fetched_at DESC)` | Latest rate for a pair (cache read). |

> No full-text search index yet: MVP search is a simple `ILIKE`/prefix over `products.name` within a business; add `pg_trgm`/GIN only if a measured need appears (avoid speculative indexes).

## 5. Transactions & integrity
- **Order creation** runs in one transaction: validate → compute (`Money`) → insert `orders` + `order_items` snapshots → increment `usage_counters` → commit. WhatsApp URL built **only after commit** (INV-7).
- Foreign keys everywhere; `ON DELETE` chosen per relationship (e.g., restrict deleting a business with orders; cascade categories→products only when archiving policy allows).
- **Soft delete** limited to `products`/`catalogs`/`businesses` (status=ARCHIVED) to preserve order history; other tables hard-delete.

## 6. Seeds (dev)
- ISO-4217 `currencies`, one demo operator + plans (Basic/Medium/Premium), one demo business + catalog + products, one demo order — enough to exercise every module and the cross-tenant tests (a **second** operator/business for isolation testing).

## 7. Test-database strategy
- Integration tests spin an **ephemeral Postgres via Testcontainers**, run migrations, apply RLS, seed two tenants, and execute the cross-tenant suite (ADR-0002) plus persistence/transaction tests.
