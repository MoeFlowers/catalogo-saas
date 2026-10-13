import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Portada } from "@/componentes/catalogo/Portada";
import { catalogoPublico } from "@/modulos/compras/servicio";
import { tasasActuales } from "@/modulos/monedas/tasas";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await catalogoPublico((await params).slug);
  return c.estado === "ok" ? { title: `Catálogo de ${c.empresa.nombre}`, description: c.empresa.descripcion } : { title: "Catálogo" };
}

export default async function Catalogo({ params }: { params: Promise<{ slug: string }> }) {
  const [c, tasas] = await Promise.all([catalogoPublico((await params).slug), tasasActuales()]);
  if (c.estado !== "ok") notFound();
  return (
    <Suspense>
      <Portada empresa={c.empresa} productos={c.productos} tasas={tasas} />
    </Suspense>
  );
}
