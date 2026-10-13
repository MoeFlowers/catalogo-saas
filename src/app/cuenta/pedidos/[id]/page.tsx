import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { AbrirWhatsapp } from "@/componentes/catalogo/AbrirWhatsapp";
import { RepetirPedido } from "@/componentes/cuenta/Repetir";
import { VistaPedido } from "@/componentes/cuenta/VistaPedido";
import { marcaSegura } from "@/lib/color";
import { env } from "@/lib/env";
import { mensajeWhatsApp } from "@/dominio/pedido";
import type { Empresa } from "@/dominio/tipos";
import { empresasDePedidos, pedidoDelComprador } from "@/modulos/compras/consultas";
import { requerirUsuario } from "@/modulos/cuentas/sesion";

export const metadata: Metadata = { title: "Pedido" };

export default async function Detalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await requerirUsuario(`/cuenta/pedidos/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  // La política "comprador" de la base no entrega pedidos de otras personas
  const pedido = await pedidoDelComprador(s.user.id, id);
  if (!pedido) notFound();
  const empresa = (await empresasDePedidos([pedido.empresa])).get(pedido.empresa)!;
  const { marca, texto } = marcaSegura(empresa.color);
  const lineas = pedido.items
    .filter((i) => i.productoId && i.presentacionId)
    .map((i) => ({ productoId: i.productoId!, varianteId: i.varianteId ?? undefined, presentacionId: i.presentacionId!, cantidad: i.cantidad }));
  // El mensaje solo usa el nombre de la empresa
  const mensaje = mensajeWhatsApp(pedido, { nombre: empresa.nombre } as Empresa, `${env.APP_URL}/p/${pedido.tokenPublico}`);

  return (
    <div style={{ "--marca": marca, "--marca-texto": texto } as CSSProperties}>
      <Link href="/cuenta" className="-ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-sm font-semibold hover:bg-hundido">
        <ChevronLeft size={18} aria-hidden />
        Mis pedidos
      </Link>
      <VistaPedido
        pedido={pedido}
        empresa={empresa.nombre}
        acciones={
          <>
            <RepetirPedido slug={empresa.slug} lineas={lineas} />
            {pedido.estado === "pendiente" && (
              <AbrirWhatsapp
                pedidoId={pedido.id}
                enlace={`https://wa.me/${empresa.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(mensaje)}`}
                texto="Enviar de nuevo por WhatsApp"
                variante="secundario"
              />
            )}
          </>
        }
      />
    </div>
  );
}
