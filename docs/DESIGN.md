# Diseño de Vitrina

Dirección visual y el porqué de cada decisión. Los tokens viven en `prototipo/src/index.css` y pasan
tal cual a la aplicación real en la fase B.

Lectura: catálogo y panel de pedidos para empresas mayoristas venezolanas y sus clientes, usado casi
siempre en el celular; lenguaje suizo sobrio. Diales: ENERGÍA 1, RITMO 2, MOVIMIENTO 1.

- **Energía 1**: es una herramienta de trabajo. Lo que tiene que destacar son los productos y los
  precios de cada empresa, no Vitrina.
- **Ritmo 2**: la portada del catálogo, la ficha y el pedido tienen composiciones distintas porque
  resuelven tareas distintas; dentro de cada una, la repetición (cuadrícula de productos, lista de
  líneas) es deliberada para que se pueda escanear.
- **Movimiento 1**: solo estados de hover, foco y carga. Nada se anima solo.

## Motivo de identidad: la etiqueta de anaquel

Todo precio se muestra como una tira de precio de anaquel: filete superior oscuro, cifra grande en
bolívares, referencia en dólares debajo y la presentación ("por caja de 100"). Es lo que un comprador
de ferretería o distribuidora ya lee de un vistazo en la tienda física, y se repite en tarjetas, ficha,
pedido e historial. Componente: `prototipo/src/ui/Etiqueta.tsx`.

## Decisiones y razón

| Decisión | Razón |
|---|---|
| Fondo #F8FAFC, superficie blanca | Las fotos de productos de cada empresa traen sus propios colores; un fondo neutro no compite con ellas |
| Tinta #1E293B y tenue #475569 | Contraste 13:1 y 7:1; el texto secundario sigue legible a pleno sol en la calle |
| Acción de la plataforma #2563EB | Un solo color para actuar en el panel y el sitio (5.2:1 con texto blanco). No es verde para no confundirse con el botón de WhatsApp |
| Color de marca por empresa | En el catálogo, el botón principal, la barra del pedido y el foco usan el color de la empresa: el catálogo es de ella, no de Vitrina. `marcaSegura()` lo oscurece hasta 4.5:1 si hace falta |
| Peligro #B91C1C, éxito #15803D, alerta #B45309 | Pasan 4.5:1 sobre blanco y sobre sus fondos de aviso. El estado nunca va solo en color: siempre hay texto |
| Borde de controles #7C8BA1 | 3.4:1 contra blanco: los campos y selectores se distinguen del fondo (WCAG 1.4.11). Las divisiones decorativas usan #E2E8F0 |
| Plus Jakarta Sans | Aperturas abiertas y cifras tabulares: los precios en columnas se alinean y "1.548,00" no se confunde. Una sola familia para todo |
| Cifras tabulares en todo número | Precios, cantidades y totales se comparan por columna |
| Radio 8 px en controles, 12 px en tarjetas | Distingue "esto se toca" de "esto agrupa" sin volver todo una píldora |
| Casi sin sombras | La separación la dan bordes y espacio; la única superficie elevada es la barra fija del pedido |
| Tarjetas solo en la cuadrícula de productos | Cada producto es una unidad que se toca; el resto de la interfaz son listas y secciones |
| Iconos Lucide, solo en navegación y acciones | Cubren el vocabulario de comercio (bolsa, camión, almacén) con un trazo fino que acompaña los bordes finos. Nunca decorativos; siempre con texto o etiqueta accesible |
| Iconos de WhatsApp y Google con su marca | Son botones de terceros que la gente reconoce por su logo |
| Sin fotos inventadas en el boceto | Cada producto muestra su código y "Foto del producto"; las fotos reales las sube cada empresa |
| Sin modo oscuro en la primera versión | Uso diurno, en tienda y en la calle; un solo tema bien probado antes que dos a medias |

## Reglas de interfaz

- Móvil primero; se prueba en 375, 768, 1024 y 1440 px, sin desplazamiento horizontal.
- Áreas táctiles de 44 x 44 px como mínimo.
- Foco visible en todo control.
- Formularios con etiqueta visible, validación al enviar, resumen de errores con enlaces a cada campo.
- Estados vacío, cargando y error con causa y siguiente paso.
- Sin rayas largas, sin emojis, sin datos inventados fuera de lo rotulado como demostración.
