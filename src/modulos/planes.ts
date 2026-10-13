import type { planEnum, rolEnum } from "@/lib/db/esquema";

export type IdPlan = (typeof planEnum.enumValues)[number];
export type Rol = (typeof rolEnum.enumValues)[number];

export interface Plan {
  id: IdPlan;
  nombre: string;
  usuarios: number;
  productos: number | null;
  almacenes: number;
  /** Precio propuesto en el plan maestro, sin validar todavía con empresas reales */
  precioUsdCent: number;
  incluye: string;
}

export const PLANES: Plan[] = [
  { id: "inicial", nombre: "Inicial", usuarios: 1, productos: 200, almacenes: 1, precioUsdCent: 900, incluye: "Catálogo, pedidos e inventario básico" },
  { id: "negocio", nombre: "Negocio", usuarios: 3, productos: 2000, almacenes: 2, precioUsdCent: 1900, incluye: "Variantes, presentaciones, escalas de precio, Excel y clientes" },
  { id: "mayorista", nombre: "Mayorista", usuarios: 10, productos: null, almacenes: 5, precioUsdCent: 3900, incluye: "Listas de precio mayoristas, varios almacenes, estadísticas y todos los roles" },
];

export function planDe(id: IdPlan): Plan {
  return PLANES.find((p) => p.id === id)!;
}

export const NOMBRE_ROL: Record<Rol, string> = {
  dueno: "Dueño",
  administrador: "Administrador",
  vendedor: "Vendedor",
  almacen: "Almacén",
  lectura: "Solo lectura",
};

export const PERMISOS_ROL: Record<Rol, string> = {
  dueno: "Todo, incluida la suscripción y borrar la empresa",
  administrador: "Todo menos la suscripción y borrar la empresa",
  vendedor: "Pedidos y clientes; ve productos e inventario",
  almacen: "Inventario y preparar o despachar pedidos",
  lectura: "Ve todo, sin hacer cambios",
};
