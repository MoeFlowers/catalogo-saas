import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    exclude: ["test/e2e/**", "prototipo/**", "node_modules/**"],
    environment: "node",
    // Las pruebas de integración comparten la base vitrina_test: una a la vez
    fileParallelism: false,
    setupFiles: ["./test/preparar.ts"],
  },
});
