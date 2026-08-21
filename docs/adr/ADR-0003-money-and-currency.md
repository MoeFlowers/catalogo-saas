# ADR-0003 — Money & Currency Representation

- **Status:** **Accepted** (Director approved 2026-08-21)
- **Date:** 2026-08-21

## Context

The platform handles product prices, order totals, and cross-currency display. The directive forbids JavaScript floating-point for money and requires a dedicated money abstraction, explicit precision/rounding/conversion, and **historical rate handling** (no silent rewrite of historical prices).

## Decision (proposed)

### 1. Storage: integer **minor units** + ISO-4217 currency code
- Money persists as `amount_minor bigint` + `currency char(3)`. Example: `USD 25.00` → `{ amount_minor: 2500, currency: "USD" }`.
- **Never** `float`/`double`/`real` for money. No `number` arithmetic on money in TS beyond integer minor units.

### 2. `Money` value object (currencies module)
```
Money {
  amountMinor: bigint      // integer, in the currency's minor unit
  currency: string         // ISO-4217, e.g. "USD", "CLP", "VES"
}
```
- Immutable. Operations (`add`, `subtract`, `multiply(qtyInteger)`, `allocate`) require **same currency**; mixing currencies throws.
- Constructed only via factories that validate currency + integer amount.

### 3. Currency precision
- Precision comes from an ISO-4217 table (minor-unit exponent): e.g. `USD/EUR/VES = 2`, `CLP = 0`, most = 2.
- The `Money` VO knows its currency's exponent for formatting; storage remains minor units regardless.

### 4. Rounding strategy
- **Commercial rounding = half-up (round half away from zero)** at the moment of converting to a display currency, applied once, to the final displayed amount.
- Rationale over banker's rounding: matches customer/price expectations in retail contexts; documented and centralized so it can change in one place if the Director prefers half-even.
- Line math uses exact integer arithmetic (`unit_minor * qty`); no rounding needed for same-currency totals.

### 5. Conversion strategy (display only)
- Products store a **base price in the business's base currency**.
- Display conversion = `round( baseMinor * rate * targetScale / baseScale )` using an explicit `ExchangeRate` (see ADR/PHASE currency module). Conversion is a **presentation concern**, computed at render time; it does **not** mutate stored prices.
- The exchange-rate **provider is abstracted** (BCV + others) — see PHASE-0 §5 / Phase 8.

### 6. The four distinct money concepts (kept separate)
| Concept | Where | Mutable? |
|---|---|---|
| **Product base price** | `products.price_minor` + `currency` | Yes (editing the product) |
| **Display conversion** | Computed at render, not stored on the product | N/A (ephemeral) |
| **Order price snapshot** | `order_items.unit_price_minor` + `currency` (copied at order time) | **No — immutable** |
| **Exchange rate used** | `orders.fx_rate` / `orders.fx_source` when a converted total is captured | **No — recorded as used** |

- **Historical correctness:** once an order is created, its item prices, currency, and any captured exchange rate are frozen. Later product edits or rate changes **never** alter past orders.

## Consequences

- **Positive:** exact money; no float drift; historically correct orders; one place for rounding/precision policy; testable pure functions (unit tests mandated for money math + conversion).
- **Negative / mitigations:** `bigint` handling in JSON/serialization needs care (serialize as string or structured `{amountMinor, currency}`); enforced by the `Money` codec.
- **Tests (mandatory):** minor-unit round-trips, add/subtract/multiply, cross-currency guard, half-up rounding edge cases, conversion determinism, snapshot immutability.
