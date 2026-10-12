// Contraste WCAG 2.x. La marca de cada empresa se ajusta hasta que su texto se lea a 4.5:1.

function canal(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

function luminancia(hex: string): number {
  const [r, g, b] = rgb(hex).map(canal) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contraste(a: string, b: string): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x) as [number, number];
  return (l1 + 0.05) / (l2 + 0.05);
}

function oscurecer(hex: string, factor: number): string {
  return `#${rgb(hex)
    .map((c) => Math.round(c * factor).toString(16).padStart(2, "0"))
    .join("")}`;
}

const BLANCO = "#ffffff";
const TINTA = "#0f172a";

/** Color de marca usable: texto encima legible y el color legible sobre blanco (foco, enlaces) */
export function marcaSegura(hex: string): { marca: string; texto: string; ajustado: boolean } {
  let marca = hex;
  let ajustado = false;
  while (contraste(marca, BLANCO) < 4.5) {
    marca = oscurecer(marca, 0.92);
    ajustado = true;
  }
  return { marca, texto: contraste(marca, BLANCO) >= contraste(marca, TINTA) ? BLANCO : TINTA, ajustado };
}
