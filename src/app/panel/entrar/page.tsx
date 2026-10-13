import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EntrarEmpresa } from "@/componentes/cuentas/EntrarEmpresa";
import { empresasDe, sesionActual } from "@/modulos/cuentas/sesion";

export const metadata: Metadata = { title: "Entrar al panel" };

export default async function EntrarPanel() {
  const s = await sesionActual();
  if (s?.user.twoFactorEnabled && (await empresasDe(s.user.id)).length > 0) redirect("/panel");
  return <EntrarEmpresa titulo="Panel de tu empresa" descripcion="Entra con el correo y la contraseña de tu cuenta." destino="/panel" />;
}
