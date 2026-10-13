import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import type { EstadoPedido } from "../../datos/tipos";
import { useShallow } from "zustand/react/shallow";
import { useDatos } from "../../estado/datos";
import { NOMBRE_ESTADO } from "../../estado/pedidos";
import { useSesion } from "../../estado/sesion";
import { formatear, formatearFecha } from "../../lib/dinero";
import { numeroPedido } from "../../lib/pedido";
import { BotonEnlace } from "../../ui/Boton";
import { EstadoVacio } from "../../ui/piezas";

/** Insignia de estado: texto siempre visible, el color solo refuerza */
export function InsigniaEstado({ estado }: { estado: EstadoPedido }) {
  const clase =
    estado === "pendiente"
      ? "border-alerta/50 text-alerta"
      : estado === "cancelado"
        ? "border-peligro/50 text-peligro"
        : estado === "entregado"
          ? "border-exito/50 text-exito"
          : "border-control text-tinta";
  return <span className={`inline-block rounded-control border px-2 py-0.5 text-xs font-semibold ${clase}`}>{NOMBRE_ESTADO[estado]}</span>;
}

export function MisPedidos() {
  const correo = useSesion((s) => s.comprador?.correo);
  const lista = useDatos(useShallow((s) => s.pedidos.filter((p) => p.compradorCorreo === correo)));
  const EMPRESAS = useDatos((s) => s.empresas);
  const [empresa, setEmpresa] = useState("");
  const visibles = [...lista].filter((p) => !empresa || p.empresa === empresa).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const conPedidos = EMPRESAS.filter((e) => lista.some((p) => p.empresa === e.slug));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold">Mis pedidos</h1>
        {conPedidos.length > 1 && (
          <label className="flex items-center gap-2 text-sm">
            Empresa
            <select value={empresa} onChange={(e) => setEmpresa(e.target.value)} className="min-h-11 rounded-control border border-control bg-superficie px-2">
              <option value="">Todas</option>
              {conPedidos.map((e) => (
                <option key={e.slug} value={e.slug}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {visibles.length === 0 ? (
        <div className="mt-6">
          <EstadoVacio
            titulo="Todavía no tienes pedidos"
            accion={
              <BotonEnlace to="/" variante="accion">
                Ver catálogos de demostración
              </BotonEnlace>
            }
          >
            Cuando envíes un pedido desde un catálogo, aparece aquí con su estado.
          </EstadoVacio>
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-linea border-y border-linea">
          {visibles.map((p) => {
            const e = EMPRESAS.find((x) => x.slug === p.empresa);
            return (
              <li key={p.id}>
                <Link to={`/cuenta/pedidos/${p.id}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 rounded-control py-4 hover:bg-hundido sm:px-2">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{e?.nombre}</span>
                    <span className="cifras block text-sm text-tenue">
                      {numeroPedido(p.numero)}, {formatearFecha(p.fecha)}, {p.items.length} {p.items.length === 1 ? "producto" : "productos"}
                      {p.demostracion && ". Pedido de demostración"}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-right">
                      <span className="cifras block font-bold">{formatear(p.totalBsCent, "VES")}</span>
                      <InsigniaEstado estado={p.estado} />
                    </span>
                    <ChevronRight size={18} className="text-tenue" aria-hidden />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
