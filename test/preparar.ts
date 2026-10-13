import { loadEnvFile } from "node:process";

// Variables de .env para las pruebas; en el CI vienen del entorno del job
try {
  loadEnvFile(".env");
} catch {
  /* sin .env: el CI define las variables */
}
