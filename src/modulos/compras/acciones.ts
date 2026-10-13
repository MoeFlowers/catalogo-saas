"use server";

import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { conContexto, db } from "@/lib/db";
import { blockedBuyers, buyerAddresses, buyerProfiles, orders } from "@/lib/db/esquema";
import { fallo, ok, type Resultado } from "@/lib/errores";
import { registro } from "@/lib/registro";
import { suscripcionVencida } from "@/dominio/permisos";
import type { Producto, Tasas } from "@/dominio/tipos";
import { productosDe, empresaPorSlug } from "../catalogo/consultas";
import { sesionActual } from "../cuentas/sesion";
import { tasasActuales } from "../monedas/tasas";
import { crearPedido } from "../pedidos/servicio";

/** Productos del carrito y la tasa del momento, leídos con el rol público */
export async function datosCarrito(slug: string, ids: string[]): Promise<{ productos: Producto[]; tasas: Tasas | null }> {
  const limpios = ids.filter((i) => /^[0-9a-f-]{36}$/i.test(i)).slice(0, 100);
  const productos = await conContexto({ rol: "publico" }, async (tx) => {
    const e = await empresaPorSlug(tx, slug);
    if (!e || e.estado !== "activa" || !e.publicado) return [];
    return productosDe(tx, e.id, { soloActivos: true, ids: limpios });
  });
  return { productos, tasas: await tasasActuales() };
}

const esquemaPedido = z.object({
  lineas: z
    .array(
      z.object({
        productoId: z.uuid(),
        varianteId: z.uuid().optional(),
        presentacionId: z.uuid(),
        cantidad: z.number().int().min(1).max(100_000),
      }),
    )
    .min(1, "El pedido está vacío.")
    .max(100),
  entrega: z.enum(["retiro", "delivery", "encomienda", "coordinar"]),
  destino: z.string().max(300).default(""),
  nota: z.string().max(500).default(""),
  nombre: z.string().trim().min(3, "Escribe tu nombre o el de tu empresa.").max(120),
  telefono: z
    .string()
    .trim()
    .refine((t) => t.replace(/\D/g, "").length >= 10, "Escribe un teléfono con código de área, por ejemplo 0414 1234567."),
  documento: z.string().trim().max(20).default(""),
});

export type EntradaPedido = z.input<typeof esquemaPedido>;

/** Envía el pedido. Exige cuenta con correo verificado; la empresa debe estar activa, publicada y al día. */
export async function enviarPedido(slug: string, entrada: EntradaPedido): Promise<Resultado<{ id: string; token: string; numero: number }>> {
  const s = await sesionActual();
  if (!s) return fallo("Entra a tu cuenta para enviar el pedido.");
  if (!s.user.emailVerified) return fallo("Verifica tu correo para enviar pedidos.");
  const r = esquemaPedido.safeParse(entrada);
  if (!r.success) return fallo(r.error.issues[0]?.message ?? "Revisa el pedido.");
  const d = r.data;

  const [bloqueo] = await db.select({ id: blockedBuyers.userId }).from(blockedBuyers).where(eq(blockedBuyers.userId, s.user.id)).limit(1);
  if (bloqueo) return fallo("Vitrina bloqueó tu cuenta por un reporte de uso indebido. Si crees que es un error, escribe a soporte.");

  const tasas = await tasasActuales();
  if (!tasas) return fallo("No hay tasa del día en este momento. Intenta de nuevo en unos minutos.");

  try {
    const empresa = await conContexto({ rol: "publico" }, (tx) => empresaPorSlug(tx, slug));
    if (!empresa || empresa.estado !== "activa" || !empresa.publicado) return fallo("Este catálogo no está disponible.");
    if (suscripcionVencida(empresa)) return fallo(`${empresa.nombre} no está recibiendo pedidos por Vitrina en este momento.`);

    // El pedido se escribe con el contexto de la empresa que lo recibe: la política de la base lo exige
    const res = await conContexto({ rol: "empresa", businessId: empresa.id, userId: s.user.id }, (tx) =>
      crearPedido(tx, empresa, tasas, {
        lineas: d.lineas,
        entrega: d.entrega,
        destino: d.destino,
        nota: d.nota,
        comprador: { nombre: d.nombre, telefono: d.telefono, documento: d.documento, correo: s.user.email, userId: s.user.id },
      }),
    );
    if (!res.ok) return fallo(res.error);

    // Se guardan teléfono y documento para el próximo pedido
    await db
      .insert(buyerProfiles)
      .values({ userId: s.user.id, telefono: d.telefono, documento: d.documento })
      .onConflictDoUpdate({ target: buyerProfiles.userId, set: { telefono: d.telefono, documento: d.documento } });
    return ok({ id: res.id, token: res.token, numero: res.numero });
  } catch (e) {
    registro.error({ err: e }, "no se pudo crear el pedido");
    return fallo("No se pudo enviar el pedido. Intenta de nuevo.");
  }
}

/** Señal de que el comprador abrió WhatsApp con el pedido (ADR-0005). Solo su propio pedido. */
export async function marcarWhatsappAbierto(pedidoId: string): Promise<void> {
  const s = await sesionActual();
  if (!s || !/^[0-9a-f-]{36}$/i.test(pedidoId)) return;
  await conContexto({ rol: "comprador", userId: s.user.id }, (tx) =>
    tx
      .update(orders)
      .set({ whatsappAbierto: new Date() })
      .where(and(eq(orders.id, pedidoId), eq(orders.buyerUserId, s.user.id))),
  );
}

export async function perfilComprador() {
  const s = await sesionActual();
  if (!s) return null;
  const [perfil] = await db.select().from(buyerProfiles).where(eq(buyerProfiles.userId, s.user.id)).limit(1);
  const direcciones = await db.select().from(buyerAddresses).where(eq(buyerAddresses.userId, s.user.id)).orderBy(desc(buyerAddresses.creado));
  return {
    nombre: s.user.name,
    correo: s.user.email,
    telefono: perfil?.telefono ?? "",
    documento: perfil?.documento ?? "",
    razonSocial: perfil?.razonSocial ?? "",
    direcciones: direcciones.map((d) => ({ id: d.id, nombre: d.nombre, detalle: d.detalle })),
  };
}
