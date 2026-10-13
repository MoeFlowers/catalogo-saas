import next from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...next,
  ...nextTs,
  { ignores: [".next/**", "prototipo/**", "drizzle/**", "node_modules/**", "next-env.d.ts"] },
  {
    rules: {
      // Límites entre módulos (ADR-0001): un módulo solo usa lo que otro exporta en su index
      "no-restricted-imports": ["error", { patterns: [{ group: ["@/modulos/*/*"], message: "Importa desde el index del módulo, no sus archivos internos." }] }],
    },
  },
];

export default config;
