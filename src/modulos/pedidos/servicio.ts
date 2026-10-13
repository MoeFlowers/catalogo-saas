import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, inArray, lt, sql } from "drizzle-orm";
import type { Tx } from "@/lib/db";
import { businesses, orderEvents, orderItems, orders, products, productVariants, stockMovements } from "@/lib/db/esquema";
import { aBs } from "@/dominio/dinero";
import { aItem, calcularLinea } from "@/dominio/pedido";
import { presentacion, validarCantidad } from "@/dominio/precio";
import type { Empresa, EstadoPedido, Pedido, Tasas } from "@/dominio/tipos";
import { productosDe, varianteDeLinea } from "../catalogo/consultas";

/** Transiciones permitidas del pedido (plan maestro, sección 4.3) */
export const SIGUIENTES: Record<EstadoPedido, EstadoPedido[]> = {
  pendiente: ["confirmado", "cancelado"],
  confirmado: ["preparacion", "cancelado"],
  preparacion: ["listo", "despachado", "cancelado"],
  listo: ["entregado"],
  despachado: ["entregado"],
  entregado: [],
  cancelado: [],
};

const RESERVAN: EstadoPedido[] = ["confirmado", "preparacion"];

type FilaPedido = typeof orders.$inferSelect;

function aPedido(o: FilaPedido, items: (typeof orderItems.$inferSelect)[], eventos: (typeof orderEvents.$inferSelect)[]): Pedido {
  return {
    id: o.id,
    numero: o.numero,
    empresa: o.businessId,
    fecha: o.creado.toISOString(),
    estado: o.estado,
    historial: eventos.map((e) => ({ estado: e.estado, fecha: e.creado.toISOString() })),
    items: items.map((i) => ({
      id: i.id,
      productoId: i.productId,
      varianteId: i.variantId,
      presentacionId: i.presentationId,
      nombre: i.nombre,
      detalle: i.detalle,
      sku: i.sku,
      cantidad: i.cantidad,
      unidadesBase: i.unidadesBase,
      precioUnitCent: i.precioUnitCent,
      totalCent: i.totalCent,
      totalBsCent: i.totalBsCent,
    })),
    moneda: o.moneda,
    tasa: Number(o.tasa),
    fechaTasa: o.fechaTasa.toISOString(),
    totalCent: o.totalCent,
    totalBsCent: o.totalBsCent,
    entrega: o.entrega,
    destino: o.destino,
    nota: o.nota,
    comprador: { nombre: o.compradorNombre, telefono: o.compradorTelefono, documento: o.compradorDocumento },
    compradorCorreo: o.compradorCorreo,
    tokenPublico: o.tokenPublico,
    ajustado: o.ajustado,
    whatsappAbierto: o.whatsappAbierto?.toISOString() ?? null,
  };
}

/** Pedidos con sus líneas e historial. El filtro por empresa o comprador lo ponen las políticas de la base. */
export async function cargarPedidos(tx: Tx, filtro: { ids?: string[]; estados?: EstadoPedido[]; comprador?: string; limite?: number } = {}): Promise<Pedido[]> {
  const condiciones = [];
  if (filtro.ids) condiciones.push(inArray(orders.id, filtro.ids));
  if (filtro.estados) condiciones.push(inArray(orders.estado, filtro.estados));
  if (filtro.comprador) condiciones.push(eq(orders.buyerUserId, filtro.comprador));
  const filas = await tx
    .select()
    .from(orders)
    .where(condiciones.length ? and(...condiciones) : undefined)
    .orderBy(desc(orders.creado))
    .limit(filtro.limite ?? 500);
  if (filas.length === 0) return [];
  const ids = filas.map((o) => o.id);
  const [items, eventos] = await Promise.all([
    tx.select().from(orderItems).where(inArray(orderItems.orderId, ids)),
    tx.select().from(orderEvents).where(inArray(orderEvents.orderId, ids)).orderBy(asc(orderEvents.creado)),
  ]);
  return filas.map((o) =>
    aPedido(
      o,
      items.filter((i) => i.orderId === o.id),
      eventos.filter((e) => e.orderId === o.id),
    ),
  );
}

export async function cargarPedido(tx: Tx, id: string): Promise<Pedido | null> {
  const [p] = await cargarPedidos(tx, { ids: [id] });
  return p ?? null;
}

