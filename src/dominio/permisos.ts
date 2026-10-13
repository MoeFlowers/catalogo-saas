import type { Rol } from "@/modulos/planes";
import type { Empresa } from "./tipos";

/** Áreas del panel que cambian datos. Ver todo está permitido a todos los roles. */
export type Area =
  | "confirmar" // confirmar, ajustar y cancelar pedidos
  | "despachar" // preparar, marcar listo, despachar y entregar
  | "productos"
  | "inventario"
  | "ajustes" // categorías, entrega y catálogo
  | "equipo"
  | "suscripcion";

// Plan maestro, sección 3.3: lo que puede cambiar cada rol
const PERMISOS: Record<Rol, Area[]> = {
  dueno: ["confirmar", "despachar", "productos", "inventario", "ajustes", "equipo", "suscripcion"],
  administrador: ["confirmar", "despachar", "productos", "inventario", "ajustes", "equipo"],
  vendedor: ["confirmar", "despachar"],
  almacen: ["despachar", "inventario"],
  lectura: [],
};

export function puede(rol: Rol, area: Area, empresa: Pick<Empresa, "estado">): boolean {
  if (empresa.estado === "suspendida" || empresa.estado === "rechazada") return false;
  return PERMISOS[rol].includes(area);
}

export function suscripcionVencida(e: Pick<Empresa, "vence">): boolean {
  return new Date(e.vence).getTime() < Date.now();
}

/** Días enteros que faltan hasta una fecha (negativo si ya pasó) */
export function diasHasta(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}
