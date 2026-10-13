import type { EstadoPedido } from "./tipos";

export const NOMBRE_ESTADO: Record<EstadoPedido, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  preparacion: "En preparación",
  listo: "Listo para retiro",
  despachado: "Despachado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export const EXPLICACION_ESTADO: Record<EstadoPedido, string> = {
  pendiente: "La empresa todavía no lo confirma. Si no enviaste el mensaje de WhatsApp, puedes hacerlo desde aquí.",
  confirmado: "La empresa confirmó el pedido y apartó la mercancía.",
  preparacion: "La empresa está preparando tu pedido.",
  listo: "Puedes pasar a retirarlo en el horario de la tienda.",
  despachado: "El pedido salió de la tienda.",
  entregado: "Pedido entregado.",
  cancelado: "Este pedido fue cancelado.",
};
