import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, type LinkProps } from "react-router";

type Variante = "marca" | "accion" | "secundario" | "fantasma" | "peligro";

const BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-control px-4 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTES: Record<Variante, string> = {
  marca: "bg-marca text-marca-texto hover:brightness-110",
  accion: "bg-accion text-white hover:bg-accion-hover",
  secundario: "border border-control bg-superficie text-tinta hover:bg-hundido",
  fantasma: "text-tinta hover:bg-hundido",
  peligro: "border border-control bg-superficie text-peligro hover:bg-hundido",
};

export function clasesBoton(variante: Variante = "secundario", extra = ""): string {
  return `${BASE} ${VARIANTES[variante]} ${extra}`;
}

interface PropsBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  cargando?: boolean;
  textoCargando?: string;
  children: ReactNode;
}

export function Boton({ variante = "secundario", cargando, textoCargando, className = "", children, disabled, ...resto }: PropsBoton) {
  return (
    <button
      type="button"
      {...resto}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={clasesBoton(variante, className)}
    >
      {cargando ? (textoCargando ?? "Procesando") : children}
    </button>
  );
}

export function BotonEnlace({ variante = "secundario", className = "", ...resto }: LinkProps & { variante?: Variante }) {
  return <Link {...resto} className={clasesBoton(variante, className)} />;
}
