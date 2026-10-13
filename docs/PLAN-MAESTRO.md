# Plan maestro: Vitrina

Plataforma de catálogos en línea con pedidos por WhatsApp. Funciona como Shopify, pero en lugar de
tiendas con pago en línea, cada empresa tiene un catálogo: se registra, la plataforma la aprueba, sube
sus productos con inventario, comparte un enlace, y los pedidos de sus clientes le llegan a WhatsApp y
quedan en el historial de ambos.

- Versión: 2 (decisiones del 2026-10-11 incorporadas)
- Inicio de desarrollo: lunes 2026-10-12
- Plan de acción y fechas: `docs/ROADMAP.md`
- Reemplaza el modelo de negocio de `docs/historico/PLAN-DE-DESARROLLO-v1.md` (operador que alquila la
  plataforma). La arquitectura de los ADR 0001 a 0004 se mantiene.

---

## 1. Decisiones tomadas

| # | Tema | Decisión |
|---|---|---|
| D1 | Nombre | Vitrina (variable `APP_NAME`, se cambia en un minuto) |
| D2 | Público | Cualquier empresa puede registrarse; el foco y las funciones fuertes son para mayoristas |
| D3 | Aprobación | Toda empresa queda En revisión hasta que el administrador la aprueba |
| D4 | Acceso de empresas | Correo y contraseña con la máxima seguridad: verificación de correo y doble factor obligatorio |
| D5 | Compradores | Tienen cuenta obligatoria para pedir; entran con Google o con correo; ven su historial de pedidos |
| D6 | Moneda | Igual que Control de Deudas: Bs, USD, EUR y USDT con tasas del día. Precio principal en bolívares a tasa BCV, con referencia en USD |
| D7 | Precios | Siempre visibles, también sin iniciar sesión |
| D8 | Entrega | Cada empresa configura sus métodos: retiro en tienda, delivery propio, envío por flete o encomienda, o a coordinar por WhatsApp |
| D9 | Inventario | Lo más detallado posible: variantes, presentaciones, almacenes, movimientos, reservas, alertas |
| D10 | Equipo | Varios usuarios por empresa con roles; a más usuarios, plan más caro |
| D11 | Modelo de negocio | Suscripción mensual por planes (recomendación en la sección 9) |
| D12 | Infraestructura | Costo cero: todo en GitHub y en local con Docker hasta tener dinero para dominio y servidor |
| D13 | Diseño | Antes de programar la aplicación real se hace un boceto navegable para probar el diseño |
| D14 | Catálogo por ruta | `vitrina.app/c/{empresa}`, funciona en cualquier hosting sin DNS comodín |

## 2. Qué cambia respecto al plan anterior

| Tema | Plan anterior | Plan nuevo |
|---|---|---|
| Quién vende la plataforma | Un operador la alquila a empresas | Tú la operas; las empresas se registran solas |
| Alta de empresas | La crea el operador | Autoregistro con aprobación tuya |
| Compradores | Anónimos | Con cuenta, Google, historial y repetir pedido |
| Inventario | Marca de agotado | Inventario completo con movimientos |
| Estados del pedido | Nuevo, Contactado, Cerrado | Pendiente, Confirmado, En preparación, Listo o Despachado, Entregado, Cancelado |
| Infraestructura | VPS de $25 a $55/mes | $0 hasta tener ingresos |
| Arquitectura | ADR 0001 a 0004 | Igual; con un único operador, que es la plataforma |

## 3. Los cinco espacios

```
vitrina.app/                     Sitio de la plataforma (qué es, planes, registro de empresas)
vitrina.app/c/{empresa}          Catálogo público de cada empresa
vitrina.app/cuenta               Cuenta del comprador (pedidos, direcciones, datos fiscales)
vitrina.app/panel                Panel de la empresa
vitrina.app/admin                Panel de la plataforma (solo tú)
```

### 3.1 Catálogo público

Se ve sin cuenta. La cuenta se pide solo al enviar el pedido, y el carrito no se pierde en el camino.

