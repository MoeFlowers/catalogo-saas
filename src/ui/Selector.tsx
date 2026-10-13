"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";

interface PropsSelector extends SelectHTMLAttributes<HTMLSelectElement> {
  etiqueta: string;
  ayuda?: ReactNode | undefined;
  error?: string | null | undefined;
  opciones: { valor: string; texto: string }[];
}

export function Selector({ etiqueta, ayuda, error, opciones, id: idProp, ...resto }: PropsSelector) {
  const generado = useId();
  const id = idProp ?? generado;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold">
        {etiqueta}
      </label>
      <select
        id={id}
        {...resto}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined}
        className={`block min-h-11 w-full rounded-control border bg-superficie px-3 text-base ${error ? "border-peligro" : "border-control"}`}
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
      {ayuda && !error && (
        <p id={`${id}-ayuda`} className="text-sm text-tenue">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-peligro">
          {error}
        </p>
      )}
    </div>
  );
}

interface PropsCasilla extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  etiqueta: ReactNode;
  descripcion?: ReactNode | undefined;
}

export function Casilla({ etiqueta, descripcion, id: idProp, ...resto }: PropsCasilla) {
  const generado = useId();
  const id = idProp ?? generado;
  return (
    <div className="flex gap-3">
      <input id={id} type="checkbox" {...resto} aria-describedby={descripcion ? `${id}-desc` : undefined} className="mt-0.5 size-5 shrink-0 accent-[var(--color-accion)]" />
      <div>
        <label htmlFor={id} className="font-semibold">
          {etiqueta}
        </label>
        {descripcion && (
          <p id={`${id}-desc`} className="text-sm text-tenue">
            {descripcion}
          </p>
        )}
      </div>
    </div>
  );
}
