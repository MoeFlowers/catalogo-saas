import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AbrirWhatsapp } from "@/componentes/catalogo/AbrirWhatsapp";
import { Copiar } from "@/componentes/comun/Copiar";
import { conContexto } from "@/lib/db";
import { env } from "@/lib/env";
import { mensajeWhatsApp, numeroPedido } from "@/dominio/pedido";
import { catalogoPublico } from "@/modulos/compras/servicio";
import { sesionActual } from "@/modulos/cuentas/sesion";
import { cargarPedido } from "@/modulos/pedidos/servicio";
import { BotonEnlace } from "@/ui/Boton";

export const metadata: Metadata = { title: "Pedido guardado" };

export default async function Enviado({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const s = await sesionActual();
  if (!s) redirect(`/entrar?volver=/c/${slug}/pedido/enviado/${id}`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [c, pedido] = await Promise.all([catalogoPublico(slug), conContexto({ rol: "comprador", userId: s.user.id }, (tx) => cargarPedido(tx, id))]);
  // El pedido solo lo ve quien lo hizo: la política "comprador" devuelve nada si es de otra persona
  if (c.estado !== "ok" || !pedido || pedido.empresa !== c.empresa.id) notFound();
  const empresa = c.empresa;
  const mensaje = mensajeWhatsApp(pedido, empresa, `${env.APP_URL}/p/${pedido.tokenPublico}`);
  const enlaceWa = `https://wa.me/${empresa.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(mensaje)}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <p className="cifras text-sm font-semibold text-tenue">Pedido {numeroPedido(pedido.numero)}</p>
      <h1 className="mt-1 text-2xl font-bold">Falta un paso: envíalo por WhatsApp</h1>
      <p className="mt-2 text-tenue">Tu pedido quedó guardado en tu cuenta. Abre WhatsApp y toca Enviar para que {empresa.nombre} lo reciba y te confirme.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <AbrirWhatsapp pedidoId={pedido.id} enlace={enlaceWa} />
        <Copiar texto={mensaje} etiqueta="Copiar mensaje" hecho="Mensaje copiado" />
      </div>
      <section aria-labelledby="titulo-mensaje" className="mt-8">
        <h2 id="titulo-mensaje" className="text-sm font-semibold">
          Mensaje que se envía
        </h2>
        <pre className="mt-2 whitespace-pre-wrap break-words rounded-control border border-linea bg-superficie p-4 font-sans text-sm leading-relaxed">{mensaje}</pre>
      </section>
      <div className="mt-8 flex flex-col gap-3 border-t border-linea pt-6 sm:flex-row">
        <BotonEnlace href={`/cuenta/pedidos/${pedido.id}`}>Ver el pedido en mi cuenta</BotonEnlace>
        <BotonEnlace href={`/c/${empresa.slug}`} variante="fantasma">
          Volver al catálogo
        </BotonEnlace>
      </div>
    </div>
  );
}
