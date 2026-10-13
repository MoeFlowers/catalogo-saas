import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Estado } from "@/componentes/panel/comun";
import { formatear, formatearFecha } from "@/dominio/dinero";
import { numeroPedido } from "@/dominio/pedido";
import { empresasDePedidos, pedidosDelComprador } from "@/modulos/compras/consultas";
import { requerirUsuario } from "@/modulos/cuentas/sesion";
import { EstadoVacio } from "@/ui/piezas";

export const metadata: Metadata = { title: "Mis pedidos" };

export default async function MisPedidos({ searchParams }: { searchParams: Promise<{ empresa?: string }> }) {
  const s = await requerirUsuario("/cuenta");
  const { empresa } = await searchParams;
  const todos = await pedidosDelComprador(s.user.id);
  const empresas = await empresasDePedidos(todos.map((p) => p.empresa));
  const visibles = todos.filter((p) => !empresa || p.empresa === empresa);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold">Mis pedidos</h1>
        {empresas.size > 1 && (
          <form className="flex items-end gap-2 text-sm">
            <label className="block">
              <span className="block font-semibold">Empresa</span>
              <select name="empresa" defaultValue={empresa ?? ""} className="mt-1 min-h-11 rounded-control border border-control bg-superficie px-2">
                <option value="">Todas</option>
                {[...empresas.entries()].map(([id, e]) => (
                  <option key={id} value={id}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="min-h-11 rounded-control border border-control bg-superficie px-3 font-semibold hover:bg-hundido">
              Filtrar
            </button>
          </form>
        )}
      </div>
      {visibles.length === 0 ? (
        <div className="mt-6">
          <EstadoVacio titulo="Todavía no tienes pedidos">Cuando envíes un pedido desde un catálogo de Vitrina, aparece aquí con su estado.</EstadoVacio>
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-linea border-y border-linea">
          {visibles.map((p) => (
            <li key={p.id}>
              <Link href={`/cuenta/pedidos/${p.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 rounded-control py-4 hover:bg-hundido sm:px-2">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{empresas.get(p.empresa)?.nombre}</span>
                  <span className="cifras block text-sm text-tenue">
                    {numeroPedido(p.numero)}, {formatearFecha(p.fecha)}, {p.items.length} {p.items.length === 1 ? "producto" : "productos"}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-right">
                    <span className="cifras block font-bold">{formatear(p.totalBsCent, "VES")}</span>
                    <Estado estado={p.estado} />
                  </span>
                  <ChevronRight size={18} className="text-tenue" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
