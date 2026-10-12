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

## Estructura

```
prototipo/   boceto navegable con datos de demostración (fase A), publicado en GitHub Pages
docs/        plan, roadmap y decisiones
```

La aplicación real (Next.js, PostgreSQL, Docker) empieza en la fase B.

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
