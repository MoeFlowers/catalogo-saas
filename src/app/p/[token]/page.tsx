import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VistaPedido } from "@/componentes/cuenta/VistaPedido";
import { conContexto } from "@/lib/db";
import { empresasDePedidos } from "@/modulos/compras/consultas";
import { cargarPedidos } from "@/modulos/pedidos/servicio";

// El enlace del mensaje de WhatsApp: con el token se ve ese pedido y nada más (política "enlace").
// No muestra datos personales del comprador.
export const metadata: Metadata = { title: "Pedido", robots: { index: false, follow: false } };

export default async function PedidoPublico({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) notFound();
  const [pedido] = await conContexto({ rol: "publico", token }, (tx) => cargarPedidos(tx, { limite: 1 }));
  if (!pedido) notFound();
  const empresa = (await empresasDePedidos([pedido.empresa])).get(pedido.empresa)!;
  return (
    <main id="contenido" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-8 outline-none">
      <Link href="/" className="text-lg font-bold">
        Vitrina
      </Link>
      <div className="mt-6">
        <VistaPedido pedido={{ ...pedido, comprador: { nombre: "", telefono: "", documento: "" }, compradorCorreo: "" }} empresa={empresa.nombre} />
      </div>
    </main>
  );
}
