# Vitrina

Catálogos en línea para empresas, con pedidos que llegan por WhatsApp. Cada empresa se registra, la
plataforma la aprueba, carga sus productos con inventario y comparte un enlace. Sus clientes arman el
pedido desde el celular y lo envían por WhatsApp; el pedido queda en el historial de ambos.

Estado: fase A, boceto navegable (desde el 2026-10-12). Todavía no hay aplicación en producción.

## Documentos

| Documento | Qué tiene |
|---|---|
| [`docs/PLAN-MAESTRO.md`](docs/PLAN-MAESTRO.md) | Decisiones, pantallas, flujos, monedas, inventario, seguridad, diseño y modelo de negocio |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Fases, fechas y tareas con casillas |
| [`docs/adr/`](docs/adr/) | Decisiones de arquitectura (stack, aislamiento entre empresas, dinero, imágenes) |
| [`docs/DOMAIN-MODEL.md`](docs/DOMAIN-MODEL.md), [`docs/DATABASE-DESIGN.md`](docs/DATABASE-DESIGN.md) | Modelo de dominio y esquema (se actualizan en la fase B) |
| [`docs/historico/`](docs/historico/) | Planes reemplazados |

## Arrancar en tu PC

Necesitas Node 22, pnpm 10 y Docker Desktop abierto.

```bash
cp .env.example .env          # y genera BETTER_AUTH_SECRET como indica el archivo
docker compose up -d          # PostgreSQL, imágenes (S3) y correos de prueba
pnpm install
pnpm db:migrar && pnpm db:migrar --test
pnpm dev                      # http://localhost:4200
```

| Comando | Qué hace |
|---|---|
| `pnpm test` | Pruebas unitarias y de integración (incluye el aislamiento entre empresas) |
| `pnpm test:e2e` | Recorre la app en Chromium, en celular y escritorio, con axe |
| `pnpm lint`, `pnpm typecheck` | Calidad y tipos |
| `pnpm db:semilla` | Datos de demostración |
| `pnpm db:reiniciar` | Borra el esquema (solo desarrollo) |

Correos de prueba en http://localhost:8025.

## Estructura

```
src/app/         rutas de Next.js (sitio, catálogo, cuenta, panel, admin, API)
src/modulos/     lógica de negocio por módulo
src/lib/db/      esquema Drizzle y cliente con contexto de seguridad por fila
drizzle/         migraciones SQL
test/            integración (Vitest) y extremo a extremo (Playwright)
prototipo/       boceto navegable de la fase A, publicado en GitHub Pages
docs/            plan, roadmap y decisiones
```

## Herramientas

| Herramienta | Política |
|---|---|
| Node.js | 22 LTS (`.nvmrc`) |
| Gestor de paquetes | pnpm 10.33.0, activado con Corepack |
| Lenguaje | TypeScript estricto |
| Finales de línea | LF |

## Flujo de trabajo

- Ramas: `main` (estable), `develop` (integración), `feature/*`, `fix/*`, `chore/*`, `docs/*`.
- Commits con Conventional Commits, pequeños y con un solo propósito.
- Reglas completas en [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Propiedad

Software propietario del desarrollador. No se permite su redistribución.
