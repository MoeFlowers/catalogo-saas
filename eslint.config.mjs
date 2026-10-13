import next from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// La frontera servidor/navegador la hace cumplir el paquete server-only al compilar: un archivo de
// servidor importado desde un componente de cliente rompe el build.
const config = [
  ...next,
  ...nextTs,
  { ignores: [".next/**", "prototipo/**", "drizzle/**", "node_modules/**", "next-env.d.ts"] },
];

export default config;
