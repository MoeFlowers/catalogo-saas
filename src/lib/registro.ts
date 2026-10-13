import "server-only";
import pino from "pino";

/** Registro estructurado del servidor. En desarrollo, nivel debug; en producción, info. */
export const registro = pino({
  level: process.env.APP_ENV === "production" ? "info" : "debug",
  base: { app: "vitrina" },
  // Nunca registrar secretos ni datos de sesión
  redact: ["*.password", "*.clave", "*.token", "*.secret", "headers.cookie", "headers.authorization"],
});
