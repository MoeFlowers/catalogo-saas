// Borra todo el esquema y lo vuelve a crear. Solo para desarrollo y pruebas. Uso: pnpm db:reiniciar [--test]
import postgres from "postgres";

const url = process.argv.includes("--test") ? process.env.DATABASE_TEST_URL : process.env.DATABASE_OWNER_URL;
if (!url) throw new Error("Falta DATABASE_OWNER_URL (o DATABASE_TEST_URL con --test) en .env");
if (process.env.APP_ENV === "production") throw new Error("db:reiniciar no corre en producción");

const cliente = postgres(url, { max: 1, onnotice: () => {} });
await cliente.unsafe("DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT USAGE ON SCHEMA public TO app_runtime;");
await cliente.end();
console.log(`Esquema borrado en ${new URL(url).pathname.slice(1)}. Corre pnpm db:migrar${process.argv.includes("--test") ? " --test" : ""}.`);
