import { aBs, formatear, refUsd } from "@/dominio/dinero";
import type { Moneda, Tasas } from "@/dominio/tipos";

interface Props {
  cent: number;
  moneda: Moneda;
  tasas: Tasas | null;
  /** "por caja de 100", "por metro" */
  por?: string | undefined;
  tamano?: "sm" | "lg";
}

/**
 * Etiqueta de precio: el motivo visual de Vitrina (docs/DESIGN.md). Imita la tira de precio de un anaquel:
 * filete superior, cifra grande en bolívares, referencia en dólares debajo.
 */
export function Etiqueta({ cent, moneda, tasas, por, tamano = "sm" }: Props) {
  const grande = tamano === "lg";
  const bs = tasas ? aBs(cent, moneda, tasas) : null;
  return (
    <div className={`border-t-2 border-tinta ${grande ? "pt-2" : "pt-1.5"}`}>
      {bs == null || !tasas ? (
        <p className={`cifras font-bold ${grande ? "text-2xl" : "text-base"}`}>
          {formatear(cent, moneda)}
          {por && <span className="block text-sm font-normal text-tenue">{por}</span>}
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
