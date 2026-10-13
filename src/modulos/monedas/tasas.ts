import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/lib/db";
import { exchangeRates } from "@/lib/db/esquema";
import { registro } from "@/lib/registro";
import type { Moneda, Tasas } from "@/dominio/tipos";

// Fuentes de Control de Deudas (ADR-0007). Corren en el servidor y se guardan con historial.
const FUENTE_DOLAR = "https://ve.dolarapi.com/v1/dolares";
const FUENTE_EUR = "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD";
const VIGENCIA_MS = 60 * 60 * 1000;

type MonedaTasa = Exclude<Moneda, "VES">;

async function consultarFuentes(): Promise<Record<MonedaTasa, number | null>> {
  const r = await fetch(FUENTE_DOLAR, { signal: AbortSignal.timeout(8000), cache: "no-store" });
  if (!r.ok) throw new Error(`dolarapi respondió ${r.status}`);
  const lista = (await r.json()) as { fuente?: string; promedio?: number | null }[];
  let USD: number | null = null;
  let USDT: number | null = null;
  for (const it of lista) {
    const f = (it.fuente ?? "").toLowerCase();
    if (it.promedio == null) continue;
    if (f === "oficial") USD = Number(it.promedio);
    else if (f === "paralelo") USDT = Number(it.promedio);
  }
  if (!USD) throw new Error("sin tasa oficial");
  let EUR: number | null = null;
  try {
    const fx = (await (await fetch(FUENTE_EUR, { signal: AbortSignal.timeout(8000), cache: "no-store" })).json()) as { rates?: { USD?: number } };
    if (fx.rates?.USD) EUR = Number((USD * fx.rates.USD).toFixed(4));
  } catch (e) {
    registro.warn({ err: e }, "sin paridad EUR/USD");
  }
  return { USD, USDT: USDT ?? USD, EUR };
}

async function ultima(moneda: MonedaTasa) {
  // Una tasa manual vigente manda sobre la consulta en vivo
  const [manual] = await db
    .select()
    .from(exchangeRates)
    .where(and(eq(exchangeRates.moneda, moneda), eq(exchangeRates.origen, "manual"), eq(exchangeRates.vigente, true)))
    .orderBy(desc(exchangeRates.creado))
    .limit(1);
  if (manual) return manual;
  const [vivo] = await db
    .select()
    .from(exchangeRates)
    .where(and(eq(exchangeRates.moneda, moneda), eq(exchangeRates.origen, "en_vivo")))
    .orderBy(desc(exchangeRates.creado))
    .limit(1);
  return vivo;
}

/** Consulta las fuentes y guarda una fila por moneda. Devuelve false si fallaron. */
export async function actualizarTasas(): Promise<boolean> {
  try {
    const t = await consultarFuentes();
    const filas = (Object.entries(t) as [MonedaTasa, number | null][])
      .filter(([, v]) => v != null)
      .map(([moneda, valor]) => ({ moneda, valor: String(valor), origen: "en_vivo" as const, fuente: moneda === "EUR" ? "BCV x BCE" : "ve.dolarapi.com" }));
    await db.insert(exchangeRates).values(filas);
    return true;
  } catch (e) {
    registro.error({ err: e }, "no se pudieron consultar las tasas");
    return false;
  }
}

/** Tasas del momento: renueva si la última consulta en vivo tiene más de una hora. Una vez por petición. */
export const tasasActuales = cache(async (): Promise<Tasas | null> => {
  let usd = await ultima("USD");
  if (!usd || (usd.origen === "en_vivo" && Date.now() - usd.creado.getTime() > VIGENCIA_MS)) {
    if (await actualizarTasas()) usd = await ultima("USD");
  }
  if (!usd) return null;
  const [usdt, eur] = await Promise.all([ultima("USDT"), ultima("EUR")]);
  return {
    bcv: Number(usd.valor),
    usdt: usdt ? Number(usdt.valor) : Number(usd.valor),
    eur: eur ? Number(eur.valor) : null,
    fecha: usd.creado.toISOString(),
    origen: usd.origen === "manual" ? "manual" : "en-vivo",
  };
});
