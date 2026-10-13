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
  /** Número de WhatsApp en formato internacional. Vacío en las empresas de demostración. */
  whatsapp: string;
  publicado: boolean;
  plan: IdPlan;
  /** Fin del período de prueba o de la suscripción pagada */
  vence: string;
  equipo: Miembro[];
  /** Días sin confirmar tras los que un pedido pendiente se cancela solo */
  diasCancelacion: number;
}

export type IdPlan = "inicial" | "negocio" | "mayorista";

export type Rol = "dueno" | "administrador" | "vendedor" | "almacen" | "lectura";

export interface Miembro {
  correo: string;
  nombre: string;
  rol: Rol;
  estado: "activo" | "invitado";
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
  reservado: number;
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
  /** Stock físico en unidades base cuando no hay variantes */
  stock: number;
  /** Comprometido por pedidos confirmados, en unidades base */
  reservado: number;
  activo: boolean;
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
  compradorCorreo: string;
  demostracion?: boolean;
  /** Pedido de demostración que se le asigna al comprador del boceto cuando entra */
  semillaComprador?: boolean;
  /** La empresa cambió cantidades antes de confirmar */
  ajustado?: boolean;
}

export type TipoMovimiento = "entrada" | "salida" | "ajuste" | "reserva" | "liberacion";

/** Registro inmutable: el stock de cada producto es la suma de sus movimientos */
export interface Movimiento {
  id: string;
  fecha: string;
  empresa: string;
  productoId: string;
  varianteId?: string;
  tipo: TipoMovimiento;
  /** Unidades base, con signo sobre el stock físico o sobre lo reservado */
  cantidad: number;
  motivo: string;
  pedidoId?: string;
  usuario: string;
}

export interface Pago {
  id: string;
  empresa: string;
  fecha: string;
  metodo: "pago-movil" | "transferencia" | "zelle" | "usdt";
  referencia: string;
  montoCent: number;
  moneda: Moneda;
  estado: "en-revision" | "validado" | "rechazado";
}

export interface Direccion {
  id: string;
  nombre: string;
  detalle: string;
}

export interface Comprador {
  nombre: string;
  correo: string;
  telefono: string;
  documento: string;
  razonSocial: string;
  metodo: "google" | "correo";
  direcciones: Direccion[];
}
