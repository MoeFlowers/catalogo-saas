import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Auditoría WCAG 2.2 AA en la página actual: cualquier violación hace fallar la prueba */
export async function sinViolaciones(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]).analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
}

/** Sin desplazamiento horizontal: el ancho de la página no supera la pantalla */
export async function sinDesborde(page: Page) {
  const { ancho, pantalla } = await page.evaluate(() => ({ ancho: document.documentElement.scrollWidth, pantalla: window.innerWidth }));
  expect(ancho).toBeLessThanOrEqual(pantalla);
}
