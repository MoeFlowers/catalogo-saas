import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FichaProducto } from "@/componentes/catalogo/FichaProducto";
import { catalogoPublico } from "@/modulos/compras/servicio";
import { tasasActuales } from "@/modulos/monedas/tasas";

type P = { params: Promise<{ slug: string; id: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug, id } = await params;
  const c = await catalogoPublico(slug);
  const p = c.estado === "ok" ? c.productos.find((x) => x.id === id) : undefined;
  return p && c.estado === "ok" ? { title: `${p.nombre} | ${c.empresa.nombre}`, description: p.descripcion } : { title: "Producto" };
}

export default async function Producto({ params }: P) {
  const { slug, id } = await params;
  const [c, tasas] = await Promise.all([catalogoPublico(slug), tasasActuales()]);
  if (c.estado !== "ok") notFound();
  const producto = c.productos.find((p) => p.id === id);
  if (!producto) notFound();
  return <FichaProducto key={producto.id} producto={producto} empresa={c.empresa} productos={c.productos} tasas={tasas} />;
}
