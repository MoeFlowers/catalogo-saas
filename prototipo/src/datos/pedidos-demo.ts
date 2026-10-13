import { aItem, calcularLinea } from "../lib/pedido";
import type { Empresa, EstadoPedido, LineaPedido, Pedido, Producto, Tasas } from "./tipos";

// Pedidos de demostración para que el historial del comprador y el panel de la empresa no arranquen
// vacíos. Usan una tasa redonda de prueba y clientes sin nombres reales; la interfaz los rotula.
const TASA_DEMO = 100;

/** Correo con el que nacen los pedidos que se le asignan al comprador del boceto al entrar */
export const CORREO_SEMILLA = "comprador@ejemplo.test";

function hace(dias: number, horas = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(d.getHours() - horas);
  return d.toISOString();
}

interface Semilla {
  empresa: string;
  numero: number;
  dias: number;
  estados: EstadoPedido[];
  lineas: LineaPedido[];
  entrega: Pedido["entrega"];
  destino: string;
  cliente: string;
  correo: string;
  delComprador?: boolean;
  /** Si el comprador llegó a abrir WhatsApp con el pedido */
  abrioWhatsapp?: boolean;
}

const SEMILLAS: Semilla[] = [
  {
    empresa: "ferreteria-ejemplo", numero: 35, dias: 14, estados: ["pendiente", "confirmado", "preparacion", "despachado", "entregado"],
    lineas: [
      { productoId: "cable-12", presentacionId: "rollo-100", cantidad: 2 },
      { productoId: "toma-doble", presentacionId: "caja-10", cantidad: 3 },
    ],
    entrega: "delivery", destino: "Zona industrial norte", cliente: "Cliente de prueba A", correo: "cliente-a@ejemplo.test", abrioWhatsapp: true,
  },
  {
    empresa: "ferreteria-ejemplo", numero: 36, dias: 2, estados: ["pendiente", "confirmado", "preparacion"],
    lineas: [
      { productoId: "pintura-blanca", presentacionId: "cunete", cantidad: 3 },
      { productoId: "rodillo", presentacionId: "unidad", cantidad: 2 },
      { productoId: "brocha-3", presentacionId: "unidad", cantidad: 12 },
    ],
    entrega: "retiro", destino: "", cliente: "Cliente de prueba B", correo: "cliente-b@ejemplo.test", abrioWhatsapp: true,
  },
  {
    empresa: "ferreteria-ejemplo", numero: 37, dias: 1, estados: ["pendiente", "confirmado"],
    lineas: [
      { productoId: "tubo-pvc", presentacionId: "unidad", cantidad: 10 },
      { productoId: "codo-pvc", presentacionId: "bolsa-25", cantidad: 4 },
      { productoId: "llave-paso", presentacionId: "unidad", cantidad: 6 },
    ],
    entrega: "encomienda", destino: "Maracay", cliente: "Cliente de prueba C", correo: "cliente-c@ejemplo.test", abrioWhatsapp: true,
  },
  {
    empresa: "ferreteria-ejemplo", numero: 38, dias: 21, estados: ["pendiente", "confirmado", "preparacion", "despachado", "entregado"],
    lineas: [
      { productoId: "tor-38", presentacionId: "caja-100", cantidad: 5 },
      { productoId: "mart-16", presentacionId: "caja-6", cantidad: 1 },
      { productoId: "teflon", presentacionId: "caja-50", cantidad: 1 },
    ],
    entrega: "encomienda", destino: "Barquisimeto", cliente: "Comprador de prueba", correo: CORREO_SEMILLA, delComprador: true,
  },
  {
    empresa: "ferreteria-ejemplo", numero: 39, dias: 0, estados: ["pendiente"],
    lineas: [
      { productoId: "tor-dw", presentacionId: "caja-500", cantidad: 1 },
      { productoId: "dest-set", presentacionId: "unidad", cantidad: 2 },
      { productoId: "alicate", presentacionId: "unidad", cantidad: 3 },
    ],
    entrega: "retiro", destino: "", cliente: "Cliente de prueba D", correo: "cliente-d@ejemplo.test",
  },
  {
    empresa: "textiles-ejemplo", numero: 36, dias: 4, estados: ["pendiente"],
    lineas: [{ productoId: "chaleco-reflectivo", presentacionId: "unidad", cantidad: 20 }],
    entrega: "encomienda", destino: "Puerto Ordaz", cliente: "Cliente de prueba E", correo: "cliente-e@ejemplo.test",
  },
  {
    empresa: "textiles-ejemplo", numero: 37, dias: 3, estados: ["pendiente", "confirmado", "preparacion", "despachado"],
    lineas: [{ productoId: "braga-industrial", varianteId: "l", presentacionId: "unidad", cantidad: 10 }],
    entrega: "encomienda", destino: "Valencia", cliente: "Cliente de prueba F", correo: "cliente-f@ejemplo.test", abrioWhatsapp: true,
  },
  {
    empresa: "textiles-ejemplo", numero: 40, dias: 6, estados: ["pendiente", "confirmado"],
    lineas: [
      { productoId: "franela-algodon", varianteId: "m", presentacionId: "docena", cantidad: 2 },
      { productoId: "franela-algodon", varianteId: "l", presentacionId: "docena", cantidad: 2 },
    ],
    entrega: "retiro", destino: "", cliente: "Comprador de prueba", correo: CORREO_SEMILLA, delComprador: true,
  },
];

export function pedidosSemilla(empresas: Empresa[], productos: Producto[]): Pedido[] {
  return SEMILLAS.map((s) => {
    const empresa = empresas.find((e) => e.slug === s.empresa)!;
    const fecha = hace(s.dias, 3);
    const tasas: Tasas = { bcv: TASA_DEMO, usdt: TASA_DEMO, eur: null, fecha, origen: "demostracion" };
    const items = s.lineas.map((l) => aItem(calcularLinea(l, empresa, tasas, productos)!));
    return {
      id: `${s.empresa}-${s.numero}`,
      numero: s.numero,
      empresa: s.empresa,
      fecha,
      estado: s.estados[s.estados.length - 1]!,
      historial: s.estados.map((estado, i) => ({ estado, fecha: hace(Math.max(0, s.dias - i), 3 - i) })),
      items,
      moneda: empresa.monedaBase,
      tasa: TASA_DEMO,
      fechaTasa: fecha,
      totalCent: items.reduce((t, i) => t + i.totalCent, 0),
      totalBsCent: items.reduce((t, i) => t + i.totalBsCent, 0),
      entrega: s.entrega,
      destino: s.destino,
      nota: "",
      comprador: { nombre: s.cliente, telefono: "", documento: "" },
      compradorCorreo: s.correo,
      demostracion: true,
      semillaComprador: s.delComprador,
      whatsappAbierto: s.abrioWhatsapp || s.delComprador ? hace(s.dias, 2) : undefined,
    };
  });
}
