import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetallePedido } from "@/componentes/panel/DetallePedido";
import { conContexto } from "@/lib/db";
import { numeroPedido } from "@/dominio/pedido";
import { productosDe } from "@/modulos/catalogo/consultas";
import { contextoPanel } from "@/modulos/cuentas/panel";
import { cargarPedido } from "@/modulos/pedidos/servicio";

const UUID = /^[0-9a-f-]{36}$/i;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!UUID.test(id)) return { title: "Pedido" };
  const { ctx } = await contextoPanel();
  const p = await conContexto(ctx, (tx) => cargarPedido(tx, id));
  return { title: p ? `Pedido ${numeroPedido(p.numero)}` : "Pedido" };
}

export default async function Pedido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { ctx, empresa, puede } = await contextoPanel();
  const datos = await conContexto(ctx, async (tx) => {
    const pedido = await cargarPedido(tx, id);
    if (!pedido) return null;
    const ids = pedido.items.map((i) => i.productoId).filter((x): x is string => x != null);
    return { pedido, productos: await productosDe(tx, empresa.id, { ids }) };
  });
  // Las políticas de la base devuelven null si el pedido es de otra empresa
  if (!datos) notFound();
  return <DetallePedido pedido={datos.pedido} empresa={empresa} productos={datos.productos} permisos={{ confirmar: puede("confirmar"), despachar: puede("despachar") }} />;
}