1. **Portada**: logo, nombre, descripción, horario, métodos de entrega, buscador, categorías en fila
   desplazable, cuadrícula de productos. Arriba, la tasa BCV del día con su fecha.
2. **Lista filtrada**: por categoría, marca, disponibilidad y precio; orden por relevancia, precio o
   nombre. Mensaje útil cuando no hay resultados.
3. **Ficha de producto**: galería, nombre, marca, código, precio en Bs con referencia en USD, escalas
   de precio por cantidad (1 a 11 unidades a un precio, 12 o más a otro), presentaciones (unidad, caja
   de 12, bulto de 48), variantes (talla, color, medida), disponibilidad según lo que la empresa quiera
   mostrar, cantidad mínima y múltiplo de venta, botón Agregar al pedido.
4. **Pedido**: lista editable, subtotal en Bs y referencia en USD, aviso si no llega al pedido mínimo
   de la empresa, elección del método de entrega, dirección guardada o nueva, nota.
5. **Inicio de sesión**: Google con un toque o correo y contraseña. Al volver, el pedido sigue ahí.
6. **Confirmación**: número de pedido, "Abriendo WhatsApp...", botón de respaldo si no abrió, botón
   para copiar el mensaje, enlace a Mis pedidos.

Una barra fija abajo muestra "3 productos, Bs 1.548,00, Ver pedido".

### 3.2 Cuenta del comprador

Una sola cuenta sirve para comprar en todos los catálogos de Vitrina.

| Sección | Qué hace |
|---|---|
| Mis pedidos | Historial de todas las empresas; filtro por empresa y estado; detalle con los precios y la tasa de ese día; estado actualizado por la empresa; Repetir pedido con precios de hoy |
| Mis empresas | Catálogos donde ha comprado, para volver rápido |
| Direcciones | Varias direcciones con nombre ("Depósito", "Casa") |
| Datos fiscales | Nombre o razón social, cédula o RIF, para que la empresa facture |
| Seguridad | Contraseña, Google vinculado, sesiones abiertas, borrar la cuenta |

### 3.3 Panel de la empresa

Navegación lateral en escritorio y barra inferior de 5 secciones en celular (el resto en Más).

| Sección | Qué hace |
|---|---|
| Inicio | Pedidos pendientes, productos con stock bajo, productos sin foto o sin precio, enlace y QR del catálogo, tasa del día |
| Pedidos | Lista por estado y fecha; detalle; confirmar (reserva stock), ajustar cantidades antes de confirmar, preparar, despachar, entregar, cancelar; abrir el chat de WhatsApp con el cliente; imprimir nota de pedido |
| Productos | Lista con búsqueda y filtros; crear y editar con variantes, presentaciones, escalas de precio, fotos; activar, pausar; acciones en lote; importar y exportar Excel/CSV |
| Inventario | Existencias por producto, variante y almacén; entradas, salidas, ajustes con motivo, transferencias entre almacenes; historial de movimientos; alertas de stock bajo |
| Categorías y marcas | Crear, renombrar, ordenar (accesible por teclado) |
| Clientes | Compradores que han pedido: datos fiscales, pedidos, total comprado; marcar como mayorista |
| Entrega | Métodos activos, zonas y costos de delivery, dirección y horario de retiro, agencias de envío |
| Catálogo | Logo, portada, color, descripción, horario, WhatsApp, moneda base de precios, pedido mínimo, qué stock mostrar, publicar o pausar, vista previa |
| Equipo | Invitar usuarios y asignar roles; cupos según el plan |
| Suscripción | Plan actual, uso de cupos, reportar pago, historial de pagos |
| Seguridad | Doble factor, sesiones, registro de actividad de la empresa |

Roles de equipo:

| Rol | Puede |
|---|---|
| Dueño | Todo, incluida la suscripción y borrar la empresa |
| Administrador | Todo menos suscripción y borrar la empresa |
| Vendedor | Pedidos y clientes; ver productos e inventario |
| Almacén | Inventario y preparar o despachar pedidos |
| Solo lectura | Ver todo, sin cambios |

