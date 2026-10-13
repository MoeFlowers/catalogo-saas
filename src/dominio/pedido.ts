import type { Empresa, ItemPedido, LineaPedido, Pedido, Producto, Tasas } from "./tipos";
import { aBs, formatear, formatearFecha, formatearTasa, refUsd } from "./dinero";
import { presentacion, precioUnitario } from "./precio";

export interface LineaCalculada {
  linea: LineaPedido;
  producto: Producto;
  nombrePresentacion: string;
  nombreVariante?: string | undefined;
  unidadesBase: number;
  precioUnitCent: number;
  totalCent: number;
  totalBsCent: number;
}

export function calcularLinea(linea: LineaPedido, empresa: Empresa, tasas: Tasas, productos: Producto[]): LineaCalculada | null {
  const producto = productos.find((p) => p.id === linea.productoId);
  if (!producto) return null;
  const pres = presentacion(producto, linea.presentacionId);
  const unidadesBase = linea.cantidad * pres.factor;
  const precioUnitCent = precioUnitario(producto, unidadesBase);
  const totalCent = precioUnitCent * unidadesBase;
  return {
    linea,
    producto,
    nombrePresentacion: pres.nombre,
    nombreVariante: producto.variantes?.find((v) => v.id === linea.varianteId)?.nombre,
    unidadesBase,
    precioUnitCent,
    totalCent,
    totalBsCent: aBs(totalCent, empresa.monedaBase, tasas) ?? 0,
  };
}

export function detalleLinea(c: Pick<LineaCalculada, "nombrePresentacion" | "nombreVariante" | "producto">): string {
  const partes = [c.nombrePresentacion];
  if (c.nombreVariante) partes.push(`${c.producto.atributo ?? "Opción"} ${c.nombreVariante}`);
  return partes.join(", ");
}

export function aItem(c: LineaCalculada): ItemPedido {
  return {
    productoId: c.producto.id,
    varianteId: c.linea.varianteId,
    presentacionId: c.linea.presentacionId,
    nombre: c.producto.nombre,
    detalle: detalleLinea(c),
    sku: c.producto.variantes?.find((v) => v.id === c.linea.varianteId)?.sku ?? c.producto.sku,
    cantidad: c.linea.cantidad,
    unidadesBase: c.unidadesBase,
    precioUnitCent: c.precioUnitCent,
    totalCent: c.totalCent,
    totalBsCent: c.totalBsCent,
  };
}

export const NOMBRE_ENTREGA = {
  retiro: "Retiro en tienda",
  delivery: "Delivery",
  encomienda: "Envío por encomienda",
  coordinar: "A coordinar por WhatsApp",
} as const;

export function numeroPedido(n: number): string {
  return `#${String(n).padStart(4, "0")}`;
}

/** Mensaje que el comprador envía por WhatsApp. Determinista: mismo pedido, mismo texto. */
export function mensajeWhatsApp(p: Pedido, empresa: Empresa, enlace: string): string {
  const tasas: Tasas = { bcv: p.tasa, usdt: p.tasa, eur: null, fecha: p.fechaTasa, origen: "en-vivo" };
  const lineas = [
    `Hola, quiero hacer este pedido en ${empresa.nombre}:`,
    "",
    `Pedido ${numeroPedido(p.numero)}`,
    ...p.items.map((i) => `${i.cantidad} x ${i.nombre} (${i.detalle}): ${formatear(i.totalBsCent, "VES")}`),
    "",
    `Total: ${formatear(p.totalBsCent, "VES")} (Ref. ${formatear(refUsd(p.totalBsCent, tasas), "USD")})`,
    `Tasa BCV ${formatearTasa(p.tasa)} del ${formatearFecha(p.fechaTasa)}`,
    `Entrega: ${NOMBRE_ENTREGA[p.entrega]}${p.destino ? `, ${p.destino}` : ""}`,
    `Cliente: ${p.comprador.nombre}${p.comprador.documento ? `, ${p.comprador.documento}` : ""}`,
  ];
  if (p.nota) lineas.push(`Nota: ${p.nota}`);
  lineas.push("", `Ver pedido: ${enlace}`);
  return lineas.join("\n");
}
