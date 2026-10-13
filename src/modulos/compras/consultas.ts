import "server-only";
import { inArray } from "drizzle-orm";
import { conContexto, db } from "@/lib/db";
import { businesses } from "@/lib/db/esquema";
import { cargarPedido, cargarPedidos } from "../pedidos/servicio";

/** Nombre y enlace de las empresas de una lista de pedidos (datos públicos de la empresa) */
export async function empresasDePedidos(ids: string[]) {
  if (ids.length === 0) return new Map<string, { nombre: string; slug: string; whatsapp: string; color: string }>();
  const filas = await db
    .select({ id: businesses.id, nombre: businesses.nombre, slug: businesses.slug, whatsapp: businesses.whatsapp, color: businesses.color })
    .from(businesses)
    .where(inArray(businesses.id, [...new Set(ids)]));
  return new Map(filas.map((f) => [f.id, f]));
}

/** Pedidos de un comprador: la política "comprador" de la base solo entrega los suyos */
export function pedidosDelComprador(userId: string) {
  return conContexto({ rol: "comprador", userId }, (tx) => cargarPedidos(tx, { comprador: userId }));
}

export function pedidoDelComprador(userId: string, id: string) {
  return conContexto({ rol: "comprador", userId }, (tx) => cargarPedido(tx, id));
}
