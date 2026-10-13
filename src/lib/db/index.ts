import "server-only";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";
import * as esquema from "./esquema";

// Un solo pool por proceso: en desarrollo, Next recarga módulos y sin esto abriría conexiones de más
const global_ = globalThis as unknown as { __pgVitrina?: ReturnType<typeof postgres> };
const cliente = (global_.__pgVitrina ??= postgres(env.DATABASE_URL, { max: 10, idle_timeout: 30 }));

export const db = drizzle(cliente, { schema: esquema });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/**
 * Quién actúa en una operación. PostgreSQL lo lee con current_setting() en las políticas de seguridad
 * por fila (migración 0001): aunque el código olvide un filtro, la base no entrega datos de otra empresa.
 *   empresa:   usuario del panel; ve solo su business_id
 *   publico:   visitante de un catálogo; solo lee catálogos activos y publicados
 *   comprador: ve sus propios pedidos
 *   admin:     equipo de Vitrina
 *   sistema:   tareas internas de confianza (registro, invitaciones, tareas programadas)
 */
export interface Contexto {
  rol: "empresa" | "publico" | "comprador" | "admin" | "sistema";
  businessId?: string;
  userId?: string;
  /** Token de un enlace público de pedido */
  token?: string;
}

export async function conContexto<T>(ctx: Contexto, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    // set_config(..., true) vale solo para esta transacción: no se filtra a la siguiente que use la conexión
    await tx.execute(
      sql`select set_config('app.rol', ${ctx.rol}, true), set_config('app.business_id', ${ctx.businessId ?? ""}, true), set_config('app.user_id', ${ctx.userId ?? ""}, true), set_config('app.token', ${ctx.token ?? ""}, true)`,
    );
    return fn(tx);
  });
}
