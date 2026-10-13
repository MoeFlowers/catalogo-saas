import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Tasas } from "../datos/tipos";

// Mismas fuentes que Control de Deudas. En la app real esto corre en el servidor (tarea programada)
// y el historial vive en la tabla exchange_rates.
const FUENTE_DOLAR = "https://ve.dolarapi.com/v1/dolares";
const FUENTE_EUR = "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD";
const VIGENCIA_MS = 60 * 60 * 1000;

/** Valores redondos a propósito: solo se usan si las fuentes fallan, y se rotulan como demostración */
const demostracion = (): Tasas => ({ bcv: 100, usdt: 120, eur: 110, fecha: new Date().toISOString(), origen: "demostracion" });

interface EstadoTasas {
  tasas: Tasas | null;
  /** Última consulta en vivo; se conserva aunque haya una tasa manual encima */
  enVivo: Tasas | null;
  manual: Tasas | null;
  historial: Tasas[];
  cargando: boolean;
  error: boolean;
  cargar: (forzar?: boolean) => Promise<void>;
  fijarManual: (t: { bcv: number; usdt: number; eur: number | null }) => void;
  quitarManual: () => void;
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

/** Agrega al historial solo si cambió el valor o pasó una hora */
function anotar(historial: Tasas[], t: Tasas): Tasas[] {
  const ultima = historial[0];
  if (ultima && ultima.bcv === t.bcv && ultima.origen === t.origen && new Date(t.fecha).getTime() - new Date(ultima.fecha).getTime() < VIGENCIA_MS) {
    return historial;
  }
  return [t, ...historial].slice(0, 60);
}

export const useTasas = create<EstadoTasas>()(
  persist(
    (set, get) => ({
      tasas: null,
      enVivo: null,
      manual: null,
      historial: [],
      cargando: false,
      error: false,
      async cargar(forzar = false) {
        const s = get();
        if (s.cargando) return;
        if (s.manual) {
          set({ tasas: s.manual });
          if (!forzar) return;
        }
        const vigente = s.enVivo && Date.now() - new Date(s.enVivo.fecha).getTime() < VIGENCIA_MS;
        if (vigente && !forzar) {
          set({ tasas: s.manual ?? s.enVivo });
          return;
        }
        set({ cargando: true });
        try {
          const t = await consultar();
          set((x) => ({ enVivo: t, tasas: x.manual ?? t, historial: anotar(x.historial, t), error: false }));
        } catch {
          set((x) => ({ error: true, tasas: x.manual ?? x.enVivo ?? demostracion() }));
        } finally {
          set({ cargando: false });
        }
      },
      fijarManual: ({ bcv, usdt, eur }) => {
        const t: Tasas = { bcv, usdt, eur, fecha: new Date().toISOString(), origen: "manual" };
        set((x) => ({ manual: t, tasas: t, historial: anotar(x.historial, t) }));
      },
      quitarManual: () => set((x) => ({ manual: null, tasas: x.enVivo ?? demostracion() })),
    }),
    {
      name: "vitrina.tasas",
      version: 1,
      // La caché vieja del boceto guardaba solo la tasa; se empieza de nuevo
      migrate: () => ({ enVivo: null, manual: null, historial: [] }) as unknown as EstadoTasas,
      partialize: (s) => ({ enVivo: s.enVivo, manual: s.manual, historial: s.historial }),
    },
  ),
);
