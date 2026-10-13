import type { ReactNode } from "react";
import { Estado } from "@/componentes/panel/comun";
import { formatear, formatearFecha, formatearTasa, refUsd } from "@/dominio/dinero";
import { EXPLICACION_ESTADO, NOMBRE_ESTADO } from "@/dominio/estados";
import { NOMBRE_ENTREGA, numeroPedido } from "@/dominio/pedido";
import type { Pedido } from "@/dominio/tipos";

/** Pedido tal como lo ve quien lo hizo: líneas fijas, tasa de ese día, entrega e historial */
export function VistaPedido({ pedido, empresa, acciones }: { pedido: Pedido; empresa: string; acciones?: ReactNode }) {
  const tasas = { bcv: pedido.tasa, usdt: pedido.tasa, eur: null, fecha: pedido.fechaTasa, origen: "en-vivo" as const };
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="cifras text-sm font-semibold text-tenue">
            {numeroPedido(pedido.numero)}, {formatearFecha(pedido.fecha, true)}
          </p>
          <h1 className="text-2xl font-bold">{empresa}</h1>
        </div>
        <Estado estado={pedido.estado} />
      </div>
      <p className="mt-2 text-tenue">{EXPLICACION_ESTADO[pedido.estado]}</p>
      {pedido.ajustado && <p className="mt-1 text-sm">La empresa ajustó cantidades antes de confirmar.</p>}
      {acciones && <div className="mt-5 flex flex-col gap-3 sm:flex-row">{acciones}</div>}

      <section aria-labelledby="titulo-productos" className="mt-8">
        <h2 id="titulo-productos" className="text-lg font-bold">
          Productos
        </h2>
        <ul className="mt-2 divide-y divide-linea border-y border-linea">
          {pedido.items.map((i) => (
            <li key={i.id ?? `${i.sku}-${i.cantidad}`} className="flex justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="font-semibold leading-snug">
                  <span className="cifras">{i.cantidad} x </span>
                  {i.nombre}
                </p>
                <p className="cifras text-sm text-tenue">
                  {i.detalle}. Código {i.sku}
                </p>
              </div>
              <p className="cifras shrink-0 text-right font-semibold">{formatear(i.totalBsCent, "VES")}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3 text-right">
          <p className="cifras text-xl font-bold">Total {formatear(pedido.totalBsCent, "VES")}</p>
          <p className="cifras text-sm text-tenue">
            Ref. {formatear(refUsd(pedido.totalBsCent, tasas), "USD")}. Tasa BCV {formatearTasa(pedido.tasa)} del {formatearFecha(pedido.fechaTasa)}.
          </p>
        </div>
      </section>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 sm:grid-cols-2">
        <section aria-labelledby="titulo-entrega">
          <h2 id="titulo-entrega" className="text-lg font-bold">
            Entrega
          </h2>
          <p className="mt-1">{NOMBRE_ENTREGA[pedido.entrega]}</p>
          {pedido.destino && <p className="text-tenue">{pedido.destino}</p>}
          {pedido.nota && <p className="mt-2 text-sm text-tenue">Nota: {pedido.nota}</p>}
        </section>
        <section aria-labelledby="titulo-historial">
          <h2 id="titulo-historial" className="text-lg font-bold">
            Historial
          </h2>
          <ol className="mt-2 space-y-2 border-l border-control pl-4">
            {pedido.historial.map((h, i) => (
              <li key={`${h.estado}-${i}`} className="text-sm">
                <span className="font-semibold">{NOMBRE_ESTADO[h.estado]}</span>
                <span className="cifras block text-tenue">{formatearFecha(h.fecha, true)}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
