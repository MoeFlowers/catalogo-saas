import { defineConfig, devices } from "@playwright/test";

// Recorre la app real en un navegador. En local reutiliza `pnpm dev` si ya corre; en el CI levanta `pnpm start`.
export default defineConfig({
  testDir: "test/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://localhost:4200", trace: "retain-on-failure", locale: "es-VE" },
  projects: [
    { name: "celular", use: { ...devices["Pixel 7"] } },
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: process.env.CI ? "pnpm start" : "pnpm dev",
    url: "http://localhost:4200/api/salud",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
