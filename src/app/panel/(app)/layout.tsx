import Link from "next/link";
import type { ReactNode } from "react";
import { and, count, eq } from "drizzle-orm";
import { Armazon } from "@/componentes/panel/Armazon";
import { conContexto } from "@/lib/db";
import { orders } from "@/lib/db/esquema";
import { suscripcionVencida } from "@/dominio/permisos";
import { formatearFecha } from "@/dominio/dinero";
import { contextoPanel } from "@/modulos/cuentas/panel";
import { cancelarVencidos } from "@/modulos/pedidos/servicio";
import { Aviso } from "@/ui/piezas";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const c = await contextoPanel();
  const { empresa } = c;
  const { cancelados, pendientes } = await conContexto(c.ctx, async (tx) => {
    // Los pendientes que pasaron el plazo de la empresa se cancelan al abrir el panel
    const cancelados = await cancelarVencidos(tx, empresa.id, empresa.diasCancelacion);
    const [p] = await tx.select({ n: count() }).from(orders).where(and(eq(orders.businessId, empresa.id), eq(orders.estado, "pendiente")));
    return { cancelados, pendientes: p?.n ?? 0 };
  });

  const avisos = (
    <div className="mb-5 space-y-3 empty:hidden">
      {empresa.estado === "en_revision" && (
        <Aviso titulo="Tu empresa está en revisión">
          Ya puedes cargar productos, categorías y entrega. El catálogo se publica cuando Vitrina apruebe tu solicitud; te avisamos por correo.
        </Aviso>
      )}
      {empresa.estado === "rechazada" && (
        <Aviso tipo="error" titulo="Tu solicitud no fue aprobada">
          Motivo: {empresa.motivoEstado}. Si crees que es un error, responde el correo de Vitrina con los datos que faltan.
        </Aviso>
      )}
      {empresa.estado === "suspendida" && (
        <Aviso tipo="error" titulo="Tu empresa está suspendida">
          Motivo: {empresa.motivoEstado}. El catálogo no se ve y el panel queda en solo lectura hasta que Vitrina lo reactive.
        </Aviso>
      )}
      {empresa.estado === "activa" && suscripcionVencida(empresa) && (
        <Aviso tipo="error" titulo={`Tu suscripción venció el ${formatearFecha(empresa.vence)}`}>
          El catálogo se ve pero no recibe pedidos.{" "}
          <Link href="/panel/suscripcion" className="font-semibold underline underline-offset-2">
            Reporta tu pago
          </Link>{" "}
          para reactivarlo.
        </Aviso>
      )}
      {cancelados > 0 && (
        <Aviso tipo="alerta" titulo={`Se cancelaron ${cancelados} ${cancelados === 1 ? "pedido pendiente" : "pedidos pendientes"}`}>
          Llevaban más de {empresa.diasCancelacion} días sin confirmar. Puedes cambiar ese plazo en Catálogo.
        </Aviso>
      )}
    </div>
  );

  return (
    <Armazon empresa={{ nombre: empresa.nombre, slug: empresa.slug }} usuario={c.usuario.name} rol={c.rol} pendientes={pendientes} avisos={avisos}>
      {children}
    </Armazon>
  );
}
