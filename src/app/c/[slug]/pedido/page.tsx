import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MiPedido } from "@/componentes/catalogo/MiPedido";
import { perfilComprador } from "@/modulos/compras/acciones";
import { catalogoPublico } from "@/modulos/compras/servicio";

export const metadata: Metadata = { title: "Tu pedido" };

export default async function Pedido({ params }: { params: Promise<{ slug: string }> }) {
  const [c, perfil] = await Promise.all([catalogoPublico((await params).slug), perfilComprador()]);
  if (c.estado !== "ok") notFound();
  return <MiPedido empresa={c.empresa} comprador={perfil} />;
}
