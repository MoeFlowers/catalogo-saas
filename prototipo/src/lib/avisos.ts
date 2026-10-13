import type { Empresa, Pedido } from "../datos/tipos";
import { formatear } from "./dinero";
import { numeroPedido } from "./pedido";

/**
 * Mensaje para avisarle al cliente que cambió el estado de su pedido. Lo envía la empresa desde su
 * propio WhatsApp con un toque (wa.me con el texto escrito): costo cero y el cliente lo recibe del
 * número que ya conoce. Ver ADR-0005.
 */
export function mensajeEstado(p: Pedido, e: Empresa): string | null {
  const n = numeroPedido(p.numero);
  const saludo = `Hola ${p.comprador.nombre}, te escribimos de ${e.nombre}.`;
  const retiro = e.entregas.find((x) => x.tipo === "retiro");
  switch (p.estado) {
    case "confirmado":
      return `${saludo} Confirmamos tu pedido ${n} por ${formatear(p.totalBsCent, "VES")} y apartamos la mercancía. Te avisamos cuando esté ${p.entrega === "retiro" ? "listo para retirar" : "en camino"}.`;
    case "preparacion":
      return `${saludo} Estamos preparando tu pedido ${n}.`;
    case "listo":
      return `${saludo} Tu pedido ${n} está listo para retirar.${retiro ? ` ${retiro.detalle}` : ""} Horario: ${e.horario}`;
    case "despachado":
      return `${saludo} Tu pedido ${n} salió${p.destino ? ` hacia ${p.destino}` : ""}. Te avisamos cualquier novedad.`;
    case "entregado":
      return `${saludo} Tu pedido ${n} figura como entregado. Gracias por tu compra.`;
    case "cancelado":
      return `${saludo} Tu pedido ${n} quedó cancelado. Si quieres, lo revisamos juntos por aquí.`;
    default:
      return null;
  }
}