### 3.4 Panel de la plataforma

| Sección | Qué hace |
|---|---|
| Resumen | Empresas por estado, pedidos de la semana, suscripciones activas y vencidas, ingresos |
| Solicitudes | Empresas En revisión con sus datos (RIF, razón social, dirección, redes, rubro); aprobar o rechazar con motivo |
| Empresas | Buscar, ver detalle, suspender, reactivar, entrar en modo lectura para soporte (queda en auditoría) |
| Pagos | Pagos reportados por las empresas con referencia y comprobante; validar o rechazar; la suscripción se extiende sola |
| Planes | Precios y cupos de cada plan |
| Tasas | Tasas del día, fuente, historial; corrección manual si la fuente falla |
| Compradores | Buscar cuentas, bloquear por abuso |
| Denuncias | Catálogos reportados por estafa o contenido ilegal |
| Auditoría | Quién hizo qué y cuándo |

Tu cuenta de administrador usa doble factor obligatorio y no puede entrar con Google.

### 3.5 Sitio de la plataforma

Portada (qué es, cómo funciona en 3 pasos, catálogo de demostración marcado como tal, planes,
preguntas frecuentes), registro de empresa, registro de comprador, inicio de sesión, recuperar
contraseña, términos, privacidad.

## 4. Flujos principales

### 4.1 Registro y aprobación de empresas

1. Correo y contraseña. La contraseña pide 12 caracteres o más y se compara contra filtraciones
   conocidas.
2. Verificación del correo con un código.
3. Activación del doble factor (aplicación autenticadora) y entrega de códigos de recuperación.
4. Datos de la empresa: razón social, RIF (con validación de formato), nombre comercial, rubro,
   dirección, WhatsApp (formato internacional), redes sociales.
5. Enlace propuesto (`/c/ferreteria-lopez`) con aviso si está tomado.
6. Estado **En revisión**. Mientras tanto la empresa ya puede cargar productos e inventario, pero el
   catálogo no es público.
7. Tú revisas en el admin y apruebas o rechazas con motivo. La empresa recibe un correo.
8. Al aprobar empieza el período de prueba y la empresa puede publicar.

Lista de revisión sugerida: el RIF tiene formato válido, el WhatsApp responde, las redes coinciden con
la empresa, el rubro no es ilegal.

### 4.2 Pedido por WhatsApp

1. El comprador envía el pedido desde su cuenta.
2. El servidor valida cantidades mínimas, múltiplos, pedido mínimo y disponibilidad, y guarda el pedido
   con una copia fija de nombres, códigos, precios, la tasa usada y su fecha. Número correlativo por
   empresa (`#0042`). Estado **Pendiente**.
3. El navegador abre `https://wa.me/{numero}?text={mensaje}` con el pedido escrito.
4. El comprador toca Enviar en WhatsApp. El pedido ya aparece en su historial y en el panel.

Ejemplo de mensaje:

```
Hola, quiero hacer este pedido en Ferretería López:

Pedido #0042
2 x Tornillo autorroscante 3/8 (caja 100)   Bs 327,60
1 x Martillo de uña 16 oz                   Bs 455,00

Total: Bs 782,60 (Ref. USD 21,50)
Tasa BCV 36,40 del 12/10/2026
Entrega: envío por encomienda a Valencia, a coordinar
Cliente: Ana Pérez, V-12.345.678

Ver pedido: vitrina.app/p/7Kq2...
```

Las cifras de arriba son de ejemplo. Este método no usa la API de WhatsApp Business y cuesta $0. Para
compensar lo que no sabe, el pedido guarda cuándo el comprador abrió WhatsApp con el mensaje y el panel
ofrece avisarle al cliente cada cambio de estado con un toque (ADR-0005). Su
límite es que la plataforma no sabe si el comprador tocó Enviar; por eso el pedido nace Pendiente y la
empresa lo confirma.

