import type { Empresa } from "./tipos";

// Empresas ficticias para probar el diseño. Nombres, RIF y datos son de demostración.
export const EMPRESAS: Empresa[] = [
  {
    slug: "ferreteria-ejemplo",
    nombre: "Ferretería Ejemplo",
    razonSocial: "Ferretería Ejemplo, C.A. (demostración)",
    rif: "J-00000000-0",
    rubro: "Ferretería mayorista",
    descripcion: "Tornillería, herramientas, electricidad y plomería al mayor y al detal.",
    ciudad: "Valencia, Carabobo",
    horario: "Lunes a viernes, 8:00 a 17:00. Sábados, 8:00 a 12:00.",
    color: "#9A3412",
    monedaBase: "USD",
    pedidoMinimoCent: 5000,
    mostrarStock: "nivel",
    entregas: [
      { tipo: "retiro", detalle: "Zona industrial, galpón 4. En horario de atención.", pideDireccion: false },
      { tipo: "delivery", detalle: "Delivery propio en Valencia. Costo según la zona, se coordina por WhatsApp.", pideDireccion: true },
      { tipo: "encomienda", detalle: "Envío a todo el país por encomienda, cobro a destino.", pideDireccion: true },
    ],
    categorias: [
      { id: "tornilleria", nombre: "Tornillería" },
      { id: "herramientas", nombre: "Herramientas manuales" },
      { id: "electricidad", nombre: "Electricidad" },
      { id: "plomeria", nombre: "Plomería" },
      { id: "pinturas", nombre: "Pinturas" },
    ],
  },
  {
    slug: "textiles-ejemplo",
    nombre: "Textiles Ejemplo",
    razonSocial: "Textiles Ejemplo, C.A. (demostración)",
    rif: "J-00000000-1",
    rubro: "Ropa y uniformes al mayor",
    descripcion: "Franelas, pantalones y uniformes para empresas. Telas por metro.",
    ciudad: "Caracas",
    horario: "Lunes a sábado, 9:00 a 18:00.",
    color: "#0F5E57",
    monedaBase: "USD",
    pedidoMinimoCent: 10000,
    mostrarStock: "cantidad",
    entregas: [
      { tipo: "retiro", detalle: "Tienda en el centro. En horario de atención.", pideDireccion: false },
      { tipo: "encomienda", detalle: "Envío nacional por encomienda, cobro a destino.", pideDireccion: true },
      { tipo: "coordinar", detalle: "Otras entregas se coordinan por WhatsApp.", pideDireccion: false },
    ],
    categorias: [
      { id: "franelas", nombre: "Franelas" },
      { id: "pantalones", nombre: "Pantalones" },
      { id: "uniformes", nombre: "Uniformes" },
      { id: "telas", nombre: "Telas por metro" },
    ],
  },
];

export function empresaPorSlug(slug: string | undefined): Empresa | undefined {
  return EMPRESAS.find((e) => e.slug === slug);
}
