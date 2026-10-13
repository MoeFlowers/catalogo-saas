import type { Producto } from "./tipos";

export interface Clave {
  productoId: string;
  varianteId?: string;
}

/** Stock físico de un producto o de una de sus variantes. Sin variante y con variantes, suma todas. */
export function fisico(p: Producto, varianteId?: string): number {
  if (p.variantes) {
    if (varianteId) return p.variantes.find((v) => v.id === varianteId)?.stock ?? 0;
    return p.variantes.reduce((s, v) => s + v.stock, 0);
  }
  return p.stock;
}

export function reservado(p: Producto, varianteId?: string): number {
  if (p.variantes) {
    if (varianteId) return p.variantes.find((v) => v.id === varianteId)?.reservado ?? 0;
    return p.variantes.reduce((s, v) => s + v.reservado, 0);
  }
  return p.reservado;
}

/** Lo que se puede vender: físico menos lo comprometido por pedidos confirmados */
export function disponible(p: Producto, varianteId?: string): number {
  return Math.max(0, fisico(p, varianteId) - reservado(p, varianteId));
}

/** Aplica un cambio de stock físico y de reservado a un producto o variante, sin mutar */
export function mover(productos: Producto[], clave: Clave, deltaFisico: number, deltaReservado: number): Producto[] {
  return productos.map((p) => {
    if (p.id !== clave.productoId) return p;
    if (p.variantes && clave.varianteId) {
      return {
        ...p,
        variantes: p.variantes.map((v) =>
          v.id === clave.varianteId ? { ...v, stock: v.stock + deltaFisico, reservado: Math.max(0, v.reservado + deltaReservado) } : v,
        ),
      };
    }
    return { ...p, stock: p.stock + deltaFisico, reservado: Math.max(0, p.reservado + deltaReservado) };
  });
}

/** Filas de inventario: una por producto simple y una por variante */
export interface FilaInventario {
  clave: Clave;
  producto: Producto;
  nombre: string;
  sku: string;
  fisico: number;
  reservado: number;
  disponible: number;
  bajo: boolean;
}

export function filasInventario(productos: Producto[]): FilaInventario[] {
  return productos.flatMap((p) => {
    const filas: { clave: Clave; nombre: string; sku: string }[] = p.variantes
      ? p.variantes.map((v) => ({ clave: { productoId: p.id, varianteId: v.id }, nombre: `${p.nombre}, ${p.atributo ?? "opción"} ${v.nombre}`, sku: v.sku }))
      : [{ clave: { productoId: p.id }, nombre: p.nombre, sku: p.sku }];
    // Con variantes, el mínimo del producto se reparte entre ellas para la alerta de stock bajo
    const minimo = p.variantes ? Math.ceil(p.stockMinimo / p.variantes.length) : p.stockMinimo;
    return filas.map((f) => {
      const fis = fisico(p, f.clave.varianteId);
      const res = reservado(p, f.clave.varianteId);
      const disp = Math.max(0, fis - res);
      return { ...f, producto: p, fisico: fis, reservado: res, disponible: disp, bajo: disp <= minimo };
    });
  });
}
