import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Asistente } from "@/componentes/registro/Asistente";
import { CabeceraSitio } from "@/componentes/sitio";
import { env } from "@/lib/env";
import { empresasDe, sesionActual } from "@/modulos/cuentas/sesion";

export const metadata: Metadata = { title: "Registrar mi empresa" };

// Retoma el registro donde quedó: correo sin verificar, doble factor sin activar o empresa sin crear
export default async function Registro() {
  const s = await sesionActual();
  let paso = 0;
  if (s) {
    if ((await empresasDe(s.user.id)).length > 0) redirect("/panel");
    paso = !s.user.emailVerified ? 1 : !s.user.twoFactorEnabled ? 2 : 3;
  }
  return (
    <>
      <CabeceraSitio />
      <Asistente pasoInicial={paso} correoInicial={s?.user.email ?? ""} dominio={new URL(env.APP_URL).host} />
    </>
  );
}
