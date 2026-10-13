"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

interface Props {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
}

/**
 * Diálogo modal sobre el elemento nativo <dialog>: el navegador atrapa el foco, cierra con Escape
 * y devuelve el foco al control que lo abrió.
 */
export function Dialogo({ abierto, titulo, onCerrar, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      onClose={onCerrar}
      className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-tarjeta border border-linea bg-superficie p-0 text-tinta shadow-xl backdrop:bg-tinta/40"
    >
      {abierto && (
        <div className="max-h-[85dvh] overflow-y-auto p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 id={idTitulo} className="text-lg font-bold leading-snug">
              {titulo}
            </h2>
            <button type="button" onClick={onCerrar} aria-label="Cerrar" className="-m-2 grid size-11 shrink-0 place-items-center rounded-control hover:bg-hundido">
              <X size={20} aria-hidden />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
