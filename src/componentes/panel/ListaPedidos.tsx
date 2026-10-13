"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatear, formatearFecha } from "@/dominio/dinero";
import { NOMBRE_ENTREGA, numeroPedido } from "@/dominio/pedido";
import type { EstadoPedido, Pedido } from "@/dominio/tipos";
import { EstadoVacio } from "@/ui/piezas";
import { Tabla } from "@/ui/Tabla";
import { Encabezado, Estado } from "./comun";

const VISTAS: { id: string; texto: string; estados: EstadoPedido[] }[] = [
  { id: "confirmar", texto: "Por confirmar", estados: ["pendiente"] },
  { id: "curso", texto: "En curso", estados: ["confirmado", "preparacion", "listo", "despachado"] },
  { id: "cerrados", texto: "Cerrados", estados: ["entregado", "cancelado"] },
  { id: "todos", texto: "Todos", estados: [] },
];

export function ListaPedidos({ pedidos }: { pedidos: Pedido[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const ruta = usePathname();
  const vista = VISTAS.find((v) => v.id === params.get("vista")) ?? VISTAS[0]!;
  const q = params.get("q") ?? "";

  const cambiar = (clave: string, valor: string) => {
    const p = new URLSearchParams(params);
    if (valor) p.set(clave, valor);
    else p.delete(clave);
    router.replace(`${ruta}?${p.toString()}`, { scroll: false });
  };

  const cuenta = (v: (typeof VISTAS)[number]) => pedidos.filter((p) => !v.estados.length || v.estados.includes(p.estado)).length;
  const termino = q.trim().toLowerCase().replace("#", "");
  const visibles = pedidos
    .filter((p) => !vista.estados.length || vista.estados.includes(p.estado))
    .filter((p) => !termino || String(p.numero).includes(termino) || p.comprador.nombre.toLowerCase().includes(termino))
    // Por confirmar: el más viejo primero, porque es el que más espera. El resto: el más reciente primero.
    .sort((a, b) => (vista.id === "confirmar" ? a.fecha.localeCompare(b.fecha) : b.fecha.localeCompare(a.fecha)));

  return (
    <>
      <Encabezado titulo="Pedidos">Confirma, prepara y despacha. Cada paso actualiza el inventario.</Encabezado>

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div role="group" aria-label="Filtrar pedidos" className="-mx-4 flex max-w-full gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {VISTAS.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={vista.id === v.id}
              onClick={() => cambiar("vista", v.id === "confirmar" ? "" : v.id)}
              className={`min-h-11 shrink-0 rounded-control border px-4 text-sm font-semibold ${
                vista.id === v.id ? "border-tinta bg-tinta text-white" : "border-control bg-superficie hover:bg-hundido"
              }`}
            >
              {v.texto} <span className="cifras">({cuenta(v)})</span>
            </button>
          ))}
        </div>
        <div className="w-full sm:ml-auto sm:w-64">
          <label htmlFor="buscar-pedido" className="mb-1.5 block text-sm font-semibold">
            Buscar
          </label>
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tenue" aria-hidden />
            <input
              id="buscar-pedido"
              type="search"
              value={q}
              onChange={(e) => cambiar("q", e.target.value)}
              placeholder="Número o cliente"
              className="block min-h-11 w-full rounded-control border border-control bg-superficie py-2 pl-10 pr-3 text-base"
            />
          </div>
        </div>
      </div>

      {visibles.length === 0 ? (
        <EstadoVacio titulo={q ? `Ningún pedido coincide con "${q}"` : vista.id === "confirmar" ? "No tienes pedidos por confirmar" : "No hay pedidos en esta vista"}>
          {vista.id === "confirmar" && !q ? "Cuando un cliente envíe un pedido desde tu catálogo, aparece aquí." : "Prueba con otra vista o búsqueda."}
        </EstadoVacio>
      ) : (
        <Tabla<Pedido>
          titulo={`Pedidos: ${vista.texto.toLowerCase()}`}
          filas={visibles}
          clave={(p) => p.id}
          columnas={[
            {
              titulo: "Pedido",
              principal: true,
              celda: (p) => (
                <Link href={`/panel/pedidos/${p.id}`} className="font-semibold text-accion underline-offset-2 hover:underline">
                  <span className="cifras">{numeroPedido(p.numero)}</span> <span className="text-tinta">{p.comprador.nombre}</span>
                </Link>
              ),
            },
            { titulo: "Fecha", celda: (p) => formatearFecha(p.fecha, true) },
            { titulo: "Entrega", celda: (p) => NOMBRE_ENTREGA[p.entrega] },
            { titulo: "Total", derecha: true, celda: (p) => <span className="font-semibold">{formatear(p.totalBsCent, "VES")}</span> },
            { titulo: "Estado", celda: (p) => <Estado estado={p.estado} /> },
          ]}
        />
      )}
    </>
  );
}
