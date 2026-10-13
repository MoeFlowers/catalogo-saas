import { formatearFecha, formatearTasa } from "@/dominio/dinero";
import type { Tasas } from "@/dominio/tipos";

/** "Tasa BCV 36,40 del 12/10/2026", o el aviso de que no hay tasa */
export function TasaDelDia({ tasas }: { tasas: Tasas | null }) {
  if (!tasas) return <span className="font-semibold text-alerta">Sin tasa del día: las fuentes no responden. Los precios se muestran en la moneda base.</span>;
  return (
    <span className="cifras">
      Tasa BCV {formatearTasa(tasas.bcv)}
      <span className="text-tenue">
        {tasas.origen === "manual" ? " fijada por Vitrina el " : " del "}
        {formatearFecha(tasas.fecha)}
      </span>
    </span>
  );
}
