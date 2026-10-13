import { expect, test } from "@playwright/test";
import { sinDesborde, sinViolaciones } from "./ayuda";

test("la app y la base de datos responden", async ({ request }) => {
  expect((await request.get("/api/salud")).ok()).toBe(true);
  expect((await request.get("/api/salud/db")).ok()).toBe(true);
});

test("la portada carga accesible y sin desborde", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await sinViolaciones(page);
  await sinDesborde(page);
});
