# Roadmap y plan de acción: Vitrina

Qué se construye, en qué orden y cuándo. El qué y el por qué están en `docs/PLAN-MAESTRO.md`.

- Inicio: lunes 2026-10-12
- Ritmo supuesto: sesiones diarias de trabajo; las fechas son metas y se ajustan al cerrar cada fase
- Regla: cada fase termina con algo que se puede probar y con lint, tipos, pruebas y build en verde

## Vista general

| Fase | Semana | Fechas | Resultado |
|---|---|---|---|
| A. Boceto navegable | 1 y 2 | 12 al 25 oct | Diseño probado en tu teléfono desde GitHub Pages |
| B. Cimientos | 3 | 26 oct al 1 nov | App, base de datos, Docker, pruebas y CI listos |
| C. Cuentas y seguridad | 4 y 5 | 2 al 15 nov | Empresas con doble factor, compradores con Google, aprobación |
| D. Monedas y tasas | 6 | 16 al 22 nov | Tasas del día con historial y precios en Bs y USD |
| E. Catálogo e inventario | 7 y 8 | 23 nov al 6 dic | Productos con variantes, presentaciones, almacenes y movimientos |
| F. Catálogo público y pedido | 9 | 7 al 13 dic | Un comprador hace un pedido que llega a WhatsApp |
| G. Gestión de pedidos | 10 | 14 al 20 dic | Ciclo completo con reserva y salida de stock |
| H. Suscripciones y administración | 11 | 21 al 27 dic | Planes, cupos, pagos reportados, admin completo |
| I. Pulido | 12 | 28 dic al 3 ene | Accesibilidad, rendimiento y revisión de seguridad |
| J. Publicación | cuando haya dinero | | En línea con dominio |
| K. Crecimiento | después | | Lo que pidan las primeras empresas |

---

## Fase A. Boceto navegable (12 al 25 oct)

**Objetivo:** probar el diseño y los flujos antes de construir el backend. Todo funciona con datos de
demostración guardados en el navegador; no hay servidor ni base de datos.

**Cómo:** carpeta `prototipo/` con Vite, React, TypeScript y Tailwind, con los mismos tokens que usará
la aplicación real para poder reutilizar los componentes. Se publica en GitHub Pages con una Action.
Dos empresas de demostración: una ferretería mayorista y una tienda de ropa, marcadas como Demostración.

### Semana 1: base y lado del comprador

- [ ] Lunes 12: limpieza del repo (sección "Primer día") y arranque de `prototipo/`
- [ ] Tokens, tipografía y componentes base: botón, campo, selector, tabla que pasa a tarjetas en
      celular, diálogo, aviso, estado vacío, insignia de estado, precio en Bs con referencia USD
- [ ] Datos de demostración: 2 empresas, unos 40 productos con variantes, presentaciones y escalas
- [ ] Catálogo público: portada, filtros, búsqueda, ficha de producto, barra del pedido
- [ ] Pedido: lista, mínimo de la empresa, método de entrega, inicio de sesión simulado (Google o
      correo), confirmación con el mensaje de WhatsApp real
- [ ] Cuenta del comprador: Mis pedidos, detalle, Repetir pedido, direcciones, datos fiscales
- [ ] Action de GitHub Pages; enlace funcionando en tu teléfono

### Semana 2: paneles y revisión

- [ ] Panel de empresa: Inicio, Pedidos con cambio de estado, Productos (lista y formulario completo),
      Inventario (existencias y movimientos), Entrega, Catálogo, Equipo, Suscripción
- [ ] Panel de plataforma: Resumen, Solicitudes con aprobar y rechazar, Empresas, Pagos, Tasas
- [ ] Sitio: portada, planes, registro de empresa con los pasos de doble factor, estado En revisión
- [ ] Revisión contigo en celular y escritorio; lista de cambios
- [ ] Ajustes de la revisión
- [ ] Revisión de accesibilidad con axe y teclado

**Entregable:** enlace de GitHub Pages con el boceto completo.
**Terminado cuando:** apruebas el diseño y los flujos. Lo que cambie aquí se anota en el plan maestro.

---

## Fase B. Cimientos (26 oct al 1 nov)

**Objetivo:** la base técnica real, sin funciones de negocio todavía. Corresponde a los sprints 1.2 a
1.6 de `docs/PHASE-1-PLAN.md`.

