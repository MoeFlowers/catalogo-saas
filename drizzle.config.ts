import { defineConfig } from "drizzle-kit";

// Las migraciones corren con el dueño del esquema; la app, con app_runtime (ver .env.example)
export default defineConfig({
  schema: "./src/lib/db/esquema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_OWNER_URL ?? "" },
  strict: true,
  verbose: false,
});