### 4.3 Ciclo del pedido e inventario

```
Pendiente ──confirmar──> Confirmado ──> En preparación ──> Listo para retiro ──> Entregado
    │                        │                         └──> Despachado ───────┘
    └──cancelar──> Cancelado <┘ (libera la reserva)
```

- **Pendiente**: no toca el stock. Así los pedidos falsos o abandonados no bloquean inventario.
  Antes de confirmar, la empresa puede ajustar cantidades si no tiene todo; el comprador ve el cambio.
- **Confirmado**: el stock pasa a comprometido (reservado).
- **Despachado o Listo para retiro**: sale del stock físico y se libera la reserva.
- **Cancelado**: libera la reserva si existía.
- Pendientes sin confirmar por más de N días (configurable) se cancelan solos.
- Cada cambio de estado queda en el historial del pedido con usuario y fecha.

Disponible = físico menos comprometido.

### 4.4 Entrega

Cada empresa activa uno o varios métodos:

| Método | Configuración | Costo en el pedido |
|---|---|---|
| Retiro en tienda | Dirección, horario, varias sucursales | Gratis |
| Delivery propio | Zonas con costo fijo, o a coordinar | Se suma si es fijo |
| Envío por flete o encomienda | Agencias con las que trabaja; el comprador indica agencia y ciudad destino | A coordinar (cobro a destino o aparte) |
| A coordinar por WhatsApp | Texto libre de la empresa | A coordinar |

### 4.5 Carga masiva

Plantilla Excel/CSV para productos, variantes, precios e inventario inicial. Al subirla se ve una vista
previa con errores por fila antes de guardar. Las fotos se suben aparte y se emparejan por código
(`TOR-38.jpg`). También se exporta todo a Excel.

## 5. Monedas y tasas

Mismo comportamiento que Control de Deudas (`02-proyectos/control-deudas/web/app.js`), pero calculado
en el servidor y con historial.

| Moneda | Tasa a bolívares | Fuente |
|---|---|---|
| Bs | 1 | |
| USD | Oficial BCV | ve.dolarapi.com (`oficial`) |
| EUR | USD BCV por la paridad EUR/USD del BCE | Frankfurter |
| USDT | Paralelo | ve.dolarapi.com (`paralelo`) |

Reglas:
- Una tarea programada consulta las fuentes varias veces al día y guarda cada tasa con fecha y fuente
  en `exchange_rates`. Si la fuente falla se usa la última tasa válida y el admin ve el aviso; tú
  puedes fijar la tasa a mano, como en Control de Deudas.
- Cada empresa elige la moneda base en la que carga sus precios (casi siempre USD).
- El catálogo muestra el **precio principal en bolívares** (moneda de curso legal) y debajo la
  **referencia en USD**. La conversión pasa por bolívares: precio en Bs = precio base por su tasa; la
  referencia en USD = Bs entre la tasa BCV.
- Los montos se guardan como enteros en la unidad mínima (céntimos) y las tasas como decimal exacto,
  nunca como número de coma flotante (ADR-0003).
- El pedido guarda la tasa y la fecha usadas. El historial muestra lo que el comprador vio ese día;
  Repetir pedido recalcula con la tasa de hoy.
- Formato venezolano: `Bs 1.548,00` y `USD 42,50`.

## 6. Inventario

| Concepto | Detalle |
|---|---|
| Producto | Nombre, marca, categoría, descripción, código (SKU), código de barras, unidad de medida, fotos, estado |
| Variantes | Combinaciones de atributos (talla, color, medida); cada una con su SKU, precio y stock |
| Presentaciones | Unidad, caja de N, bulto de N, con factor de conversión y precio propio; el stock se lleva en la unidad base |
| Escalas de precio | Precio por rango de cantidad (detal y mayor) |
| Listas de precios | Detal y mayorista; el comprador marcado como mayorista ve su lista |
| Venta | Cantidad mínima, múltiplo de venta, permitir pedir sin stock (bajo pedido) o no |
| Almacenes | Uno o varios (según plan); stock por almacén |
| Movimientos | Entrada, salida por pedido, ajuste con motivo, transferencia, reserva, liberación. Son inmutables; el saldo se calcula de ellos y se guarda en caché |
| Existencias | Físico, comprometido, disponible |
| Alertas | Stock mínimo por producto; aviso en el Inicio del panel |
| Costo | Costo de compra privado y margen (nunca visible al comprador) |
| Visibilidad | La empresa elige: mostrar cantidad exacta, mostrar Disponible, Pocas unidades o Agotado, u ocultarlo |
| Después | Lotes y vencimientos, toma de inventario física, código de barras con la cámara |

