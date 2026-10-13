import type { Empresa, Miembro } from "./tipos";

function haceDias(n: number): string {
  return enDias(-n);
}

function enDias(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

// Quien entra al panel en el boceto es el dueño; el resto del equipo son cuentas de prueba sin nombres reales
const equipo = (dominio: string): Miembro[] => [
  { correo: `dueno@${dominio}`, nombre: "Cuenta de prueba", rol: "dueno", estado: "activo" },
  { correo: `ventas@${dominio}`, nombre: "Vendedor de prueba", rol: "vendedor", estado: "activo" },
];

// Empresas ficticias para probar el diseño. Nombres, RIF y datos son de demostración.
export const EMPRESAS_SEMILLA: Empresa[] = [
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
    whatsapp: "",
    publicado: true,
    plan: "negocio",
    vence: enDias(18),
    equipo: equipo("ferreteria-ejemplo.test"),
    diasCancelacion: 3,
    estado: "activa",
    creada: haceDias(40),
    direccion: "Zona industrial, galpón 4, Valencia",
    redes: "",
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
    whatsapp: "",
    publicado: true,
    plan: "inicial",
    vence: enDias(5),
    equipo: equipo("textiles-ejemplo.test").slice(0, 1),
    diasCancelacion: 5,
    estado: "activa",
    creada: haceDias(25),
    direccion: "Centro, Caracas",
    redes: "",
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
  // Solicitudes de registro esperando la aprobación de Vitrina: sin productos todavía
  solicitud("repuestos-ejemplo", "Repuestos Ejemplo", "Repuestos automotrices al mayor", "Barquisimeto, Lara", "J-00000000-2", 1),
  solicitud("distribuidora-ejemplo", "Distribuidora Ejemplo", "Víveres y artículos de limpieza al mayor", "Maracaibo, Zulia", "J-00000000-3", 0),
];

function solicitud(slug: string, nombre: string, rubro: string, ciudad: string, rif: string, dias: number): Empresa {
  return {
    slug,
    nombre,
    razonSocial: `${nombre}, C.A. (demostración)`,
    rif,
    rubro,
    descripcion: rubro + ".",
    ciudad,
    horario: "Lunes a viernes, 8:00 a 17:00.",
    color: "#1E3A8A",
    monedaBase: "USD",
    pedidoMinimoCent: 0,
    mostrarStock: "nivel",
    entregas: [{ tipo: "coordinar", detalle: "Se coordina por WhatsApp.", pideDireccion: false }],
    categorias: [],
    whatsapp: "",
    publicado: false,
    plan: "inicial",
    vence: enDias(30),
    equipo: [{ correo: `dueno@${slug}.test`, nombre: "Cuenta de prueba", rol: "dueno", estado: "activo" }],
    diasCancelacion: 3,
    estado: "en-revision",
    creada: haceDias(dias),
    direccion: ciudad,
    redes: "",
  };
}
