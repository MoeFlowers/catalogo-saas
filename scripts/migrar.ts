// Aplica las migraciones de drizzle/ con el dueño del esquema. Uso: pnpm db:migrar [--test]
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const url = process.argv.includes("--test") ? process.env.DATABASE_TEST_URL : process.env.DATABASE_OWNER_URL;
if (!url) throw new Error("Falta DATABASE_OWNER_URL (o DATABASE_TEST_URL con --test) en .env");

const cliente = postgres(url, { max: 1, onnotice: () => {} });
await migrate(drizzle(cliente), { migrationsFolder: "drizzle" });
await cliente.end();
console.log(`Migraciones aplicadas en ${new URL(url).pathname.slice(1)}`);