## 7. Seguridad de las cuentas

**Empresas y administrador**
- Contraseña de 12 caracteres o más, comparada contra filtraciones conocidas (consulta anónima a
  Have I Been Pwned, gratuita).
- Hash argon2id.
- Verificación de correo obligatoria.
- Doble factor obligatorio con aplicación autenticadora (TOTP) y 10 códigos de recuperación.
- Límite de intentos con bloqueo progresivo por cuenta y por IP.
- Sesiones guardadas en la base de datos, que se renuevan al iniciar sesión y vencen por inactividad.
- Cookies HttpOnly, Secure y SameSite.
- Aviso por correo de inicio de sesión desde un dispositivo nuevo.
- Cerrar todas las sesiones con un botón.
- Volver a pedir la contraseña para acciones sensibles (cambiar el WhatsApp, borrar la empresa,
  quitar el doble factor).
- Más adelante: llaves de acceso (passkeys).

**Compradores**
- Google (OpenID Connect) o correo y contraseña con verificación.
- Doble factor opcional.

**Plataforma**
- Aislamiento entre empresas en dos capas (ADR-0002): el `business_id` sale siempre de la sesión en el
  servidor, y PostgreSQL aplica seguridad por fila.
- Pruebas que intentan leer datos de otra empresa (deben fallar).
- Formularios públicos con límite por IP y campo trampa contra bots.
- Imágenes: se valida el tipo real, se limita el tamaño, se recomprimen a WebP y se borran los datos
  EXIF.
- Auditoría de acciones sensibles.

Biblioteca propuesta: Better Auth (correo y contraseña, Google, doble factor, organizaciones y roles,
límite de intentos, adaptador de Drizzle). Se confirma en ADR-0006 tras una prueba corta; si no cumple,
se arma con Arctic y Oslo, que es lo que ya decía ADR-0001.

## 8. Diseño

Dirección: minimalismo suizo. Mucho blanco, una sola tipografía, un solo color de acción, cuadrícula
clara, sin decoración. La herramienta desaparece y se ven los productos de cada empresa.

### 8.1 Tokens

| Token | Valor | Uso |
|---|---|---|
| `--bg` | #F8FAFC | Fondo general |
| `--surface` | #FFFFFF | Tarjetas, tablas, formularios |
| `--fg` | #1E293B | Texto principal |
| `--fg-muted` | #475569 | Texto secundario (contraste 7:1) |
| `--border` | #E2E8F0 | Bordes y divisores |
| `--primary` | #2563EB | Botón principal, enlaces, foco (contraste 5.2:1 con blanco) |
| `--danger` | #DC2626 | Eliminar, errores |
| `--success` | #15803D | Confirmaciones |
| `--warning` | #B45309 | Stock bajo, pendientes |

- Tipografía: Plus Jakarta Sans (400 a 700). Base 16 px, interlineado 1.5. Números tabulares en
  precios, cantidades y tablas.
- Espaciado en escala de 4 px. Panel denso; catálogo y sitio más aireados.
- Radios de 8 px en controles y 12 px en tarjetas. Separación con bordes, casi sin sombras.
- Iconos: Lucide en SVG. El de WhatsApp y el de Google salen de sus marcas oficiales. Sin emojis.
- Movimiento de 150 a 200 ms, solo como respuesta a una acción. Respeta `prefers-reduced-motion`.
- Sin modo oscuro en la primera versión.

