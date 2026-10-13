import type { ReactNode } from "react";
import { CabeceraCuenta } from "@/componentes/cuenta/Cabecera";
import { requerirUsuario } from "@/modulos/cuentas/sesion";

export const dynamic = "force-dynamic";

export default async function CuentaLayout({ children }: { children: ReactNode }) {
  const s = await requerirUsuario("/cuenta");
  return (
    <div className="min-h-dvh">
      <CabeceraCuenta correo={s.user.email} />
      <main id="contenido" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-6 outline-none">
        {children}
      </main>
    </div>
  );
}
