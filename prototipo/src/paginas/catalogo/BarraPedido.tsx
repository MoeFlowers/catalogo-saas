import { Link } from "react-router";
import type { Empresa } from "../../datos/tipos";
import { useCarrito } from "../../estado/carrito";
import { useDatos } from "../../estado/datos";
import { useTasas } from "../../estado/tasas";
import { formatear } from "../../lib/dinero";
import { calcularLinea } from "../../lib/pedido";

/** Barra fija con el resumen del pedido abierto. Solo aparece cuando hay productos. */
export function BarraPedido({ empresa }: { empresa: Empresa }) {
  const lineas = useCarrito((s) => s.porEmpresa[empresa.slug]) ?? [];
  const tasas = useTasas((s) => s.tasas);
  const productos = useDatos((s) => s.productos);
  if (lineas.length === 0) return null;

  const totalBs = tasas
    ? lineas.reduce((s, l) => s + (calcularLinea(l, empresa, tasas, productos)?.totalBsCent ?? 0), 0)
    : null;

  return (
    <div className="sticky bottom-0 z-10 border-t border-linea bg-superficie/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <p className="min-w-0 text-sm" aria-live="polite">
          <span className="font-semibold">
            {lineas.length} {lineas.length === 1 ? "producto" : "productos"}
          </span>
          {totalBs != null && <span className="cifras block text-tenue">{formatear(totalBs, "VES")}</span>}
        </p>
        <Link
          to={`/c/${empresa.slug}/pedido`}
          className="ml-auto inline-flex min-h-11 items-center rounded-control bg-marca px-5 font-semibold text-marca-texto hover:brightness-110"
        >
          Ver pedido
        </Link>
      </div>
    </div>
  );
}
