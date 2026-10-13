"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";

interface PropsCampo {
  etiqueta: string;
  ayuda?: ReactNode | undefined;
  error?: string | null | undefined;
  opcional?: boolean | undefined;
}

const CONTROL =
  "block w-full rounded-control border bg-superficie px-3 py-2.5 text-base text-tinta placeholder:text-tenue min-h-11";

function Envoltura({ id, etiqueta, ayuda, error, opcional, children }: PropsCampo & { id: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-semibold">
        {etiqueta}
        {opcional && <span className="font-normal text-tenue"> (opcional)</span>}
      </label>
      {children}
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

function describe(id: string, ayuda: unknown, error: unknown): string | undefined {
  if (error) return `${id}-error`;
  if (ayuda) return `${id}-ayuda`;
  return undefined;
}

export function Campo({ etiqueta, ayuda, error, opcional, id: idProp, ...resto }: PropsCampo & InputHTMLAttributes<HTMLInputElement>) {
  const generado = useId();
  const id = idProp ?? generado;
  return (
    <Envoltura id={id} etiqueta={etiqueta} ayuda={ayuda} error={error} opcional={opcional}>
      <input
        id={id}
        {...resto}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe(id, ayuda, error)}
        className={`${CONTROL} ${error ? "border-peligro" : "border-control"}`}
      />
    </Envoltura>
  );
}

export function Area({ etiqueta, ayuda, error, opcional, id: idProp, ...resto }: PropsCampo & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const generado = useId();
  const id = idProp ?? generado;
  return (
    <Envoltura id={id} etiqueta={etiqueta} ayuda={ayuda} error={error} opcional={opcional}>
      <textarea
        id={id}
        rows={3}
        {...resto}
        aria-invalid={error ? true : undefined}
        aria-describedby={describe(id, ayuda, error)}
        className={`${CONTROL} ${error ? "border-peligro" : "border-control"}`}
      />
    </Envoltura>
  );
}
