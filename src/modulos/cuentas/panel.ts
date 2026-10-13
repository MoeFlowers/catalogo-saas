import "server-only";
import { cache } from "react";
import { conContexto, type Contexto, type Tx } from "@/lib/db";
import { ErrorApp } from "@/lib/errores";
import { puede, type Area } from "@/dominio/permisos";
import type { Empresa } from "@/dominio/tipos";
import { empresaPorId } from "../catalogo/consultas";
import { requerirEmpresa } from "./sesion";

/** Empresa del panel ya armada (categorías y entregas incluidas) y el contexto de la base para operar */
export const contextoPanel = cache(async () => {
  const r = await requerirEmpresa();
  const ctx: Contexto = { rol: "empresa", businessId: r.empresa.id, userId: r.usuario.id };
  const empresa = (await conContexto(ctx, (tx) => empresaPorId(tx, r.empresa.id))) as Empresa;
  return { ...r, ctx, empresa, puede: (a: Area) => puede(r.rol, a, empresa) };
});

/** Para acciones de servidor: exige el permiso y corre la operación con el contexto de la empresa */
export async function operarComoEmpresa<T>(area: Area | null, fn: (tx: Tx, c: Awaited<ReturnType<typeof contextoPanel>>) => Promise<T>): Promise<T> {
  const c = await contextoPanel();
  if (area && !c.puede(area)) throw new ErrorApp("prohibido", "Tu acceso no permite hacer esto. Pídeselo al dueño de la empresa.");
  return conContexto(c.ctx, (tx) => fn(tx, c));
}