### 8.2 Marca de cada empresa

El catálogo usa los tokens más el logo y el color de la empresa. El color va solo en el botón
principal, la barra del pedido y los acentos. El sistema decide si el texto encima va blanco o negro
y, si no llega a contraste 4.5:1, oscurece el color y avisa en el panel.

### 8.3 Reglas de interfaz

- Móvil primero; se prueba en 375, 768, 1024 y 1440 px, sin desplazamiento horizontal.
- Áreas táctiles de 44 x 44 px como mínimo.
- Foco visible y uso completo con teclado.
- Etiquetas visibles en los formularios. Validación al salir del campo y, al enviar, un resumen de
  errores con enlaces a cada campo.
- Cada botón muestra carga y resultado. Ningún control sin función.
- Imágenes WebP con espacio reservado y carga diferida.
- Estados vacíos que dicen qué hacer.
- Tablas del panel: en celular se convierten en tarjetas.
- Sin datos inventados fuera del catálogo de demostración, que se marca como tal.

## 9. Modelo de negocio

Recomendación: **suscripción mensual por planes**, con un mes de prueba al aprobar la empresa y dos
meses gratis si paga el año.

Por qué no una venta única: el servidor, la base de datos, los correos y tu tiempo de soporte son
gastos de todos los meses. Una venta única cobra una vez y paga para siempre; tendría que ser muy cara
y frenaría el crecimiento que buscas. La venta única sí tiene sentido como producto aparte, más
adelante: una **licencia** con instalación propia para una empresa grande o un revendedor que quiera
su propia Vitrina con su marca (el modelo del plan anterior).

Planes propuestos (hipótesis para validar con 5 empresas reales antes de fijar precios):

| Plan | Usuarios | Productos | Almacenes | Incluye | Precio de partida |
|---|---|---|---|---|---|
| Inicial | 1 | 200 | 1 | Catálogo, pedidos, inventario básico | USD 9/mes |
| Negocio | 3 | 2.000 | 2 | Variantes, presentaciones, escalas, Excel, clientes | USD 19/mes |
| Mayorista | 10 | Sin límite | 5 | Listas de precios mayoristas, varios almacenes, estadísticas, roles completos | USD 39/mes |
| Usuario extra | +1 | | | En Negocio y Mayorista | USD 3/mes |

Cobro en el MVP sin pasarela de pago: la empresa reporta el pago (pago móvil, transferencia, Zelle o
USDT) con su referencia y comprobante; tú lo validas en el admin y la suscripción se extiende. El monto
se muestra en Bs a tasa BCV con referencia en USD. Si un pago vence, el catálogo queda en solo lectura
con un aviso, sin borrar datos.

## 10. Arquitectura

ADR-0001 sin cambios: monolito modular en Next.js (App Router), TypeScript estricto, PostgreSQL 16,
Drizzle ORM, Zod, almacenamiento S3 (MinIO en local) y Docker Compose.

```
prototipo/              boceto navegable (fase A), se publica en GitHub Pages
src/
  app/
    (sitio)/            portada, planes, registro, login
    c/[slug]/           catálogo público
    p/[token]/          vista pública de un pedido
    cuenta/             cuenta del comprador
    panel/              panel de la empresa
    admin/              panel de la plataforma
  modules/
    auth/ business/ buyer/ catalog/ product/ inventory/ pricing/ currency/
    delivery/ order/ whatsapp/ media/ team/ billing/ admin/ audit/
  shared/
    db/ money/ tenant/ ui/ validation/
```

Las páginas no tocan la base de datos; llaman a funciones de servicio de cada módulo.

## 11. Modelo de datos