- [ ] 1.2 Aplicación Next.js con TypeScript estricto, lint y formato, estructura de módulos
- [ ] 1.3 Base de datos: Drizzle, migraciones, esquema inicial, datos de ejemplo
- [ ] 1.4 Docker Compose: PostgreSQL, MinIO y Mailpit con un solo comando
- [ ] 1.5 Pruebas: Vitest, Playwright y axe
- [ ] 1.6 CI en GitHub Actions: lint, tipos, pruebas y build en cada rama
- [ ] ADR-0005 Autoregistro, cuentas de comprador y biblioteca de autenticación (prueba corta de
      Better Auth)
- [ ] ADR-0006 Monedas y tasas (amplía ADR-0003)
- [ ] ADR-0007 Inventario por movimientos
- [ ] ADR-0008 Suscripciones con pago reportado
- [ ] Actualizar `DOMAIN-MODEL.md` y `DATABASE-DESIGN.md` con el plan maestro v2
- [ ] Pasar los componentes del boceto a `src/shared/ui`

**Terminado cuando:** `docker compose up` levanta todo en tu PC y el CI está en verde.

---

## Fase C. Cuentas y seguridad (2 al 15 nov)

- [ ] Registro de empresa: correo, contraseña de 12 o más caracteres comparada con filtraciones
- [ ] Verificación de correo con código (Mailpit en local)
- [ ] Doble factor obligatorio para empresas y admin; códigos de recuperación
- [ ] Límite de intentos, bloqueo progresivo, sesiones que vencen, cerrar todas las sesiones
- [ ] Aviso de inicio de sesión desde dispositivo nuevo
- [ ] Datos de la empresa con validación de RIF y WhatsApp; enlace único
- [ ] Estado En revisión; solicitudes en el admin; aprobar o rechazar con motivo y correo
- [ ] Equipo: invitaciones, roles y permisos por rol en el servidor
- [ ] Compradores: Google y correo, perfil, datos fiscales, direcciones
- [ ] Aislamiento entre empresas: contexto desde la sesión y seguridad por fila en PostgreSQL
- [ ] Pruebas: intentar leer datos de otra empresa debe fallar
- [ ] Auditoría de acciones sensibles

**Necesito de ti:** crear el proyecto en Google Cloud y el cliente OAuth (te guío paso a paso). Tú
pegas las claves en tu `.env`; nunca se suben al repo.

**Terminado cuando:** una empresa se registra con doble factor, tú la apruebas desde el admin y un
comprador entra con Google.

---

## Fase D. Monedas y tasas (16 al 22 nov)

- [ ] Tabla `exchange_rates` con historial, fuente y si es manual
- [ ] Tarea programada que consulta ve.dolarapi.com (oficial y paralelo) y Frankfurter (EUR/USD)
- [ ] Respaldo: última tasa válida y aviso; tasa manual desde el admin
- [ ] Módulo de dinero: céntimos enteros, tasas decimales exactas, conversión por Bs
- [ ] Formato venezolano (`Bs 1.548,00`, `USD 42,50`)
- [ ] Pruebas con casos límite: redondeo, tasa ausente, cambio de tasa a mitad de un pedido

**Terminado cuando:** cualquier precio se muestra en Bs con referencia USD usando la tasa del día y el
historial guarda cada tasa.

---

## Fase E. Catálogo e inventario (23 nov al 6 dic)

Se entrega por capas para que cada una funcione sola.

**Capa 1:** productos simples
- [ ] Categorías y marcas
- [ ] Productos con fotos (compresión WebP, sin EXIF), código y código de barras
- [ ] Stock simple con entradas, salidas y ajustes con motivo

**Capa 2:** venta mayorista
- [ ] Variantes con atributos
- [ ] Presentaciones con factor de conversión
- [ ] Escalas de precio y listas detal y mayorista
- [ ] Cantidad mínima y múltiplo de venta

**Capa 3:** varios almacenes
- [ ] Almacenes, stock por almacén y transferencias
- [ ] Alertas de stock bajo
- [ ] Importación y exportación Excel/CSV con vista previa de errores

**Además:**
- [ ] Configuración del catálogo: marca, color con control de contraste, moneda base, pedido mínimo,
      visibilidad del stock, publicar o pausar
- [ ] Enlace y código QR

**Terminado cuando:** una empresa carga un catálogo mayorista completo y el saldo de cada producto
coincide con la suma de sus movimientos.

---

## Fase F. Catálogo público y pedido (7 al 13 dic)