/**
 * Cambia el estado y mueve el inventario en la misma transacción (plan maestro 4.3):
 * confirmar reserva, listo o despachado descuenta del físico y libera la reserva, cancelar libera.
 * Bloquea el pedido y las variantes con FOR UPDATE para que dos personas no confirmen a la vez el
 * último stock. Devuelve un mensaje para la interfaz si no se puede.
 */
export async function cambiarEstado(tx: Tx, pedidoId: string, destino: EstadoPedido, userId: string | null): Promise<string | null> {
  const [pedido] = await tx.select().from(orders).where(eq(orders.id, pedidoId)).for("update").limit(1);
  if (!pedido) return "El pedido no existe.";
  if (!SIGUIENTES[pedido.estado].includes(destino)) return "Ese cambio de estado no está permitido.";
  if (destino === "listo" && pedido.entrega !== "retiro") return "Solo un pedido con retiro en tienda queda listo para retiro.";
  if (destino === "despachado" && pedido.entrega === "retiro") return "Un pedido con retiro en tienda se marca listo para retiro, no despachado.";

  const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, pedidoId));
  const varIds = [...new Set(items.map((i) => i.variantId).filter((v): v is string => v != null))];
  const variantes = varIds.length
    ? await tx
        .select({ id: productVariants.id, fisico: productVariants.fisico, reservado: productVariants.reservado, bajoPedido: products.bajoPedido })
        .from(productVariants)
        .innerJoin(products, eq(products.id, productVariants.productId))
        .where(inArray(productVariants.id, varIds))
        .for("update", { of: productVariants })
    : [];
  const porVariante = new Map<string, number>();
  for (const i of items) if (i.variantId) porVariante.set(i.variantId, (porVariante.get(i.variantId) ?? 0) + i.unidadesBase);
  const nombre = (vid: string) => items.find((i) => i.variantId === vid)?.nombre ?? "un producto";
  const base = { businessId: pedido.businessId, orderId: pedidoId, userId };

  if (destino === "confirmado") {
    const faltan = variantes.filter((v) => !v.bajoPedido && v.fisico - v.reservado < (porVariante.get(v.id) ?? 0));
    if (faltan.length) {
      return `No alcanza el disponible para: ${faltan.map((v) => `${nombre(v.id)} (pides ${porVariante.get(v.id)}, hay ${Math.max(0, v.fisico - v.reservado)})`).join("; ")}. Ajusta las cantidades o registra una entrada en Inventario.`;
    }
    for (const [vid, u] of porVariante) {
      await tx.update(productVariants).set({ reservado: sql`${productVariants.reservado} + ${u}` }).where(eq(productVariants.id, vid));
      await tx.insert(stockMovements).values({ ...base, variantId: vid, tipo: "reserva", cantidad: u, motivo: "Pedido confirmado" });
    }
  }

  if (destino === "listo" || destino === "despachado") {
    const faltan = variantes.filter((v) => v.fisico < (porVariante.get(v.id) ?? 0));
    if (faltan.length) return `Falta mercancía física de: ${faltan.map((v) => nombre(v.id)).join(", ")}. Registra la entrada en Inventario antes de despachar.`;
    for (const [vid, u] of porVariante) {
      await tx
        .update(productVariants)
        .set({ fisico: sql`${productVariants.fisico} - ${u}`, reservado: sql`greatest(${productVariants.reservado} - ${u}, 0)` })
        .where(eq(productVariants.id, vid));
      await tx.insert(stockMovements).values([
        { ...base, variantId: vid, tipo: "salida", cantidad: -u, motivo: destino === "listo" ? "Pedido listo para retiro" : "Despacho de pedido" },
        { ...base, variantId: vid, tipo: "liberacion", cantidad: -u, motivo: "Reserva cumplida" },
      ]);
    }
  }

  if (destino === "cancelado" && RESERVAN.includes(pedido.estado)) {
    for (const [vid, u] of porVariante) {
      await tx.update(productVariants).set({ reservado: sql`greatest(${productVariants.reservado} - ${u}, 0)` }).where(eq(productVariants.id, vid));
      await tx.insert(stockMovements).values({ ...base, variantId: vid, tipo: "liberacion", cantidad: -u, motivo: "Pedido cancelado" });
    }
  }

  await tx.update(orders).set({ estado: destino }).where(eq(orders.id, pedidoId));
  await tx.insert(orderEvents).values({ businessId: pedido.businessId, orderId: pedidoId, estado: destino, userId });
  return null;
}

