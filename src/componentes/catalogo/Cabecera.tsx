"use client";

import { ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";
import { useCarrito } from "./carrito";

/** Accesos del comprador en la cabecera del catálogo; el contador sale del pedido guardado en el teléfono */
export function AccesosComprador({ slug, conSesion }: { slug: string; conSesion: boolean }) {
  const lineas = useCarrito((s) => s.porEmpresa[slug]) ?? [];
  return (
    <nav aria-label="Comprador" className="ml-auto flex shrink-0 items-center gap-1">
      <Link href={conSesion ? "/cuenta" : `/entrar?volver=/c/${slug}`} className="flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-semibold hover:bg-hundido">
        <UserRound size={18} aria-hidden />
        <span className="hidden sm:inline">{conSesion ? "Mi cuenta" : "Entrar"}</span>
        <span className="sr-only sm:hidden">{conSesion ? "Mi cuenta" : "Entrar"}</span>
      </Link>
      <Link href={`/c/${slug}/pedido`} className="relative flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-semibold hover:bg-hundido">
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
  );
}
