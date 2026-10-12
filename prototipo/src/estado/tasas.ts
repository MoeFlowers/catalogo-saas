import { create } from "zustand";
import type { Tasas } from "../datos/tipos";

// Mismas fuentes que Control de Deudas. En la app real esto corre en el servidor y guarda historial.
const FUENTE_DOLAR = "https://ve.dolarapi.com/v1/dolares";
const FUENTE_EUR = "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD";
const CACHE = "vitrina.tasas";
const VIGENCIA_MS = 60 * 60 * 1000;

/** Valores redondos a propósito: solo se usan si las fuentes fallan, y se rotulan como demostración */
const DEMOSTRACION: Tasas = { bcv: 100, usdt: 120, eur: 110, fecha: new Date().toISOString(), origen: "demostracion" };

interface EstadoTasas {
  tasas: Tasas | null;
  cargando: boolean;
  cargar: () => Promise<void>;
}

function leerCache(): Tasas | null {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE) ?? "null") as Tasas | null;
    if (c && Date.now() - new Date(c.fecha).getTime() < VIGENCIA_MS) return c;
  } catch {
    /* sin almacenamiento: se consulta de nuevo */
  }
  return null;
}

async function consultar(): Promise<Tasas> {
  const lista = (await (await fetch(FUENTE_DOLAR)).json()) as { fuente?: string; promedio?: number }[];
  let bcv: number | null = null;
  let usdt: number | null = null;
  for (const it of lista) {
    const f = (it.fuente ?? "").toLowerCase();
    if (it.promedio == null) continue;
    if (f === "oficial") bcv = +it.promedio;
    else if (f === "paralelo") usdt = +it.promedio;
  }
  if (!bcv) throw new Error("sin tasa oficial");
  let eur: number | null = null;
  try {
    const fx = (await (await fetch(FUENTE_EUR)).json()) as { rates?: { USD?: number } };
    if (fx.rates?.USD) eur = +(bcv * fx.rates.USD).toFixed(4);
  } catch {
    /* EUR es opcional: sin paridad no se convierte */
  }
  return { bcv, usdt: usdt ?? bcv, eur, fecha: new Date().toISOString(), origen: "en-vivo" };
}

export const useTasas = create<EstadoTasas>((set, get) => ({
  tasas: leerCache(),
  cargando: false,
  async cargar() {
    if (get().tasas || get().cargando) return;
    set({ cargando: true });
    try {
      const t = await consultar();
      try {
        localStorage.setItem(CACHE, JSON.stringify(t));
      } catch {
        /* sin almacenamiento */
      }
      set({ tasas: t });
    } catch {
      set({ tasas: DEMOSTRACION });
    } finally {
      set({ cargando: false });
    }
  },
}));
