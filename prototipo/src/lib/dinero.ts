import type { Moneda, Tasas } from "../datos/tipos";

const formato = new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SIMBOLO: Record<Moneda, string> = { VES: "Bs", USD: "USD", EUR: "EUR", USDT: "USDT" };

export function formatear(cent: number, moneda: Moneda): string {
  return `${SIMBOLO[moneda]} ${formato.format(cent / 100)}`;
}

export function formatearTasa(tasa: number): string {
  return new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(tasa);
}

/** Bolívares por unidad de cada moneda, igual que en Control de Deudas */
export function tasaABs(moneda: Moneda, tasas: Tasas): number | null {
  switch (moneda) {
    case "VES":
      return 1;
    case "USD":
      return tasas.bcv;
    case "USDT":
      return tasas.usdt;
    case "EUR":
      return tasas.eur;
  }
}

export function aBs(cent: number, moneda: Moneda, tasas: Tasas): number | null {
  const t = tasaABs(moneda, tasas);
  return t == null ? null : Math.round(cent * t);
}

/** La referencia en USD siempre sale de los bolívares a tasa BCV */
export function refUsd(bsCent: number, tasas: Tasas): number {
  return Math.round(bsCent / tasas.bcv);
}

export function formatearFecha(iso: string, conHora = false): string {
  const d = new Date(iso);
  return d.toLocaleString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(conHora ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
