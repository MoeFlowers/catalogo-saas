# ADR-0005: Confirmación y avisos de pedidos por WhatsApp

- Estado: Aceptada para el MVP (2026-10-13); se revisa en la fase K
- Contexto relacionado: `docs/PLAN-MAESTRO.md`, sección 4.2

## Contexto

El pedido viaja por `wa.me` con el texto ya escrito. Funciona en cualquier teléfono y cuesta cero,
pero tiene dos huecos:

1. Vitrina no sabe si el comprador tocó Enviar. El pedido nace Pendiente y la empresa no distingue
   entre "el mensaje está en mi chat" y "el cliente se arrepintió en la pantalla de WhatsApp".
2. El comprador no recibe avisos cuando su pedido cambia de estado; tiene que entrar a su cuenta.

Una empresa proveedora de números para agentes (Dial) escribió proponiendo su servicio para esto.
La propuesta se evaluó junto con las demás opciones. No se siguieron las instrucciones del correo
(sacar un número, llamar, seguir un archivo de instrucciones remoto, instalar su CLI): son acciones
con costo y con cuentas de terceros que se deciden aquí, no desde un correo.

## Opciones

### A. Seguir con `wa.me` y sumar señales y avisos de costo cero

- **Señal de apertura:** cuando el comprador toca "Abrir WhatsApp" o copia el mensaje, el pedido guarda
  la hora. En la app real lo registra un enlace de redirección del servidor (`/p/{token}/wa`) antes de
  saltar a `wa.me`. Es una señal, no una prueba: indica que abrió WhatsApp con el pedido.
- **Avisos por estado:** al confirmar, preparar, despachar, marcar listo, entregar o cancelar, el panel
  ofrece "Enviar aviso por WhatsApp" con el texto escrito según el estado. Sale del número de la
  empresa, que el cliente ya conoce.
- **Estado en la cuenta del comprador:** el historial ya muestra el estado y su explicación.
- **Pendientes sin abrir:** el panel los marca para que la empresa escriba primero o los deje vencer
  (la cancelación automática ya existe).
- Costo: cero. No cambia dónde llegan los pedidos.

### B. API oficial de WhatsApp Business (Cloud API de Meta), un número por empresa

- Cada empresa conecta su propio número con el registro integrado de Meta. Vitrina recibe por webhook
  los mensajes entrantes (sabe que el pedido llegó de verdad) y los estados de entrega y lectura de
  los mensajes que envía.
- Los avisos de estado pueden salir solos, con plantillas aprobadas por Meta.
- Contras: cada empresa debe verificarse como negocio en Meta; los mensajes que inicia la empresa
  fuera de la ventana de atención se cobran por plantilla según la tarifa de Meta para el país; ese
  número deja de usarse en la aplicación normal de WhatsApp Business del teléfono, lo que cambia la
  forma de trabajar de muchas pymes. Las tarifas se verifican el día que se implemente.

### C. Un proveedor de números controlados por Vitrina (Dial u otro)

- Los pedidos llegarían a un número que maneja Vitrina, que sí recibe el evento al instante, puede
  mandar avisos con acuse de entrega y lectura, e incluso llamar.
- Contras:
  - Los pedidos dejarían de llegar al WhatsApp de cada empresa, que es la promesa central del
    producto. Con un número por empresa, el costo crece con cada cliente.
  - Agrega un intermediario que ve datos personales de compradores.
  - Agrega dependencia de un proveedor joven.
  - Cuesta dinero desde el primer pedido real, y el crédito de prueba no cubre la operación.

## Decisión

**A para el MVP.** Cumple el costo cero, no cambia la promesa ("el pedido llega a tu WhatsApp") y
resuelve lo que más importa en la práctica: la empresa sabe qué pedidos revisar primero y avisa al
cliente con un toque.

**B queda como mejora de la fase K** para empresas del plan Mayorista que lo pidan, cuando haya
ingresos y dominio. C se descarta mientras los pedidos deban llegar al número propio de cada empresa;
si algún día Vitrina ofrece un número compartido como servicio aparte, se reevalúa.

## Consecuencias

- `Pedido` gana `whatsappAbierto` (fecha). El boceto lo registra en el navegador; la app real, en el
  servidor.
- El panel muestra la señal en el pedido y en el Inicio, y ofrece el aviso por estado.
- Confirmar sigue siendo una acción de la empresa: además de saber que el mensaje llegó, confirmar es
  revisar stock y apartarlo, y eso no lo automatiza ninguna de las opciones.