/** Ajusta las unidades de una línea antes de confirmar. 0 quita la línea. El precio unitario se mantiene. */
export async function ajustarLinea(tx: Tx, pedidoId: string, itemId: string, unidadesBase: number): Promise<string | null> {
  const [pedido] = await tx.select().from(orders).where(eq(orders.id, pedidoId)).for("update").limit(1);
  if (!pedido) return "El pedido no existe.";
  if (pedido.estado !== "pendiente") return "Solo se ajustan pedidos pendientes.";
  const [item] = await tx.select().from(orderItems).where(and(eq(orderItems.id, itemId), eq(orderItems.orderId, pedidoId))).limit(1);
  if (!item) return "La línea no existe.";
  const factor = item.unidadesBase / item.cantidad;
  if (!Number.isInteger(unidadesBase) || unidadesBase < 0 || unidadesBase % factor !== 0) {
    return factor > 1 ? `Escribe un múltiplo de ${factor} (se vende en presentaciones de ${factor}).` : "Escribe un número entero. 0 quita el producto.";
  }
  if (unidadesBase === 0) {
    const quedan = await tx.select({ id: orderItems.id }).from(orderItems).where(eq(orderItems.orderId, pedidoId));
    if (quedan.length === 1) return "Es la única línea del pedido: cancela el pedido en lugar de dejarlo vacío.";
    await tx.delete(orderItems).where(eq(orderItems.id, itemId));
  } else {
    const totalCent = item.precioUnitCent * unidadesBase;
    await tx
      .update(orderItems)
      .set({ cantidad: unidadesBase / factor, unidadesBase, totalCent, totalBsCent: Math.round(totalCent * Number(pedido.tasa)) })
      .where(eq(orderItems.id, itemId));
  }
  const [t] = await tx
    .select({ c: sql<number>`coalesce(sum(${orderItems.totalCent}), 0)::bigint`, b: sql<number>`coalesce(sum(${orderItems.totalBsCent}), 0)::bigint` })
    .from(orderItems)
    .where(eq(orderItems.orderId, pedidoId));
  await tx
    .update(orders)
    .set({ totalCent: Number(t!.c), totalBsCent: Number(t!.b), ajustado: true })
    .where(eq(orders.id, pedidoId));
  return null;
}

/** Cancela los pendientes que pasaron el plazo de la empresa. Devuelve cuántos. */
export async function cancelarVencidos(tx: Tx, businessId: string, dias: number): Promise<number> {
  const limite = new Date(Date.now() - dias * 86_400_000);
  const viejos = await tx
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.businessId, businessId), eq(orders.estado, "pendiente"), lt(orders.creado, limite)));
  for (const o of viejos) await cambiarEstado(tx, o.id, "cancelado", null);
  return viejos.length;
}

export interface DatosPedido {
  lineas: { productoId: string; varianteId?: string | undefined; presentacionId: string; cantidad: number }[];
  entrega: Pedido["entrega"];
  destino: string;
  nota: string;
  comprador: { nombre: string; telefono: string; documento: string; correo: string; userId: string };
}

/**
 * Crea un pedido Pendiente. Corre con el contexto de la empresa que lo recibe. Los precios, escalas,
 * mínimos y la tasa se recalculan aquí: el navegador solo dice qué y cuánto, nunca a qué precio.
 */
