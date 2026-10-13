import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { registro } from "@/lib/registro";

export const dynamic = "force-dynamic";

// Listo: la base responde con el rol de la app
export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ estado: "ok" });
  } catch (e) {
    registro.error({ err: e }, "la base de datos no responde");
    return Response.json({ estado: "sin-base-de-datos" }, { status: 503 });
  }
}