| Grupo | Tablas |
|---|---|
| Cuentas | `users`, `accounts` (Google), `sessions`, `two_factor`, `verification_tokens` |
| Empresas | `businesses`, `business_reviews` (solicitudes y motivo), `memberships` (rol), `invitations` |
| Compradores | `buyer_profiles` (datos fiscales), `buyer_addresses`, `business_customers` (relación empresa y comprador, lista de precios) |
| Catálogo | `catalogs`, `categories`, `brands`, `products`, `product_images`, `attributes`, `variants`, `presentations`, `price_lists`, `price_tiers` |
| Inventario | `warehouses`, `stock_levels` (saldo en caché), `stock_movements` (inmutable) |
| Entrega | `delivery_methods`, `delivery_zones`, `pickup_points` |
| Pedidos | `orders` (copia de tasa y totales), `order_items` (copia fija), `order_events` (historial de estados) |
| Monedas | `exchange_rates` (moneda, valor, fuente, fecha, manual o automática) |
| Suscripción | `plans`, `subscriptions`, `payments` (reportados, validados) |
| Plataforma | `reports` (denuncias), `audit_log` |

`DOMAIN-MODEL.md` y `DATABASE-DESIGN.md` se actualizan en la fase B con estos cambios.

## 12. Costo cero: ahora y al publicar

**Ahora**

| Pieza | Cómo | Costo |
|---|---|---|
| Código | Repositorio público en GitHub | $0 |
| Pruebas | GitHub Actions (gratis en repos públicos) | $0 |
| Boceto | GitHub Pages | $0 |
| Base de datos, imágenes y correos | PostgreSQL, MinIO y Mailpit en Docker Desktop | $0 |
| Inicio con Google | Proyecto gratuito en Google Cloud con dirección `localhost` | $0 |
| Tasas | ve.dolarapi.com y Frankfurter (gratuitas) | $0 |

**Al publicar**, dos caminos:
- **A, gratis con límites**: Netlify o Cloudflare para la app (permiten uso comercial; Vercel Hobby
  no), Neon o Supabase para PostgreSQL, Cloudflare R2 para imágenes, Resend para correos. Algunos piden
  tarjeta solo para verificar.
- **B, servidor propio**: un VPS de USD 5 a 12 al mes con Docker Compose, igual que en desarrollo,
  más el dominio (USD 10 a 15 al año). Es el camino natural de esta arquitectura.

Los correos reales (verificación, avisos) necesitan dominio propio para no caer en spam. Hasta
entonces se prueban con Mailpit.

## 13. Calidad

- Pruebas unitarias (Vitest) de dinero, tasas, escalas de precio, inventario y mensaje de WhatsApp.
- Pruebas de extremo a extremo (Playwright) de registro, aprobación, pedido y ciclo de stock.
- Accesibilidad automática (axe) en cada pantalla, dentro del CI.
- Lint, tipos, pruebas y build en verde antes de unir cualquier rama.
- Commits con Conventional Commits; tú eres el único autor.

## 14. Riesgos

| Riesgo | Mitigación |
|---|---|
| Pedir cuenta al comprador reduce pedidos | Se pide solo al final, con Google en un toque, sin perder el carrito |
| Pedidos que nunca se envían por WhatsApp | Nacen Pendientes y no reservan stock; el panel marca los que no llegaron a abrir WhatsApp; se cancelan solos (ADR-0005) |
| Fuente de tasas caída o con error | Última tasa válida, aviso en el admin, tasa manual |
| Estafas | Aprobación manual, denuncias, suspensión, auditoría |
| El inventario detallado alarga el proyecto | Se entrega por capas: stock simple, luego variantes y presentaciones, luego almacenes |
| Límites de planes gratuitos | Cupos por plan y compresión de imágenes desde el día uno |
| Alcance que crece sin parar | Lo que no está en la fase actual del roadmap espera |

## 15. Pendientes de decidir (no bloquean el lunes)

1. Precios definitivos de los planes, después de hablar con empresas reales.
2. Lista de precios mayorista: ¿visible para todos o solo para compradores que la empresa marque como
   mayoristas? Propuesta: solo para los marcados; los demás ven el precio detal.
3. ¿El comprador puede cambiar la moneda que ve (por ejemplo, ver todo en USDT)? Propuesta: no en la
   primera versión.
