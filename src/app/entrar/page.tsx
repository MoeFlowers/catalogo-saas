import type { Metadata } from "next";
import { EntrarComprador } from "@/componentes/cuentas/EntrarComprador";
import { googleActivo } from "@/lib/env";

export const metadata: Metadata = { title: "Entrar" };

export default async function Entrar({ searchParams }: { searchParams: Promise<{ volver?: string }> }) {
  const { volver } = await searchParams;
  // Solo rutas internas: un "volver" externo no debe sacar al comprador del sitio
  const destino = volver?.startsWith("/") && !volver.startsWith("//") ? volver : "/cuenta";
  return <EntrarComprador volver={destino} google={googleActivo} />;
}
