import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { AccesosComprador } from "@/componentes/catalogo/Cabecera";
import { MarcaEmpresa } from "@/componentes/catalogo/piezas";
import { marcaSegura } from "@/lib/color";
import { catalogoPublico } from "@/modulos/compras/servicio";
import { sesionActual } from "@/modulos/cuentas/sesion";

export const dynamic = "force-dynamic";

export default async function CatalogoLayout({ children, params }: { children: ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [c, sesion] = await Promise.all([catalogoPublico(slug), sesionActual()]);
  if (c.estado === "no-existe") notFound();
  if (c.estado === "no-disponible") {
    return (
      <main id="contenido" tabIndex={-1} className="mx-auto max-w-lg px-4 py-20 text-center outline-none">
        <h1 className="text-2xl font-bold">{c.empresa.activa ? `${c.empresa.nombre} pausó su catálogo` : "Este catálogo no está disponible"}</h1>
        <p className="mt-2 text-tenue">Por ahora no recibe pedidos por aquí. Vuelve más tarde o contacta a la empresa.</p>
        {sesion && (
          <Link href="/cuenta" className="mt-6 inline-flex min-h-11 items-center rounded-control border border-control px-4 font-semibold hover:bg-hundido">
            Ver mis pedidos
          </Link>
        )}
      </main>
    );
  }

  const { empresa } = c;
  const { marca, texto } = marcaSegura(empresa.color);
  return (
    <div data-catalogo style={{ "--marca": marca, "--marca-texto": texto } as CSSProperties} className="flex min-h-dvh flex-col">
      <header className="border-b border-linea bg-superficie">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link href={`/c/${empresa.slug}`} className="flex min-w-0 items-center gap-3 rounded-control">
            <MarcaEmpresa nombre={empresa.nombre} />
            <span className="min-w-0">
              <span className="block truncate font-bold leading-tight">{empresa.nombre}</span>
              <span className="block truncate text-sm text-tenue">{empresa.ciudad}</span>
            </span>
          </Link>
          <AccesosComprador slug={empresa.slug} conSesion={Boolean(sesion)} />
        </div>
      </header>
      <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <footer className="border-t border-linea bg-superficie">
        <div className="mx-auto max-w-6xl space-y-1 px-4 py-6 text-sm text-tenue">
          <p className="font-semibold text-tinta">{empresa.razonSocial}</p>
          <p>RIF {empresa.rif}</p>
          {empresa.horario && <p>{empresa.horario}</p>}
          <p className="pt-2">
            Catálogo publicado con{" "}
            <Link href="/" className="font-semibold text-tinta underline underline-offset-2">
              Vitrina
            </Link>
          </p>
          <p>
            <Link href={`/c/${empresa.slug}/denunciar`} className="inline-flex min-h-11 items-center underline underline-offset-2">
              Reportar este catálogo
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
