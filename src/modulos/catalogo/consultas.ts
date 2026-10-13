import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { Tx } from "@/lib/db";
import { businesses, categories, deliveryMethods, presentations, priceTiers, productImages, products, productVariants } from "@/lib/db/esquema";
import { env } from "@/lib/env";
import type { Empresa, MetodoEntrega, Producto } from "@/dominio/tipos";

/** Métodos de entrega que piden dirección o ciudad al comprador */
const PIDE_DIRECCION = new Set(["delivery", "encomienda"]);

export async function empresaDesdeFila(tx: Tx, fila: typeof businesses.$inferSelect): Promise<Empresa> {
  const [cats, entregas] = await Promise.all([
    tx.select().from(categories).where(eq(categories.businessId, fila.id)).orderBy(asc(categories.orden), asc(categories.nombre)),
    tx.select().from(deliveryMethods).where(eq(deliveryMethods.businessId, fila.id)),
  ]);
  const orden = ["retiro", "delivery", "encomienda", "coordinar"];
  return {
    id: fila.id,
    slug: fila.slug,
    nombre: fila.nombre,
    razonSocial: fila.razonSocial,
    rif: fila.rif,
    rubro: fila.rubro,
    descripcion: fila.descripcion,
    ciudad: fila.ciudad,
    direccion: fila.direccion,
    horario: fila.horario,
    redes: fila.redes,
    color: fila.color,
    monedaBase: fila.monedaBase,
    pedidoMinimoCent: fila.pedidoMinimoCent,
    mostrarStock: fila.mostrarStock,
    whatsapp: fila.whatsapp,
    publicado: fila.publicado,
    plan: fila.plan,
    vence: fila.vence.toISOString(),
    diasCancelacion: fila.diasCancelacion,
    estado: fila.estado,
    motivoEstado: fila.motivoEstado,
    categorias: cats.map((c) => ({ id: c.id, nombre: c.nombre })),
    entregas: entregas
      .sort((a, b) => orden.indexOf(a.tipo) - orden.indexOf(b.tipo))
      .map((e): MetodoEntrega => ({ tipo: e.tipo, detalle: e.detalle, pideDireccion: PIDE_DIRECCION.has(e.tipo) })),
  };
}

export async function empresaPorSlug(tx: Tx, slug: string): Promise<Empresa | null> {
  const [fila] = await tx.select().from(businesses).where(eq(businesses.slug, slug)).limit(1);
  return fila ? empresaDesdeFila(tx, fila) : null;
}

export async function empresaPorId(tx: Tx, id: string): Promise<Empresa | null> {
  const [fila] = await tx.select().from(businesses).where(eq(businesses.id, id)).limit(1);
  return fila ? empresaDesdeFila(tx, fila) : null;
}

export function urlImagen(clave: string): string {
  return `${env.S3_PUBLIC_URL}/${clave}`;
}

/**
 * Productos de una empresa con variantes, presentaciones, escalas e imágenes. Las políticas de la base
 * deciden qué filas se ven según el contexto de la transacción (empresa o público).
 */
export async function productosDe(tx: Tx, businessId: string, opciones: { soloActivos?: boolean; ids?: string[] } = {}): Promise<Producto[]> {
  const filtros = [eq(products.businessId, businessId)];
  if (opciones.soloActivos) filtros.push(eq(products.activo, true));
  if (opciones.ids) {
    if (opciones.ids.length === 0) return [];
    filtros.push(inArray(products.id, opciones.ids));
  }
  const filas = await tx.select().from(products).where(and(...filtros)).orderBy(asc(products.nombre));
  if (filas.length === 0) return [];
  const ids = filas.map((p) => p.id);
  const [vars, pres, esc, imgs] = await Promise.all([
    tx.select().from(productVariants).where(inArray(productVariants.productId, ids)).orderBy(asc(productVariants.orden)),
    tx.select().from(presentations).where(inArray(presentations.productId, ids)).orderBy(asc(presentations.orden)),
    tx.select().from(priceTiers).where(inArray(priceTiers.productId, ids)).orderBy(asc(priceTiers.desde)),
    tx.select().from(productImages).where(inArray(productImages.productId, ids)).orderBy(asc(productImages.orden)),
  ]);
  return filas.map((p): Producto => {
    const propias = vars.filter((v) => v.productId === p.id);
    const conNombre = p.atributo != null;
    const base = conNombre ? undefined : propias[0];
    return {
      id: p.id,
      empresa: p.businessId,
      categoria: p.categoryId ?? "",
      nombre: p.nombre,
      marca: p.marca,
      sku: p.sku,
      descripcion: p.descripcion,
      unidad: p.unidad,
      unidadPlural: p.unidadPlural,
      precioCent: p.precioCent,
      escalas: esc.filter((e) => e.productId === p.id).map((e) => ({ desde: e.desde, precioCent: e.precioCent })),
      presentaciones: pres.filter((x) => x.productId === p.id).map((x) => ({ id: x.id, nombre: x.nombre, factor: x.factor })),
      atributo: p.atributo ?? undefined,
      variantes: conNombre ? propias.map((v) => ({ id: v.id, nombre: v.nombre ?? "", sku: v.sku, stock: v.fisico, reservado: v.reservado })) : undefined,
      varianteBaseId: base?.id,
      stock: base?.fisico ?? 0,
      reservado: base?.reservado ?? 0,
      activo: p.activo,
      stockMinimo: p.stockMinimo,
      minimo: p.minimo,
      multiplo: p.multiplo,
      bajoPedido: p.bajoPedido,
      imagenes: imgs.filter((i) => i.productId === p.id).map((i) => ({ url: urlImagen(i.clave), ancho: i.ancho, alto: i.alto })),
    };
  });
}

/** La variante donde vive el stock de una línea: la elegida o la base de un producto simple */
export function varianteDeLinea(p: Producto, varianteId?: string | null): string | undefined {
  return p.variantes ? (varianteId ?? undefined) : p.varianteBaseId;
}
