export type Moneda = "VES" | "USD" | "EUR" | "USDT";

export type TipoEntrega = "retiro" | "delivery" | "encomienda" | "coordinar";

export interface MetodoEntrega {
  tipo: TipoEntrega;
  detalle: string;
  /** Si pide dirección o ciudad de destino al comprador */
  pideDireccion: boolean;
}

export interface Categoria {
  id: string;
  nombre: string;
}

export interface Empresa {
  slug: string;
  nombre: string;
  razonSocial: string;
  rif: string;
  rubro: string;
  descripcion: string;
  ciudad: string;
  horario: string;
  color: string;
  monedaBase: Moneda;
  /** En céntimos de la moneda base */
  pedidoMinimoCent: number;
  mostrarStock: "cantidad" | "nivel" | "oculto";
  entregas: MetodoEntrega[];
  categorias: Categoria[];
}

/** Precio unitario desde una cantidad de unidades base */
export interface Escala {
  desde: number;
  precioCent: number;
}

/** Cómo se vende: unidad, caja de 100, bulto de 12. factor = unidades base por presentación */
export interface Presentacion {
  id: string;
  nombre: string;
  factor: number;
}

export interface Variante {
  id: string;
  nombre: string;
  sku: string;
  stock: number;
}

export interface Producto {
  id: string;
  empresa: string;
  categoria: string;
  nombre: string;
  marca: string;
  sku: string;
  descripcion: string;
  /** Unidad base en singular: "unidad", "metro", "galón" */
  unidad: string;
  unidadPlural: string;
  /** Precio unitario base en céntimos de la moneda base de la empresa */
  precioCent: number;
  escalas: Escala[];
  presentaciones: Presentacion[];
  atributo?: string;
  variantes?: Variante[];
  /** Stock en unidades base cuando no hay variantes */
  stock: number;
  stockMinimo: number;
  /** Cantidad mínima y múltiplo de venta, en unidades base */
  minimo: number;
  multiplo: number;
  bajoPedido: boolean;
}

export interface LineaPedido {
  productoId: string;
  varianteId?: string;
  presentacionId: string;
  /** Cantidad de presentaciones */
  cantidad: number;
}

export type EstadoPedido =
  | "pendiente"
  | "confirmado"
  | "preparacion"
  | "listo"
  | "despachado"
  | "entregado"
  | "cancelado";

/** Copia fija de una línea al momento de pedir */
export interface ItemPedido {
  productoId: string;
  varianteId?: string;
  presentacionId: string;
  nombre: string;
  detalle: string;
  sku: string;
  cantidad: number;
  unidadesBase: number;
  precioUnitCent: number;
  totalCent: number;
  totalBsCent: number;
}

export interface Tasas {
  bcv: number;
  usdt: number;
  eur: number | null;
  fecha: string;
  origen: "en-vivo" | "demostracion";
}

export interface Pedido {
  id: string;
  numero: number;
  empresa: string;
  fecha: string;
  estado: EstadoPedido;
  historial: { estado: EstadoPedido; fecha: string }[];
  items: ItemPedido[];
  moneda: Moneda;
  tasa: number;
  fechaTasa: string;
  totalCent: number;
  totalBsCent: number;
  entrega: TipoEntrega;
  destino: string;
  nota: string;
  comprador: { nombre: string; telefono: string; documento: string };
  demostracion?: boolean;
}

export interface Comprador {
  nombre: string;
  correo: string;
  telefono: string;
  documento: string;
  razonSocial: string;
  metodo: "google" | "correo";
}
