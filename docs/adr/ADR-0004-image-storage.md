# ADR-0004 — Image Storage

- **Status:** **Accepted** (Director approved 2026-08-21)
- **Date:** 2026-08-21

## Context

Products carry images. The directive: do **not** store binaries in PostgreSQL; use object storage; DB stores metadata/references; provide a storage abstraction; production provider must not leak into domain logic; reproducible dev with Docker; validate uploads (MIME allow-list, size limits); signed URLs if justified.

## Decision (proposed)

### 1. Object storage behind a `Storage` port
- Domain code depends only on a `Storage` interface (`put`, `getUrl`, `delete`, `signUpload?`) in the `media` module. Concrete adapters are swapped by environment.
- **Dev:** **MinIO** (S3-compatible) via Docker Compose — reproducible, no cloud account needed.
- **Prod:** **Cloudflare R2** (or any S3-compatible: Backblaze B2, AWS S3) — cheap, CDN-friendly.
- Provider config (endpoint, bucket, keys) lives in validated env, **never** in domain logic.

### 2. Database stores references, not binaries
- `product_images`: `id, product_id, business_id, object_key, width, height, content_type, size_bytes, alt, position, created_at`.
- The `object_key` is opaque (e.g. `businesses/{businessId}/products/{productId}/{uuid}.webp`); the public URL is derived by the adapter/CDN, not hardcoded in the domain.

### 3. Upload validation & processing
- **MIME allow-list:** `image/jpeg`, `image/png`, `image/webp` only. **No SVG** (XSS vector).
- **Size cap:** e.g. ≤ 5 MB per image (configurable); reject oversize before storing.
- **Re-encode** to `webp` (or normalized jpeg) server-side to strip EXIF/metadata and neutralize malicious payloads; generate a thumbnail; store dimensions.
- Verify magic bytes, not just the client-declared content type.

### 4. Access model
- Product images are **public read** (catalog is public) → served via CDN public URLs; no signing needed for reads.
- **Signed upload URLs**: optional optimization (client → storage direct) — deferred unless upload volume justifies it; MVP uploads go through the server so validation/re-encode happens server-side.

### 5. Tenancy
- Object keys are namespaced by `businessId`; `product_images` rows carry `business_id` and are under RLS (ADR-0002). Deleting a product/business cleans up its objects (background or transactional best-effort with reconciliation job later).

## Consequences

- **Positive:** cheap, scalable images; DB stays lean; provider-agnostic; safe uploads; reproducible dev.
- **Negative / mitigations:** server-side re-encode costs CPU (acceptable at MVP volume; can move to a job/queue if a Redis trigger fires — ADR-0001); orphaned objects on failure → periodic reconciliation (P10).
- **Tests:** MIME/size rejection, magic-byte check, re-encode strips metadata, tenant-namespaced keys, reference integrity.

## Nota (2026-10-13): SeaweedFS en lugar de MinIO en desarrollo

MinIO dejó de publicar sus imágenes de contenedor en Docker Hub y quay.io (las descargas devuelven
"acceso denegado"). El entorno local usa SeaweedFS (`chrislusf/seaweedfs`) con su pasarela S3 en el
puerto 8333. La decisión de fondo no cambia: la app habla S3 a través del puerto `Storage`, así que en
producción sigue Cloudflare R2 (u otro S3) sin tocar código.
