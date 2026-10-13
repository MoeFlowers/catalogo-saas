import type { ReactNode } from "react";
import { NOMBRE_ESTADO } from "@/dominio/estados";
import type { EstadoPedido } from "@/dominio/tipos";

export function Encabezado({ titulo, children, acciones }: { titulo: string; children?: ReactNode; acciones?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 print:hidden">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold">{titulo}</h1>
        {children && <div className="mt-1 max-w-2xl text-tenue">{children}</div>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}

/** Estado del pedido en el panel: texto siempre visible, el color solo refuerza */
export function Estado({ estado }: { estado: EstadoPedido }) {
  const clase =
    estado === "pendiente"
      ? "border-alerta/50 text-alerta"
      : estado === "cancelado"
        ? "border-peligro/50 text-peligro"
        : estado === "entregado"
          ? "border-exito/50 text-exito"
          : "border-control text-tinta";
  return <span className={`inline-block whitespace-nowrap rounded-control border px-2 py-0.5 text-xs font-semibold ${clase}`}>{NOMBRE_ESTADO[estado]}</span>;
}

/** "hace 3 horas", "hace 2 días" */
export function hace(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 60) return min <= 1 ? "hace un momento" : `hace ${min} minutos`;
  const h = Math.round(min / 60);
  if (h < 24) return h === 1 ? "hace 1 hora" : `hace ${h} horas`;
  const d = Math.round(h / 24);
  return d === 1 ? "hace 1 día" : `hace ${d} días`;
}

/** Monto escrito por una persona ("12,50", "12.50", "1.250,00") a céntimos; null si no es válido */
export function aCentimos(texto: string): number | null {
  const t = texto.trim().replace(/\s/g, "");
  if (!t) return null;
  const normal = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t;
  if (!/^\d+(\.\d{1,2})?$/.test(normal)) return null;
  return Math.round(Number(normal) * 100);
}

export function deCentimos(cent: number): string {
  return (cent / 100).toFixed(2).replace(".", ",");
}

export const enteroPositivo = (t: string) => /^\d+$/.test(t.trim()) && Number(t) > 0;
