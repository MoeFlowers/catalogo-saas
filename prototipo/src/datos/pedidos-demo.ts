import { aItem, calcularLinea } from "../lib/pedido";
import { EMPRESAS } from "./empresas";
import type { EstadoPedido, LineaPedido, Pedido, Tasas } from "./tipos";

// Pedidos viejos de demostración para que el historial del comprador no arranque vacío.
// Usan una tasa redonda de demostración y se rotulan como tales en la interfaz.
const TASA_DEMO = 100;

function dias(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10, 30, 0, 0);
  return d.toISOString();
}

function pedido(
  empresaSlug: string,
  numero: number,
  haceDias: number,
  estados: EstadoPedido[],
  lineas: LineaPedido[],
  entrega: Pedido["entrega"],
  destino: string,
): Pedido {
  const empresa = EMPRESAS.find((e) => e.slug === empresaSlug)!;
  const fecha = dias(haceDias);
  const tasas: Tasas = { bcv: TASA_DEMO, usdt: TASA_DEMO, eur: null, fecha, origen: "demostracion" };
  const items = lineas.map((l) => aItem(calcularLinea(l, empresa, tasas)!));
  return {
    id: `${empresaSlug}-${numero}`,
    numero,
    empresa: empresaSlug,
    fecha,
    estado: estados[estados.length - 1]!,
    historial: estados.map((estado, i) => ({ estado, fecha: dias(haceDias - i) })),
    items,
    moneda: empresa.monedaBase,
    tasa: TASA_DEMO,
    fechaTasa: fecha,
    totalCent: items.reduce((s, i) => s + i.totalCent, 0),
    totalBsCent: items.reduce((s, i) => s + i.totalBsCent, 0),
    entrega,
    destino,
    nota: "",
    comprador: { nombre: "Comprador de prueba", telefono: "", documento: "" },
    demostracion: true,
  };
}

export function pedidosDemostracion(): Pedido[] {
  return [
    pedido(
      "ferreteria-ejemplo",
      38,
      21,
      ["pendiente", "confirmado", "preparacion", "despachado", "entregado"],
      [
        { productoId: "tor-38", presentacionId: "caja-100", cantidad: 5 },
        { productoId: "mart-16", presentacionId: "caja-6", cantidad: 1 },
        { productoId: "teflon", presentacionId: "caja-50", cantidad: 1 },
      ],
      "encomienda",
      "Barquisimeto",
    ),
    pedido(
      "textiles-ejemplo",
      40,
      6,
      ["pendiente", "confirmado"],
      [
        { productoId: "franela-algodon", varianteId: "m", presentacionId: "docena", cantidad: 2 },
        { productoId: "franela-algodon", varianteId: "l", presentacionId: "docena", cantidad: 2 },
      ],
      "retiro",
      "",
    ),
  ];
}