export async function crearPedido(
  tx: Tx,
  empresa: Empresa,
  tasas: Tasas,
  datos: DatosPedido,
): Promise<{ ok: true; id: string; numero: number; token: string } | { ok: false; error: string }> {
  if (datos.lineas.length === 0) return { ok: false, error: "El pedido está vacío." };
  if (datos.lineas.length > 100) return { ok: false, error: "Un pedido admite hasta 100 líneas." };
  const metodo = empresa.entregas.find((e) => e.tipo === datos.entrega);
  if (!metodo) return { ok: false, error: "Ese método de entrega no está disponible." };
  if (metodo.pideDireccion && datos.destino.trim().length < 4) return { ok: false, error: "Escribe la dirección o la ciudad de destino." };

  const productos = await productosDe(tx, empresa.id, { soloActivos: true, ids: [...new Set(datos.lineas.map((l) => l.productoId))] });
  const calculadas = [];
  for (const l of datos.lineas) {
    const p = productos.find((x) => x.id === l.productoId);
    if (!p) return { ok: false, error: "Un producto del pedido ya no está disponible. Revisa tu pedido." };
    if (!Number.isInteger(l.cantidad) || l.cantidad < 1) return { ok: false, error: `Cantidad inválida para ${p.nombre}.` };
    if (p.variantes && !p.variantes.some((v) => v.id === l.varianteId)) return { ok: false, error: `Elige ${p.atributo?.toLowerCase() ?? "una opción"} de ${p.nombre}.` };
    if (!p.presentaciones.some((x) => x.id === l.presentacionId)) return { ok: false, error: `La presentación de ${p.nombre} cambió. Revisa tu pedido.` };
    const err = validarCantidad(p, presentacion(p, l.presentacionId), l.cantidad, l.varianteId);
    if (err) return { ok: false, error: `${p.nombre}: ${err}` };
    const c = calcularLinea(l, empresa, tasas, productos);
    if (!c) return { ok: false, error: "No se pudo calcular el pedido." };
    calculadas.push({ c, varianteId: varianteDeLinea(p, l.varianteId) });
  }
  const totalCent = calculadas.reduce((s, x) => s + x.c.totalCent, 0);
  const totalBsCent = calculadas.reduce((s, x) => s + x.c.totalBsCent, 0);
  const minimoBs = aBs(empresa.pedidoMinimoCent, empresa.monedaBase, tasas) ?? 0;
  if (totalBsCent < minimoBs) return { ok: false, error: "El pedido no llega al mínimo de la empresa." };
  const tasa = empresa.monedaBase === "USD" ? tasas.bcv : empresa.monedaBase === "USDT" ? tasas.usdt : empresa.monedaBase === "EUR" ? (tasas.eur ?? tasas.bcv) : 1;

  // Bloquea la fila de la empresa para numerar sin choques entre pedidos simultáneos
  await tx.select({ id: businesses.id }).from(businesses).where(eq(businesses.id, empresa.id)).for("update");
  const [u] = await tx.select({ n: sql<number>`coalesce(max(${orders.numero}), 0)` }).from(orders).where(eq(orders.businessId, empresa.id));
  const numero = Number(u?.n ?? 0) + 1;
  const token = randomBytes(18).toString("base64url");

  const [pedido] = await tx
    .insert(orders)
    .values({
      businessId: empresa.id,
      numero,
      buyerUserId: datos.comprador.userId,
      compradorNombre: datos.comprador.nombre.trim(),
      compradorTelefono: datos.comprador.telefono.trim(),
      compradorDocumento: datos.comprador.documento.trim(),
      compradorCorreo: datos.comprador.correo,
      entrega: datos.entrega,
      destino: metodo.pideDireccion ? datos.destino.trim() : "",
      nota: datos.nota.trim().slice(0, 500),
      moneda: empresa.monedaBase,
      tasa: String(tasa),
      fechaTasa: new Date(tasas.fecha),
      totalCent,
      totalBsCent,
      tokenPublico: token,
    })
    .returning({ id: orders.id });
  await tx.insert(orderItems).values(
    calculadas.map(({ c, varianteId }) => {
      const it = aItem(c);
      return {
        businessId: empresa.id,
        orderId: pedido!.id,
        productId: c.producto.id,
        variantId: varianteId ?? null,
        presentationId: c.linea.presentacionId,
        nombre: it.nombre,
        detalle: it.detalle,
        sku: it.sku,
        cantidad: it.cantidad,
        unidadesBase: it.unidadesBase,
        precioUnitCent: it.precioUnitCent,
        totalCent: it.totalCent,
        totalBsCent: it.totalBsCent,
      };
    }),
  );
  await tx.insert(orderEvents).values({ businessId: empresa.id, orderId: pedido!.id, estado: "pendiente", userId: datos.comprador.userId });
  return { ok: true, id: pedido!.id, numero, token };
}
