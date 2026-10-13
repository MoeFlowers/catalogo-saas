import type { Empresa, Presentacion, Producto } from "../datos/tipos";
import { disponible } from "./inventario";

function mcd(a: number, b: number): number {
  return b === 0 ? a : mcd(b, a % b);
}

export function presentacion(p: Producto, id: string): Presentacion {
  return p.presentaciones.find((x) => x.id === id) ?? p.presentaciones[0]!;
}

/** Precio unitario según las escalas por cantidad de unidades base */
export function precioUnitario(p: Producto, unidadesBase: number): number {
  let precio = p.precioCent;
  for (const e of p.escalas) if (unidadesBase >= e.desde) precio = e.precioCent;
  return precio;
}

/** Paso del selector de cantidad para que el total respete el múltiplo de venta */
export function paso(p: Producto, pres: Presentacion): number {
  return p.multiplo / mcd(pres.factor, p.multiplo);
}

/** Primera cantidad válida de una presentación: respeta mínimo y múltiplo */
export function cantidadInicial(p: Producto, pres: Presentacion): number {
  const s = paso(p, pres);
  let n = s;
  while (n * pres.factor < p.minimo) n += s;
  return n;
}

/** Lo que el catálogo ofrece: stock físico menos lo reservado por pedidos confirmados */
export function stockDe(p: Producto, varianteId?: string): number {
  return disponible(p, varianteId);
}

export type Nivel = "disponible" | "pocas" | "agotado" | "bajo-pedido";

export function nivelStock(p: Producto, varianteId?: string): Nivel {
  const s = stockDe(p, varianteId);
  if (s <= 0) return p.bajoPedido ? "bajo-pedido" : "agotado";
  return s <= p.stockMinimo ? "pocas" : "disponible";
}

export function textoStock(p: Producto, e: Empresa, varianteId?: string): string | null {
  const nivel = nivelStock(p, varianteId);
  if (nivel === "agotado") return "Agotado";
  if (nivel === "bajo-pedido") return "Bajo pedido";
  if (e.mostrarStock === "oculto") return null;
  if (e.mostrarStock === "cantidad") {
    const s = stockDe(p, varianteId);
    return `${s.toLocaleString("es-VE")} ${s === 1 ? p.unidad : p.unidadPlural} disponibles`;
  }
  return nivel === "pocas" ? "Pocas unidades" : "Disponible";
}

/** Error de validación de una cantidad, o null si es válida */
export function validarCantidad(p: Producto, pres: Presentacion, cantidad: number, varianteId?: string): string | null {
  const unidades = cantidad * pres.factor;
  if (unidades < p.minimo) return `El mínimo es ${p.minimo} ${p.minimo === 1 ? p.unidad : p.unidadPlural}.`;
  if (unidades % p.multiplo !== 0) return `Se vende de ${p.multiplo} en ${p.multiplo} ${p.unidadPlural}.`;
  if (!p.bajoPedido && unidades > stockDe(p, varianteId)) {
    const s = stockDe(p, varianteId);
    return s === 0 ? "Este producto está agotado." : `Solo hay ${s} ${s === 1 ? p.unidad : p.unidadPlural} disponibles.`;
  }
  return null;
}
