import "server-only";
import { z } from "zod";

// Se valida una vez al arrancar el servidor: si falta algo, la app no levanta y dice qué.
const esquema = z.object({
  APP_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  APP_URL: z.url(),
  DATABASE_URL: z.string().startsWith("postgres"),
  DATABASE_OWNER_URL: z.string().startsWith("postgres").optional(),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET debe tener al menos 32 caracteres"),
  ADMIN_EMAILS: z
    .string()
    .default("")
    .transform((v) =>
      v
        .split(",")
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean),
    ),
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().int().default(1025),
  SMTP_FROM: z.string().default("Vitrina <no-responder@vitrina.test>"),
  S3_ENDPOINT: z.url(),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_PUBLIC_URL: z.url(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof esquema>;

function cargar(): Env {
  const r = esquema.safeParse(process.env);
  if (!r.success) {
    const detalle = r.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Variables de entorno inválidas. Revisa tu .env (plantilla en .env.example):\n${detalle}`);
  }
  return r.data;
}

export const env = cargar();

export const googleActivo = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
