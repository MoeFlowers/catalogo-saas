import { ShoppingBag, UserRound } from "lucide-react";
import type { CSSProperties } from "react";
import { Link, Outlet, useOutletContext, useParams } from "react-router";
import { empresaPorSlug } from "../../datos/empresas";
import type { Empresa } from "../../datos/tipos";
import { useCarrito } from "../../estado/carrito";
import { useSesion } from "../../estado/sesion";
import { marcaSegura } from "../../lib/color";
import { MarcaEmpresa } from "../../ui/piezas";
import { NoEncontrado } from "../NoEncontrado";

export function useEmpresa(): Empresa {
  return useOutletContext<Empresa>();
}

export function CatalogoLayout() {
  const { slug } = useParams();
  const empresa = empresaPorSlug(slug);
  const lineas = useCarrito((s) => (slug ? s.porEmpresa[slug] : undefined)) ?? [];
  const comprador = useSesion((s) => s.comprador);

  if (!empresa) return <NoEncontrado />;

  const { marca, texto } = marcaSegura(empresa.color);
  const estilo = { "--marca": marca, "--marca-texto": texto } as CSSProperties;

  return (
    <div data-catalogo style={estilo} className="flex min-h-dvh flex-col">
      <header className="border-b border-linea bg-superficie">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to={`/c/${empresa.slug}`} className="flex min-w-0 items-center gap-3 rounded-control">
            <MarcaEmpresa nombre={empresa.nombre} />
            <span className="min-w-0">
              <span className="block truncate font-bold leading-tight">{empresa.nombre}</span>
              <span className="block truncate text-sm text-tenue">{empresa.ciudad}</span>
            </span>
          </Link>
          <nav aria-label="Comprador" className="ml-auto flex shrink-0 items-center gap-1">
            <Link
              to={comprador ? "/cuenta" : `/entrar?volver=/c/${empresa.slug}`}
              className="flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-semibold hover:bg-hundido"
            >
              <UserRound size={18} aria-hidden />
              <span className="hidden sm:inline">{comprador ? "Mi cuenta" : "Entrar"}</span>
              <span className="sr-only sm:hidden">{comprador ? "Mi cuenta" : "Entrar"}</span>
            </Link>
            <Link
              to={`/c/${empresa.slug}/pedido`}
              className="relative flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-semibold hover:bg-hundido"
            >
              <ShoppingBag size={18} aria-hidden />
              <span className="hidden sm:inline">Pedido</span>
              <span className="sr-only sm:hidden">Pedido</span>
              {lineas.length > 0 && (
                <span className="cifras rounded-full bg-marca px-1.5 text-xs font-bold text-marca-texto">
                  {lineas.length}
                  <span className="sr-only"> productos</span>
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
        <Outlet context={empresa} />
      </main>

      <footer className="border-t border-linea bg-superficie">
        <div className="mx-auto max-w-6xl space-y-1 px-4 py-6 text-sm text-tenue">
          <p className="font-semibold text-tinta">{empresa.razonSocial}</p>
          <p>RIF {empresa.rif}</p>
          <p>{empresa.horario}</p>
          <p className="pt-2">
            Catálogo publicado con{" "}
            <Link to="/" className="font-semibold text-tinta underline underline-offset-2">
              Vitrina
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
