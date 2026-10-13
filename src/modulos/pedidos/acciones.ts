"use server";

import { revalidatePath } from "next/cache";
import { esErrorApp, fallo, ok, type Resultado } from "@/lib/errores";
import { registro } from "@/lib/registro";
import { NOMBRE_ESTADO } from "@/dominio/estados";
import type { EstadoPedido } from "@/dominio/tipos";
import { operarComoEmpresa } from "../cuentas/panel";
import { ajustarLinea, cambiarEstado } from "./servicio";

const ESTADOS = new Set<EstadoPedido>(["confirmado", "preparacion", "listo", "despachado", "entregado", "cancelado"]);

async function ejecutar(fn: () => Promise<string | null>, hecho: string): Promise<Resultado<string>> {
  try {
    const error = await fn();
    if (error) return fallo(error);
    revalidatePath("/panel", "layout");
    return ok(hecho);
  } catch (e) {
    if (esErrorApp(e)) return fallo(e.message);
    registro.error({ err: e }, "acción de pedido falló");
    return fallo("No se pudo guardar el cambio. Intenta de nuevo.");
  }
}

/** Avanza o cancela un pedido. Confirmar y cancelar son del área "confirmar"; el resto, de "despachar". */
export async function cambiarEstadoPedido(pedidoId: string, destino: EstadoPedido): Promise<Resultado<string>> {
  if (!ESTADOS.has(destino)) return fallo("Estado desconocido.");
  const area = destino === "confirmado" || destino === "cancelado" ? "confirmar" : "despachar";
  return ejecutar(() => operarComoEmpresa(area, (tx, c) => cambiarEstado(tx, pedidoId, destino, c.usuario.id)), `Pedido ${NOMBRE_ESTADO[destino].toLowerCase()}.`);
}

export async function ajustarLineaPedido(pedidoId: string, itemId: string, unidadesBase: number): Promise<Resultado<string>> {
  return ejecutar(() => operarComoEmpresa("confirmar", (tx) => ajustarLinea(tx, pedidoId, itemId, unidadesBase)), "Cantidad ajustada. El cliente ve el cambio en su pedido.");
}