- [ ] Catálogo público con filtros, búsqueda y ficha
- [ ] Pedido guardado en el navegador; inicio de sesión al final sin perder el carrito
- [ ] Validación en el servidor: mínimos, múltiplos, pedido mínimo, disponibilidad
- [ ] Copia fija de precios, tasa y fecha; número correlativo por empresa
- [ ] Métodos de entrega de la empresa en el pedido
- [ ] Mensaje de WhatsApp y apertura de `wa.me`, con botón de respaldo y copiar
- [ ] Mis pedidos del comprador, con detalle y Repetir pedido
- [ ] Límite por IP y campo trampa en el envío de pedidos

**Terminado cuando:** un comprador hace un pedido real desde el celular, le llega a la empresa por
WhatsApp y aparece en el historial de ambos.

---

## Fase G. Gestión de pedidos (14 al 20 dic)

- [ ] Estados: Pendiente, Confirmado, En preparación, Listo para retiro o Despachado, Entregado,
      Cancelado
- [ ] Confirmar reserva stock; despachar descuenta; cancelar libera
- [ ] Ajustar cantidades antes de confirmar; el comprador ve el cambio
- [ ] Cancelación automática de pendientes viejos
- [ ] Historial de eventos de cada pedido
- [ ] Clientes de la empresa con sus pedidos; marcar como mayorista
- [ ] Inicio del panel con pendientes, stock bajo y tasa
- [ ] Nota de pedido imprimible

**Terminado cuando:** las pruebas de extremo a extremo recorren todo el ciclo y el stock cuadra en
cada paso.

---

## Fase H. Suscripciones y administración (21 al 27 dic)

- [ ] Planes con cupos de usuarios, productos y almacenes; cupos aplicados en el servidor
- [ ] Mes de prueba al aprobar
- [ ] Reportar pago con referencia y comprobante; validar en el admin; extensión automática
- [ ] Vencimiento: catálogo en solo lectura con aviso
- [ ] Admin: resumen, empresas (suspender, reactivar, modo lectura de soporte), compradores,
      denuncias, auditoría

**Terminado cuando:** puedes cobrar y controlar la plataforma entera desde el admin.

---

## Fase I. Pulido (28 dic al 3 ene)

- [ ] Accesibilidad: axe sin errores, teclado, lector de pantalla en flujos clave
- [ ] Rendimiento: catálogo con 2.000 productos fluido en un celular de gama baja
- [ ] Revisión de seguridad completa
- [ ] Revisión antislop de todos los textos
- [ ] Copias de seguridad de la base de datos probadas (respaldar y restaurar)
- [ ] Términos, privacidad y preguntas frecuentes
- [ ] README con instalación en un comando

**Terminado cuando:** está listo para publicar en cuanto haya dominio y servidor.

---

## Fase J. Publicación (cuando haya dinero)

- [ ] Elegir el camino A (gratis con límites) o B (VPS) del plan maestro
- [ ] Comprar el dominio y revisar que el nombre esté libre (también como marca)
- [ ] Correos reales con dominio verificado
- [ ] Google OAuth con el dominio real
- [ ] Monitoreo de errores y de disponibilidad
- [ ] Primeras 5 empresas en prueba para validar los precios de los planes

## Fase K. Crecimiento (después)

Según lo que pidan las primeras empresas: estadísticas, catálogo en PDF, lotes y vencimientos, toma de
inventario, lector de código de barras, llaves de acceso, pasarela de pago, dominio propio por
empresa, licencia con instalación propia.

---

## Primer día: lunes 12 de octubre

1. Mover `PLAN-DE-DESARROLLO.md` a `docs/historico/` con una nota de que fue reemplazado.
2. Actualizar el README con el nombre Vitrina y los enlaces al plan maestro y al roadmap.
3. Renombrar el paquete `catalogo-wa` a `vitrina`.
4. Crear la rama `feature/prototipo` desde `develop`.
5. Arrancar `prototipo/` con Vite, React, TypeScript y Tailwind, y cargar los tokens.
6. Primeros componentes y la portada del catálogo de demostración.
7. Action de GitHub Pages y primer enlace para verlo en tu teléfono.

## Cómo seguimos el avance

- Las casillas de este archivo se marcan al terminar cada tarea, en el mismo commit.
- Al cerrar cada fase se anota la fecha real y se ajustan las siguientes.
- Las decisiones nuevas van al plan maestro (sección 1) o a un ADR.
