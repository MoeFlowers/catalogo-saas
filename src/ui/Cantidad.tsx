"use client";

import { Minus, Plus } from "lucide-react";

interface Props {
  valor: number;
  paso: number;
  minimo: number;
  onCambio: (n: number) => void;
  etiqueta: string;
  unidad: string;
}

/** Selector de cantidad que solo produce múltiplos del paso */
export function Cantidad({ valor, paso, minimo, onCambio, etiqueta, unidad }: Props) {
  const ajustar = (n: number) => {
    const redondeado = Math.max(minimo, Math.round(n / paso) * paso);
    onCambio(Number.isFinite(redondeado) ? redondeado : minimo);
  };
  return (
    <div className="inline-flex items-stretch rounded-control border border-control bg-superficie" role="group" aria-label={etiqueta}>
      <button
        type="button"
        onClick={() => ajustar(valor - paso)}
        disabled={valor - paso < minimo}
        aria-label={`Quitar ${paso} ${unidad}`}
        className="grid size-11 place-items-center rounded-l-control hover:bg-hundido disabled:opacity-40"
      >
        <Minus size={18} aria-hidden />
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={valor}
        min={minimo}
        step={paso}
        aria-label={`${etiqueta}, en ${unidad}`}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (n > 0) onCambio(n);
        }}
        onBlur={(e) => ajustar(Number(e.target.value) || minimo)}
        className="cifras w-16 border-x border-control bg-transparent text-center text-base font-semibold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => ajustar(valor + paso)}
        aria-label={`Agregar ${paso} ${unidad}`}
        className="grid size-11 place-items-center rounded-r-control hover:bg-hundido"
      >
        <Plus size={18} aria-hidden />
      </button>
    </div>
  );
}
