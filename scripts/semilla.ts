// Datos de demostración para desarrollo: las empresas y productos del boceto, con su inventario inicial.
// Uso: pnpm db:semilla. Borra y vuelve a crear solo las empresas de demostración y sus cuentas.
//
// Cuentas de prueba (solo existen en tu base local; nunca uses estas claves en otro lado):
//   dueno@ferreteria-ejemplo.test   clave: demostracion-vitrina-2026   (dueño de Ferretería Ejemplo)
//   dueno@textiles-ejemplo.test     clave: demostracion-vitrina-2026   (dueño de Textiles Ejemplo)
//   admin@vitrina.test              clave: demostracion-vitrina-2026   (administración; debe estar en ADMIN_EMAILS)
// Al entrar por primera vez, el panel pide activar la verificación en dos pasos.
import { randomUUID } from "node:crypto";
import { hash } from "@node-rs/argon2";
import { drizzle } from "drizzle-orm/postgres-js";
import { inArray } from "drizzle-orm";
import postgres from "postgres";
import * as e from "../src/lib/db/esquema";
import { EMPRESAS_SEMILLA } from "../prototipo/src/datos/empresas";
import { PRODUCTOS_SEMILLA } from "../prototipo/src/datos/productos";

const CLAVE = "demostracion-vitrina-2026";
const url = process.env.DATABASE_OWNER_URL;
if (!url) throw new Error("Falta DATABASE_OWNER_URL en .env");
if (process.env.APP_ENV === "production") throw new Error("La semilla no corre en producción");

const cliente = postgres(url, { max: 1, onnotice: () => {} });
const db = drizzle(cliente, { schema: e });
const ARGON = { memoryCost: 19_456, timeCost: 2, parallelism: 1 };

async function usuario(correo: string, nombre: string): Promise<string> {
  const id = randomUUID();
  await db.insert(e.user).values({ id, name: nombre, email: correo, emailVerified: true });
  await db.insert(e.account).values({ id: randomUUID(), accountId: id, providerId: "credential", userId: id, password: await hash(CLAVE, ARGON), updatedAt: new Date() });
  return id;
}

const activas = EMPRESAS_SEMILLA.filter((x) => x.estado === "activa");
const correos = [...activas.map((x) => `dueno@${x.slug}.test`), "admin@vitrina.test"];

await db.delete(e.businesses).where(
  inArray(
    e.businesses.slug,
    activas.map((x) => x.slug),
  ),
);
await db.delete(e.user).where(inArray(e.user.email, correos));

await usuario("admin@vitrina.test", "Administración de prueba");

for (const emp of activas) {
  const [fila] = await db
    .insert(e.businesses)
    .values({
      slug: emp.slug,
      nombre: emp.nombre,
      razonSocial: emp.razonSocial,
      rif: emp.rif,
      rubro: emp.rubro,
      descripcion: emp.descripcion,
      ciudad: emp.ciudad,
      direccion: emp.direccion,
      horario: emp.horario,
      color: emp.color,
      monedaBase: emp.monedaBase,
      pedidoMinimoCent: emp.pedidoMinimoCent,
      mostrarStock: emp.mostrarStock,
      whatsapp: "+580000000000",
      publicado: true,
      plan: emp.plan,
      vence: new Date(Date.now() + 30 * 86_400_000),
      diasCancelacion: emp.diasCancelacion,
      estado: "activa",
    })
    .returning({ id: e.businesses.id });
  const businessId = fila!.id;
  const duenoId = await usuario(`dueno@${emp.slug}.test`, `Dueño de ${emp.nombre}`);
  await db.insert(e.memberships).values({ businessId, userId: duenoId, rol: "dueno" });
  await db.insert(e.deliveryMethods).values(emp.entregas.map((d) => ({ businessId, tipo: d.tipo, detalle: d.detalle })));

  const categorias = new Map<string, string>();
  for (const [orden, c] of emp.categorias.entries()) {
    const [cat] = await db.insert(e.categories).values({ businessId, nombre: c.nombre, orden }).returning({ id: e.categories.id });
    categorias.set(c.id, cat!.id);
  }

  for (const p of PRODUCTOS_SEMILLA.filter((x) => x.empresa === emp.slug)) {
    const [prod] = await db
      .insert(e.products)
      .values({
        businessId,
        categoryId: categorias.get(p.categoria) ?? null,
        nombre: p.nombre,
        marca: p.marca,
        sku: p.sku,
        descripcion: p.descripcion,
        unidad: p.unidad,
        unidadPlural: p.unidadPlural,
        precioCent: p.precioCent,
        atributo: p.atributo ?? null,
        stockMinimo: p.stockMinimo,
        minimo: p.minimo,
        multiplo: p.multiplo,
        bajoPedido: p.bajoPedido,
      })
      .returning({ id: e.products.id });
    const productId = prod!.id;
    await db.insert(e.presentations).values(p.presentaciones.map((x, orden) => ({ businessId, productId, nombre: x.nombre, factor: x.factor, orden })));
    if (p.escalas.length) await db.insert(e.priceTiers).values(p.escalas.map((x) => ({ businessId, productId, desde: x.desde, precioCent: x.precioCent })));
    const variantes = p.variantes ?? [{ id: "base", nombre: null as string | null, sku: p.sku, stock: p.stock, reservado: 0 }];
    for (const [orden, v] of variantes.entries()) {
      const [vari] = await db
        .insert(e.productVariants)
        .values({ businessId, productId, nombre: v.nombre, sku: v.sku, orden, fisico: v.stock })
        .returning({ id: e.productVariants.id });
      if (v.stock > 0) {
        await db.insert(e.stockMovements).values({ businessId, variantId: vari!.id, tipo: "entrada", cantidad: v.stock, motivo: "Inventario inicial", userId: duenoId });
      }
    }
  }
  await db.insert(e.auditLog).values({ actor: "semilla", accion: "Creó la empresa de demostración", objetivo: emp.slug, businessId });
  console.log(`${emp.nombre}: ${PRODUCTOS_SEMILLA.filter((x) => x.empresa === emp.slug).length} productos`);
}

await cliente.end();
console.log(`Listo. Cuentas de prueba con la clave del encabezado de scripts/semilla.ts.`);
