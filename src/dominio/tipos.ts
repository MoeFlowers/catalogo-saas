// Tipos de dominio que usan la interfaz y las reglas puras (precios, inventario, pedidos). Los arman los
// módulos a partir de las filas de la base; los valores de los enums son los mismos de PostgreSQL.
import type { estadoEmpresaEnum, estadoPedidoEnum, monedaEnum, mostrarStockEnum, planEnum, tipoEntregaEnum } from "@/lib/db/esquema";

export type Moneda = (typeof monedaEnum.enumValues)[number];
export type TipoEntrega = (typeof tipoEntregaEnum.enumValues)[number];
export type EstadoPedido = (typeof estadoPedidoEnum.enumValues)[number];
export type EstadoEmpresa = (typeof estadoEmpresaEnum.enumValues)[number];
export type IdPlan = (typeof planEnum.enumValues)[number];
export type MostrarStock = (typeof mostrarStockEnum.enumValues)[number];

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
  id: string;
  slug: string;
  nombre: string;
  razonSocial: string;
  rif: string;
  rubro: string;
  descripcion: string;
  ciudad: string;
  direccion: string;
  horario: string;
  redes: string;
  color: string;
  monedaBase: Moneda;
  pedidoMinimoCent: number;
  mostrarStock: MostrarStock;
  whatsapp: string;
  publicado: boolean;
  plan: IdPlan;
  /** Fin del período de prueba o de la suscripción pagada (ISO) */
  vence: string;
  diasCancelacion: number;
  estado: EstadoEmpresa;
  motivoEstado: string | null;
  entregas: MetodoEntrega[];
  categorias: Categoria[];
}

export interface Escala {
  desde: number;
  precioCent: number;
}

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
  unidad: string;
  unidadPlural: string;
  precioCent: number;
  escalas: Escala[];
  presentaciones: Presentacion[];
  atributo?: string | undefined;
  /** Variantes con nombre (tallas, colores). Un producto simple no tiene: su stock va en stock/reservado. */
  variantes?: Variante[] | undefined;
  /** Variante interna de un producto simple: ahí vive su stock en la base */
  varianteBaseId?: string | undefined;
  stock: number;
  reservado: number;
  activo: boolean;
  stockMinimo: number;
  minimo: number;
  multiplo: number;
  bajoPedido: boolean;
  imagenes: { url: string; ancho: number; alto: number }[];
}

export interface LineaPedido {
  productoId: string;
  varianteId?: string | undefined;
  presentacionId: string;
  cantidad: number;
}

/** Copia fija de una línea al momento de pedir */
export interface ItemPedido {
  /** Id de la línea en la base; no existe mientras el pedido se arma */
  id?: string | undefined;
  productoId: string | null;
  varianteId?: string | null | undefined;
  presentacionId: string | null;
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
  origen: "en-vivo" | "demostracion" | "manual";
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
  tokenPublico: string;
  ajustado: boolean;
  whatsappAbierto: string | null;
}
