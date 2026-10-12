import type { Moneda } from "../datos/tipos";
import { aBs, formatear, refUsd } from "../lib/dinero";
import { useTasas } from "../estado/tasas";

interface Props {
  cent: number;
  moneda: Moneda;
  /** "por caja de 100", "por metro" */
  por?: string;
  tamano?: "sm" | "lg";
}

/**
 * Etiqueta de precio: el motivo visual de Vitrina. Imita la tira de precio de un anaquel
 * (filete superior, cifra grande en bolívares, referencia en dólares debajo), que es lo que
 * un comprador mayorista ya sabe leer de un vistazo.
 */
export function Etiqueta({ cent, moneda, por, tamano = "sm" }: Props) {
  const tasas = useTasas((s) => s.tasas);
  const grande = tamano === "lg";
  const bs = tasas ? aBs(cent, moneda, tasas) : null;

  return (
    <div className={`border-t-2 border-tinta ${grande ? "pt-2" : "pt-1.5"}`}>
      {bs == null || !tasas ? (
        <p className={`cifras font-bold ${grande ? "text-2xl" : "text-base"}`}>
          {formatear(cent, moneda)}
          <span className="block text-sm font-normal text-tenue">Calculando bolívares</span>
        </p>
      ) : (
        <>
          <p className={`cifras font-bold leading-tight ${grande ? "text-3xl" : "text-lg"}`}>{formatear(bs, "VES")}</p>
          <p className={`cifras text-tenue ${grande ? "text-base" : "text-sm"}`}>
            Ref. {formatear(refUsd(bs, tasas), "USD")}
            {por && <span> {por}</span>}
          </p>
        </>
      )}
    </div>
  );
}
