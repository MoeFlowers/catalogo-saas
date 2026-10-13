// ADR-0002: el aislamiento entre empresas se prueba contra PostgreSQL real con el rol de la app.
// Si alguna de estas pruebas falla, es un defecto que bloquea la publicación.
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const dueno = postgres(process.env.DATABASE_TEST_URL!, { max: 1, onnotice: () => {} });
const app = postgres(process.env.DATABASE_TEST_RUNTIME_URL!, { max: 1, onnotice: () => {} });

let empresaA = "";
let empresaB = "";
let borrador = "";

/** Ejecuta consultas como lo hace la app: dentro de una transacción con el contexto declarado */
async function como<T>(ctx: { rol: string; business?: string; user?: string; token?: string }, fn: (sql: postgres.TransactionSql) => Promise<T>): Promise<T> {
  return (await app.begin(async (sql) => {
    await sql`select set_config('app.rol', ${ctx.rol}, true), set_config('app.business_id', ${ctx.business ?? ""}, true),
                     set_config('app.user_id', ${ctx.user ?? ""}, true), set_config('app.token', ${ctx.token ?? ""}, true)`;
    return fn(sql);
  })) as T;
}

async function empresa(slug: string, estado: string, publicado: boolean): Promise<string> {
  const [fila] = await dueno`
    insert into businesses (slug, nombre, razon_social, rif, rubro, ciudad, direccion, whatsapp, vence, estado, publicado)
    values (${slug}, ${slug}, ${slug}, 'J-00000000-0', 'prueba', 'Valencia', 'Dirección de prueba', '+580000000000', now() + interval '30 days', ${estado}, ${publicado})
    returning id`;
  await dueno`insert into products (business_id, nombre, sku, precio_cent) values (${fila!.id}, ${"Producto de " + slug}, ${"SKU-" + slug}, 100)`;
  return fila!.id as string;
}

beforeAll(async () => {
  await dueno`truncate businesses cascade`;
  empresaA = await empresa("empresa-a", "activa", true);
  empresaB = await empresa("empresa-b", "activa", true);
  borrador = await empresa("empresa-en-revision", "en_revision", false);
});

afterAll(async () => {
  await dueno`truncate businesses cascade`;
  await dueno.end();
  await app.end();
});

describe("seguridad por fila", () => {
  it("el rol de la app no es superusuario ni puede saltarse RLS", async () => {
    const [r] = await app`select rolsuper, rolbypassrls from pg_roles where rolname = current_user`;
    expect(r).toEqual({ rolsuper: false, rolbypassrls: false });
  });

  it("sin contexto declarado no se ve ningún producto", async () => {
    const filas = await app`select id from products`;
    expect(filas).toHaveLength(0);
  });

  it("una empresa solo ve sus productos", async () => {
    const filas = await como({ rol: "empresa", business: empresaA }, (sql) => sql`select business_id from products`);
    expect(filas.map((f) => f.business_id)).toEqual([empresaA]);
  });

  it("una empresa no puede escribir filas de otra", async () => {
    await expect(
      como({ rol: "empresa", business: empresaA }, (sql) => sql`insert into products (business_id, nombre, sku, precio_cent) values (${empresaB}, 'intruso', 'X-1', 100)`),
    ).rejects.toThrow(/row-level security/);
  });

  it("una empresa no puede modificar productos de otra: la actualización no toca filas", async () => {
    const r = await como({ rol: "empresa", business: empresaA }, (sql) => sql`update products set precio_cent = 1 where business_id = ${empresaB}`);
    expect(r.count).toBe(0);
  });

  it("el público ve catálogos activos y publicados, no los que están en revisión", async () => {
    const filas = await como({ rol: "publico" }, (sql) => sql`select business_id from products`);
    const empresas = new Set(filas.map((f) => f.business_id));
    expect(empresas.has(empresaA)).toBe(true);
    expect(empresas.has(empresaB)).toBe(true);
    expect(empresas.has(borrador)).toBe(false);
  });

  it("el público no puede escribir", async () => {
    await expect(
      como({ rol: "publico" }, (sql) => sql`insert into products (business_id, nombre, sku, precio_cent) values (${empresaA}, 'intruso', 'X-2', 100)`),
    ).rejects.toThrow(/row-level security/);
  });

  it("el registro de movimientos de inventario no se puede editar ni borrar", async () => {
    await expect(como({ rol: "sistema" }, (sql) => sql`delete from stock_movements`)).rejects.toThrow(/permission denied/);
  });

  it("el contexto no se filtra a la siguiente transacción", async () => {
    await como({ rol: "empresa", business: empresaA }, (sql) => sql`select 1`);
    const filas = await app`select id from products`;
    expect(filas).toHaveLength(0);
  });
});
