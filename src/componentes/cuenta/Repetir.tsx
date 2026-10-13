"use client";

import { useRouter } from "next/navigation";
import { useCarrito } from "@/componentes/catalogo/carrito";
import type { LineaPedido } from "@/dominio/tipos";
import { Boton } from "@/ui/Boton";

/** Carga las líneas del pedido en el pedido abierto de esa empresa; los precios se recalculan con la tasa de hoy */
export function RepetirPedido({ slug, lineas }: { slug: string; lineas: LineaPedido[] }) {
  const router = useRouter();
  const reemplazar = useCarrito((s) => s.reemplazar);
  return (
    <Boton
      variante="marca"
      disabled={lineas.length === 0}
      onClick={() => {
        reemplazar(slug, lineas);
        router.push(`/c/${slug}/pedido`);
      }}
    >
      Repetir pedido con precios de hoy
    </Boton>
  );
}
