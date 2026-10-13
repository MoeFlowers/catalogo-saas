import type { ReactNode } from "react";

export interface Columna<T> {
  titulo: string;
  celda: (fila: T) => ReactNode;
  /** Columna que identifica la fila: va de título en la tarjeta del celular */
  principal?: boolean;
  derecha?: boolean;
  /** Se omite en la tarjeta del celular cuando repite lo que ya dice el título */
  ocultarEnTarjeta?: boolean;
}

interface Props<T> {
  columnas: Columna<T>[];
  filas: T[];
  clave: (fila: T) => string;
  titulo: string;
  resaltar?: (fila: T) => boolean;
}

/** Tabla en pantallas medianas y grandes; en el celular cada fila pasa a ser una tarjeta con sus datos */
export function Tabla<T>({ columnas, filas, clave, titulo, resaltar }: Props<T>) {
  const principal = columnas.find((c) => c.principal) ?? columnas[0]!;
  const resto = columnas.filter((c) => c !== principal && !c.ocultarEnTarjeta);

  return (
    <>
      <div className="hidden overflow-x-auto rounded-tarjeta border border-linea bg-superficie md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">{titulo}</caption>
          <thead>
            <tr className="border-b border-linea text-left text-tenue">
              {columnas.map((c) => (
                <th key={c.titulo} scope="col" className={`px-4 py-3 font-semibold ${c.derecha ? "text-right" : ""}`}>
                  {c.titulo}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={clave(f)} className={`border-b border-linea last:border-0 ${resaltar?.(f) ? "bg-[#fffbeb]" : ""}`}>
                {columnas.map((c) => (
                  <td key={c.titulo} className={`cifras px-4 py-3 align-top ${c.derecha ? "text-right" : ""}`}>
                    {c.celda(f)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden" aria-label={titulo}>
        {filas.map((f) => (
          <li key={clave(f)} className={`rounded-tarjeta border border-linea p-4 ${resaltar?.(f) ? "bg-[#fffbeb]" : "bg-superficie"}`}>
            <div className="font-semibold">{principal.celda(f)}</div>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              {resto.map((c) => (
                <div key={c.titulo} className="contents">
                  <dt className="text-tenue">{c.titulo}</dt>
                  <dd className="cifras text-right">{c.celda(f)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
