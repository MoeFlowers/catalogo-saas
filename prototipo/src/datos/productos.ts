import type { Producto } from "./tipos";

type Base = Pick<Producto, "id" | "empresa" | "categoria" | "nombre" | "marca" | "sku" | "precioCent"> & Partial<Producto>;

const UNIDAD = { id: "unidad", nombre: "Unidad", factor: 1 };

function producto(p: Base): Producto {
  return {
    descripcion: "",
    unidad: "unidad",
    unidadPlural: "unidades",
    escalas: [],
    presentaciones: [UNIDAD],
    stock: 0,
    stockMinimo: 5,
    minimo: 1,
    multiplo: 1,
    bajoPedido: false,
    ...p,
  };
}

const F = "ferreteria-ejemplo";
const T = "textiles-ejemplo";

const TALLAS = ["S", "M", "L", "XL"];

function variantesTalla(sku: string, stocks: number[]) {
  return TALLAS.map((t, i) => ({ id: t.toLowerCase(), nombre: t, sku: `${sku}-${t}`, stock: stocks[i] ?? 0 }));
}

// Productos de demostración: precios y existencias ficticios para probar escalas, presentaciones y stock.
export const PRODUCTOS: Producto[] = [
  producto({
    id: "tor-38", empresa: F, categoria: "tornilleria", nombre: "Tornillo autorroscante 3/8 x 1\"", marca: "Genérica", sku: "TOR-38",
    descripcion: "Tornillo autorroscante cabeza hexagonal, acero galvanizado. Para lámina y perfiles metálicos.",
    precioCent: 9, escalas: [{ desde: 500, precioCent: 8 }, { desde: 2000, precioCent: 7 }],
    presentaciones: [{ id: "caja-100", nombre: "Caja de 100", factor: 100 }, { id: "bulto-1000", nombre: "Bulto de 1.000", factor: 1000 }],
    stock: 12000, stockMinimo: 1000, minimo: 100, multiplo: 100,
  }),
  producto({
    id: "tor-dw", empresa: F, categoria: "tornilleria", nombre: "Tornillo drywall punta fina 6 x 1\"", marca: "Genérica", sku: "TOR-DW6",
    descripcion: "Tornillo fosfatado negro para fijar láminas de yeso a perfiles.",
    precioCent: 3, escalas: [{ desde: 1000, precioCent: 2 }],
    presentaciones: [{ id: "caja-500", nombre: "Caja de 500", factor: 500 }],
    stock: 800, stockMinimo: 1000, minimo: 500, multiplo: 500,
  }),
  producto({
    id: "taco-8", empresa: F, categoria: "tornilleria", nombre: "Taco plástico de expansión 8 mm", marca: "Genérica", sku: "TAC-08",
    precioCent: 4, presentaciones: [{ id: "bolsa-100", nombre: "Bolsa de 100", factor: 100 }],
    stock: 0, minimo: 100, multiplo: 100,
  }),
  producto({
    id: "mart-16", empresa: F, categoria: "herramientas", nombre: "Martillo de uña 16 oz mango de fibra", marca: "Genérica", sku: "HER-M16",
    descripcion: "Cabeza de acero forjado, mango de fibra de vidrio con agarre de goma.",
    precioCent: 1250, escalas: [{ desde: 6, precioCent: 1150 }, { desde: 12, precioCent: 1050 }],
    presentaciones: [UNIDAD, { id: "caja-6", nombre: "Caja de 6", factor: 6 }],
    stock: 48, stockMinimo: 10,
  }),
  producto({
    id: "dest-set", empresa: F, categoria: "herramientas", nombre: "Juego de destornilladores 6 piezas", marca: "Genérica", sku: "HER-D06",
    descripcion: "Tres planos y tres estrías. Punta imantada.",
    precioCent: 890, stock: 4, stockMinimo: 5,
  }),
  producto({
    id: "cinta-5", empresa: F, categoria: "herramientas", nombre: "Cinta métrica 5 m", marca: "Genérica", sku: "HER-C05",
    precioCent: 420, escalas: [{ desde: 12, precioCent: 360 }],
    presentaciones: [UNIDAD, { id: "caja-12", nombre: "Caja de 12", factor: 12 }],
    stock: 130, stockMinimo: 24,
  }),
  producto({
    id: "alicate", empresa: F, categoria: "herramientas", nombre: "Alicate universal 8\"", marca: "Genérica", sku: "HER-A08",
    precioCent: 760, stock: 22, stockMinimo: 6,
  }),
  producto({
    id: "cable-12", empresa: F, categoria: "electricidad", nombre: "Cable THW calibre 12", marca: "Genérica", sku: "ELE-C12",
    descripcion: "Cable de cobre con aislante THW, 600 V. Se vende por metro o en rollo de 100 m.",
    unidad: "metro", unidadPlural: "metros",
    precioCent: 65, escalas: [{ desde: 100, precioCent: 55 }],
    presentaciones: [{ id: "metro", nombre: "Metro", factor: 1 }, { id: "rollo-100", nombre: "Rollo de 100 m", factor: 100 }],
    stock: 2400, stockMinimo: 300, minimo: 5,
  }),
  producto({
    id: "toma-doble", empresa: F, categoria: "electricidad", nombre: "Tomacorriente doble con tapa", marca: "Genérica", sku: "ELE-TD2",
    precioCent: 310, escalas: [{ desde: 10, precioCent: 270 }],
    presentaciones: [UNIDAD, { id: "caja-10", nombre: "Caja de 10", factor: 10 }],
    stock: 85, stockMinimo: 20,
  }),
  producto({
    id: "bombillo-led", empresa: F, categoria: "electricidad", nombre: "Bombillo LED 12 W luz blanca", marca: "Genérica", sku: "ELE-B12",
    precioCent: 180, escalas: [{ desde: 24, precioCent: 150 }],
    presentaciones: [UNIDAD, { id: "caja-24", nombre: "Caja de 24", factor: 24 }],
    stock: 300, stockMinimo: 48,
  }),
  producto({
    id: "breaker-20", empresa: F, categoria: "electricidad", nombre: "Breaker termomagnético 1 x 20 A", marca: "Genérica", sku: "ELE-BR20",
    precioCent: 690, stock: 0, bajoPedido: true,
  }),
  producto({
    id: "tubo-pvc", empresa: F, categoria: "plomeria", nombre: "Tubo PVC presión 1/2\" x 6 m", marca: "Genérica", sku: "PLO-T12",
    precioCent: 520, escalas: [{ desde: 10, precioCent: 470 }], stock: 64, stockMinimo: 10,
  }),
  producto({
    id: "codo-pvc", empresa: F, categoria: "plomeria", nombre: "Codo PVC 90° 1/2\"", marca: "Genérica", sku: "PLO-C12",
    precioCent: 35, presentaciones: [{ id: "bolsa-25", nombre: "Bolsa de 25", factor: 25 }],
    stock: 500, stockMinimo: 100, minimo: 25, multiplo: 25,
  }),
  producto({
    id: "llave-paso", empresa: F, categoria: "plomeria", nombre: "Llave de paso 1/2\" bronce", marca: "Genérica", sku: "PLO-L12",
    precioCent: 840, stock: 18, stockMinimo: 6,
  }),
  producto({
    id: "teflon", empresa: F, categoria: "plomeria", nombre: "Cinta teflón 3/4\"", marca: "Genérica", sku: "PLO-TF",
    precioCent: 45, escalas: [{ desde: 50, precioCent: 38 }],
    presentaciones: [UNIDAD, { id: "caja-50", nombre: "Caja de 50", factor: 50 }],
    stock: 400, stockMinimo: 50, minimo: 10, multiplo: 10,
  }),
  producto({
    id: "pintura-blanca", empresa: F, categoria: "pinturas", nombre: "Pintura de caucho blanca clase A", marca: "Genérica", sku: "PIN-BC1",
    unidad: "galón", unidadPlural: "galones",
    precioCent: 1890, escalas: [{ desde: 4, precioCent: 1750 }],
    presentaciones: [{ id: "galon", nombre: "Galón", factor: 1 }, { id: "cunete", nombre: "Cuñete de 4 galones", factor: 4 }],
    stock: 36, stockMinimo: 8,
  }),
  producto({
    id: "rodillo", empresa: F, categoria: "pinturas", nombre: "Rodillo de felpa 9\" con mango", marca: "Genérica", sku: "PIN-R09",
    precioCent: 390, stock: 3, stockMinimo: 6,
  }),
  producto({
    id: "brocha-3", empresa: F, categoria: "pinturas", nombre: "Brocha 3\" cerda natural", marca: "Genérica", sku: "PIN-BR3",
    precioCent: 210, escalas: [{ desde: 12, precioCent: 180 }], stock: 70, stockMinimo: 12,
  }),

  producto({
    id: "franela-algodon", empresa: T, categoria: "franelas", nombre: "Franela cuello redondo 100% algodón", marca: "Genérica", sku: "FRA-CR",
    descripcion: "Algodón peinado 180 g. Ideal para estampar. Precio por docena desde 12 unidades.",
    atributo: "Talla", variantes: variantesTalla("FRA-CR", [40, 96, 120, 0]),
    precioCent: 450, escalas: [{ desde: 12, precioCent: 390 }, { desde: 60, precioCent: 350 }],
    presentaciones: [UNIDAD, { id: "docena", nombre: "Docena", factor: 12 }],
    stockMinimo: 24, minimo: 6,
  }),
  producto({
    id: "chemise", empresa: T, categoria: "franelas", nombre: "Chemise piqué con cuello", marca: "Genérica", sku: "FRA-CH",
    descripcion: "Tela piqué 200 g, tres botones. Se puede bordar el logo de la empresa.",
    atributo: "Talla", variantes: variantesTalla("FRA-CH", [12, 30, 28, 8]),
    precioCent: 780, escalas: [{ desde: 12, precioCent: 690 }],
    presentaciones: [UNIDAD, { id: "docena", nombre: "Docena", factor: 12 }],
    stockMinimo: 12,
  }),
  producto({
    id: "franela-dryfit", empresa: T, categoria: "franelas", nombre: "Franela deportiva dry fit", marca: "Genérica", sku: "FRA-DF",
    atributo: "Talla", variantes: variantesTalla("FRA-DF", [0, 0, 0, 0]),
    precioCent: 520, bajoPedido: true, stockMinimo: 12,
  }),
  producto({
    id: "jean-trabajo", empresa: T, categoria: "pantalones", nombre: "Jean de trabajo 14 oz", marca: "Genérica", sku: "PAN-JT",
    descripcion: "Denim grueso con costuras reforzadas. Tallas 28 a 40.",
    atributo: "Talla",
    variantes: ["28", "30", "32", "34", "36", "38", "40"].map((t, i) => ({ id: t, nombre: t, sku: `PAN-JT-${t}`, stock: [6, 20, 34, 30, 18, 4, 0][i] ?? 0 })),
    precioCent: 1450, escalas: [{ desde: 12, precioCent: 1290 }], stockMinimo: 6,
  }),
  producto({
    id: "pantalon-gabardina", empresa: T, categoria: "pantalones", nombre: "Pantalón de gabardina caqui", marca: "Genérica", sku: "PAN-GC",
    atributo: "Talla", variantes: ["30", "32", "34", "36"].map((t, i) => ({ id: t, nombre: t, sku: `PAN-GC-${t}`, stock: [10, 14, 9, 5][i] ?? 0 })),
    precioCent: 1180, stockMinimo: 6,
  }),
  producto({
    id: "braga-industrial", empresa: T, categoria: "uniformes", nombre: "Braga industrial manga larga", marca: "Genérica", sku: "UNI-BI",
    descripcion: "Drill 100% algodón, cierre frontal, cintas reflectivas opcionales por pedido.",
    atributo: "Talla", variantes: variantesTalla("UNI-BI", [8, 22, 25, 14]),
    precioCent: 2200, escalas: [{ desde: 10, precioCent: 1980 }], stockMinimo: 10,
  }),
  producto({
    id: "bata-medica", empresa: T, categoria: "uniformes", nombre: "Bata de laboratorio unisex", marca: "Genérica", sku: "UNI-BL",
    atributo: "Talla", variantes: variantesTalla("UNI-BL", [5, 11, 7, 2]),
    precioCent: 1350, stockMinimo: 6,
  }),
  producto({
    id: "chaleco-reflectivo", empresa: T, categoria: "uniformes", nombre: "Chaleco reflectivo con bolsillos", marca: "Genérica", sku: "UNI-CR",
    precioCent: 650, escalas: [{ desde: 20, precioCent: 560 }], stock: 140, stockMinimo: 20,
  }),
  producto({
    id: "tela-drill", empresa: T, categoria: "telas", nombre: "Tela drill azul marino", marca: "Genérica", sku: "TEL-DR",
    descripcion: "Ancho 1,50 m. Para uniformes y bragas. Mínimo 3 metros.",
    unidad: "metro", unidadPlural: "metros",
    precioCent: 390, escalas: [{ desde: 50, precioCent: 340 }],
    presentaciones: [{ id: "metro", nombre: "Metro", factor: 1 }, { id: "rollo-50", nombre: "Rollo de 50 m", factor: 50 }],
    stock: 620, stockMinimo: 100, minimo: 3,
  }),
  producto({
    id: "tela-algodon", empresa: T, categoria: "telas", nombre: "Tela de algodón jersey blanca", marca: "Genérica", sku: "TEL-JB",
    unidad: "metro", unidadPlural: "metros",
    precioCent: 310, presentaciones: [{ id: "metro", nombre: "Metro", factor: 1 }],
    stock: 45, stockMinimo: 60, minimo: 3,
  }),
];

export function productosDe(empresa: string): Producto[] {
  return PRODUCTOS.filter((p) => p.empresa === empresa);
}

export function productoPorId(id: string | undefined): Producto | undefined {
  return PRODUCTOS.find((p) => p.id === id);
}
