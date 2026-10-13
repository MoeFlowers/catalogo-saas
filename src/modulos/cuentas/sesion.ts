import "server-only";
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { conContexto } from "@/lib/db";
import { businesses, memberships } from "@/lib/db/esquema";
import { env } from "@/lib/env";

/** Cookie con la empresa que la persona eligió en el panel (puede pertenecer a varias) */
export const COOKIE_EMPRESA = "vitrina_empresa";

/** Sesión de la petición actual, una sola consulta por petición */
export const sesionActual = cache(async () => auth.api.getSession({ headers: await headers() }));

export async function requerirUsuario(volver: string) {
  const s = await sesionActual();
  if (!s) redirect(`/entrar?volver=${encodeURIComponent(volver)}`);
  return s;
}

export type Rol = (typeof memberships.$inferSelect)["rol"];
export type Empresa = typeof businesses.$inferSelect;

/** Membresías de un usuario con su empresa. Corre con el contexto del propio usuario (política "propias"). */
export async function empresasDe(userId: string) {
  const filas = await conContexto({ rol: "empresa", userId }, (tx) =>
    tx.select({ rol: memberships.rol, empresa: businesses }).from(memberships).innerJoin(businesses, eq(businesses.id, memberships.businessId)).where(eq(memberships.userId, userId)),
  );
  return filas;
}

/**
 * Exige una persona con doble factor activo y miembro de una empresa. Devuelve la empresa elegida
 * (cookie) o la única que tiene. El business_id sale siempre del servidor, nunca del cliente (ADR-0002).
 */
export const requerirEmpresa = cache(async () => {
  const s = await sesionActual();
  if (!s) redirect("/panel/entrar");
  if (!s.user.twoFactorEnabled) redirect("/panel/doble-factor");
  const lista = await empresasDe(s.user.id);
  if (lista.length === 0) redirect("/registro/empresa");
  const elegida = (await cookies()).get(COOKIE_EMPRESA)?.value;
  const actual = lista.find((m) => m.empresa.id === elegida) ?? lista[0]!;
  return { sesion: s, usuario: s.user, empresa: actual.empresa, rol: actual.rol, otras: lista.length - 1 };
});

export function esAdmin(correo: string): boolean {
  return env.ADMIN_EMAILS.includes(correo.toLowerCase());
}

/** Exige una cuenta del equipo de Vitrina con doble factor activo */
export const requerirAdmin = cache(async () => {
  const s = await sesionActual();
  if (!s) redirect("/admin/entrar");
  if (!esAdmin(s.user.email)) redirect("/admin/entrar?error=sin-permiso");
  if (!s.user.twoFactorEnabled) redirect("/panel/doble-factor?volver=/admin");
  return s;
});
