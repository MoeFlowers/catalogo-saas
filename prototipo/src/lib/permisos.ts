import type { Empresa, Rol } from "../datos/tipos";

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

export function puede(rol: Rol, area: Area, empresa: Empresa, soporte = false): boolean {
  // Vitrina entra a dar soporte en solo lectura; una empresa suspendida tampoco opera
  if (soporte || empresa.estado === "suspendida" || empresa.estado === "rechazada") return false;
  return PERMISOS[rol].includes(area);
}

export function suscripcionVencida(e: Empresa): boolean {
  return new Date(e.vence).getTime() < Date.now();
}
