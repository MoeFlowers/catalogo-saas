import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ActivarDobleFactor } from "@/componentes/cuentas/ActivarDobleFactor";
import { sesionActual } from "@/modulos/cuentas/sesion";

export const metadata: Metadata = { title: "Activar la verificación en dos pasos" };

export default async function DobleFactor({ searchParams }: { searchParams: Promise<{ volver?: string }> }) {
  const { volver } = await searchParams;
  // Solo rutas internas: un "volver" externo no debe sacar a nadie del sitio
  const destino = volver?.startsWith("/") && !volver.startsWith("//") ? volver : "/panel";
  const s = await sesionActual();
  if (!s) redirect("/panel/entrar");
  if (s.user.twoFactorEnabled) redirect(destino);
  return <ActivarDobleFactor volver={destino} />;
}
