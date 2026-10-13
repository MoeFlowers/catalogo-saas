// Ciclo del pedido contra PostgreSQL real con el rol de la app (plan maestro 4.3, ADR-0008):
// crear no toca el stock, confirmar reserva, despachar descuenta y cancelar libera.
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Tx } from "@/lib/db";
import * as e from "@/lib/db/esquema";
import type { Tasas } from "@/dominio/tipos";
import { empresaPorId } from "@/modulos/catalogo/consultas";
import { cambiarEstado, crearPedido } from "@/modulos/pedidos/servicio";

const dueno = postgres(process.env.DATABASE_TEST_URL!, { max: 1, onnotice: () => {} });
const app = drizzle(postgres(process.env.DATABASE_TEST_RUNTIME_URL!, { max: 2, onnotice: () => {} }), { schema: e });
const ddb = drizzle(dueno, { schema: e });

const tasas: Tasas = { bcv: 100, usdt: 100, eur: null, fecha: new Date().toISOString(), origen: "en-vivo" };
let empresaId = "";
let productoId = "";
let varianteId = "";
let presentacionId = "";
let compradorId = "";

/** Igual que conContexto de la app, pero sobre la base de pruebas */
function como<T>(fn: (tx: Tx) => Promise<T>, rol = "empresa"): Promise<T> {
  return app.transaction(async (tx) => {
    await tx.execute(sql`select set_config('app.rol', ${rol}, true), set_config('app.business_id', ${empresaId}, true)`);
    return fn(tx as unknown as Tx);
  });
}

const datos = (cantidad: number) => ({
  lineas: [{ productoId, presentacionId, cantidad }],
  entrega: "retiro" as const,
  destino: "",
  nota: "",
  comprador: { nombre: "Comprador de prueba", telefono: "04140000000", documento: "", correo: "comprador@prueba.test", userId: compradorId },
});

async function stock() {
  const [v] = await ddb.select().from(e.productVariants).where(eq(e.productVariants.id, varianteId));
  const [m] = await ddb
    .select({ fisico: sql<number>`coalesce(sum(cantidad) filter (where tipo in ('entrada','salida','ajuste')), 0)::int` })
    .from(e.stockMovements)
    .where(eq(e.stockMovements.variantId, varianteId));
  return { fisico: v!.fisico, reservado: v!.reservado, sumaMovimientos: m!.fisico };
}

beforeAll(async () => {
  await dueno`truncate businesses cascade`;
  compradorId = randomUUID();
  await ddb.insert(e.user).values({ id: compradorId, name: "Comprador", email: `c-${compradorId}@prueba.test`, emailVerified: true });
  const [b] = await ddb
    .insert(e.businesses)
    .values({ slug: "ciclo", nombre: "Ciclo", razonSocial: "Ciclo", rif: "J-00000000-0", rubro: "x", ciudad: "x", direccion: "x", whatsapp: "+580", vence: new Date(Date.now() + 86_400_000), estado: "activa", publicado: true })
    .returning();
  empresaId = b!.id;
  await ddb.insert(e.deliveryMethods).values({ businessId: empresaId, tipo: "retiro", detalle: "En la tienda" });
  const [p] = await ddb.insert(e.products).values({ businessId: empresaId, nombre: "Martillo", sku: "MAR", precioCent: 1000 }).returning();
  productoId = p!.id;
  const [pr] = await ddb.insert(e.presentations).values({ businessId: empresaId, productId: productoId, nombre: "Unidad", factor: 1 }).returning();
  presentacionId = pr!.id;
  const [v] = await ddb.insert(e.productVariants).values({ businessId: empresaId, productId: productoId, sku: "MAR", fisico: 10 }).returning();
  varianteId = v!.id;
  await ddb.insert(e.stockMovements).values({ businessId: empresaId, variantId: varianteId, tipo: "entrada", cantidad: 10, motivo: "Inventario inicial" });
});

afterAll(async () => {
  await dueno`truncate businesses cascade`;
  await dueno`delete from "user" where id = ${compradorId}`;
  await dueno.end();
});

describe("ciclo del pedido", () => {
  let primero = "";

  it("crear un pedido no toca el stock y recalcula el precio en el servidor", async () => {
    const r = await como(async (tx) => crearPedido(tx, (await empresaPorId(tx, empresaId))!, tasas, datos(6)));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    primero = r.id;
    expect(r.numero).toBe(1);
    const [o] = await ddb.select().from(e.orders).where(eq(e.orders.id, r.id));
    expect(o).toMatchObject({ totalCent: 6000, totalBsCent: 600000, estado: "pendiente" });
    expect(await stock()).toMatchObject({ fisico: 10, reservado: 0 });
  });

  it("no deja pedir más de lo disponible", async () => {
    const r = await como(async (tx) => crearPedido(tx, (await empresaPorId(tx, empresaId))!, tasas, datos(11)));
    expect(r).toEqual({ ok: false, error: expect.stringMatching(/Solo hay 10/) });
  });

  it("confirmar reserva la mercancía", async () => {
    expect(await como((tx) => cambiarEstado(tx, primero, "confirmado", null))).toBeNull();
    expect(await stock()).toMatchObject({ fisico: 10, reservado: 6 });
  });

  it("un segundo pedido no se confirma si lo reservado deja sin disponible", async () => {
    const r = await como(async (tx) => crearPedido(tx, (await empresaPorId(tx, empresaId))!, tasas, datos(4)));
    if (!r.ok) throw new Error(r.error);
    expect(r.numero).toBe(2);
    expect(await como((tx) => cambiarEstado(tx, r.id, "confirmado", null))).toBeNull();
    const tercero = await como(async (tx) => crearPedido(tx, (await empresaPorId(tx, empresaId))!, tasas, { ...datos(1), lineas: [{ productoId, presentacionId, cantidad: 1 }] }));
    // Disponible = 10 - 10 reservadas: el tercero ni siquiera se puede crear
    expect(tercero.ok).toBe(false);
    expect(await como((tx) => cambiarEstado(tx, r.id, "cancelado", null))).toBeNull();
    expect(await stock()).toMatchObject({ fisico: 10, reservado: 6 });
  });

  it("no permite saltarse pasos ni marcar despachado un retiro en tienda", async () => {
    expect(await como((tx) => cambiarEstado(tx, primero, "entregado", null))).toMatch(/no está permitido/);
    await como((tx) => cambiarEstado(tx, primero, "preparacion", null));
    expect(await como((tx) => cambiarEstado(tx, primero, "despachado", null))).toMatch(/retiro/);
  });

  it("listo para retiro descuenta del físico y libera la reserva; el saldo cuadra con los movimientos", async () => {
    expect(await como((tx) => cambiarEstado(tx, primero, "listo", null))).toBeNull();
    expect(await stock()).toEqual({ fisico: 4, reservado: 0, sumaMovimientos: 4 });
  });

  it("otra empresa no puede cambiar el pedido", async () => {
    const otra = randomUUID();
    const r = await app.transaction(async (tx) => {
      await tx.execute(sql`select set_config('app.rol', 'empresa', true), set_config('app.business_id', ${otra}, true)`);
      return cambiarEstado(tx as unknown as Tx, primero, "entregado", null);
    });
    expect(r).toBe("El pedido no existe.");
  });
});
