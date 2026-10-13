// Presupuesto de rendimiento: lo que descarga la primera visita al catálogo (el HTML pide el script
// de entrada, sus módulos precargados y la hoja de estilos). Si se pasa, el build falla en el CI.
// Límites pensados para un celular de gama baja con datos móviles; idea tomada de
// https://github.com/pajaydev/awesome-web-performance-budget
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const LIMITES_KB = { js: 140, css: 12 };
const dist = new URL("../dist/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

if (!existsSync(join(dist, "index.html"))) {
  console.error("No hay build: corre pnpm build antes del presupuesto.");
  process.exit(1);
}

const html = readFileSync(join(dist, "index.html"), "utf8");
const rutas = (patron) => [...html.matchAll(patron)].map((m) => m[1].replace(/^\.\//, ""));
const archivos = {
  js: [...rutas(/<script[^>]+src="([^"]+)"/g), ...rutas(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)],
  css: rutas(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g),
};

let excedido = false;
for (const [tipo, lista] of Object.entries(archivos)) {
  const kb = lista.reduce((t, f) => t + gzipSync(readFileSync(join(dist, f))).length, 0) / 1024;
  const limite = LIMITES_KB[tipo];
  const ok = kb <= limite;
  if (!ok) excedido = true;
  console.log(`${ok ? "ok    " : "EXCEDE"} ${tipo.toUpperCase()} inicial: ${kb.toFixed(1)} KB gzip de ${limite} KB (${lista.length} archivos)`);
}

if (excedido) {
  console.error("Presupuesto excedido. Revisa qué entró al paquete inicial o carga esa parte con lazy.");
  process.exit(1);
}
