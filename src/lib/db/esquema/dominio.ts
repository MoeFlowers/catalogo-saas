import { sql } from "drizzle-orm";
import { bigint, boolean, check, index, integer, numeric, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

// Modelo de dominio de Vitrina (PLAN-MAESTRO sección 11). Toda tabla con datos de una empresa lleva
// business_id: la migración 0001 activa la seguridad por fila sobre esa columna (ADR-0002).
// Dinero en céntimos enteros (bigint) y tasas en numeric exacto (ADR-0003).

const creado = () => timestamp("creado", { withTimezone: true }).notNull().defaultNow();

// ---------------------------------------------------------------------------------------- Tipos

export const monedaEnum = pgEnum("moneda", ["VES", "USD", "EUR", "USDT"]);
export const estadoEmpresaEnum = pgEnum("estado_empresa", ["en_revision", "activa", "rechazada", "suspendida"]);
export const planEnum = pgEnum("plan", ["inicial", "negocio", "mayorista"]);
export const rolEnum = pgEnum("rol", ["dueno", "administrador", "vendedor", "almacen", "lectura"]);
export const mostrarStockEnum = pgEnum("mostrar_stock", ["cantidad", "nivel", "oculto"]);
export const tipoEntregaEnum = pgEnum("tipo_entrega", ["retiro", "delivery", "encomienda", "coordinar"]);
export const estadoPedidoEnum = pgEnum("estado_pedido", ["pendiente", "confirmado", "preparacion", "listo", "despachado", "entregado", "cancelado"]);
export const tipoMovimientoEnum = pgEnum("tipo_movimiento", ["entrada", "salida", "ajuste", "reserva", "liberacion"]);
export const metodoPagoEnum = pgEnum("metodo_pago", ["pago_movil", "transferencia", "zelle", "usdt"]);
export const estadoPagoEnum = pgEnum("estado_pago", ["en_revision", "validado", "rechazado"]);
export const motivoDenunciaEnum = pgEnum("motivo_denuncia", ["estafa", "ilegal", "precios", "otro"]);
export const estadoDenunciaEnum = pgEnum("estado_denuncia", ["abierta", "resuelta", "desestimada"]);
export const origenTasaEnum = pgEnum("origen_tasa", ["en_vivo", "manual"]);

// ---------------------------------------------------------------------------------------- Empresas

export const businesses = pgTable(
  "businesses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull().unique(),
    nombre: text("nombre").notNull(),
    razonSocial: text("razon_social").notNull(),
    rif: text("rif").notNull(),
    rubro: text("rubro").notNull(),
    descripcion: text("descripcion").notNull().default(""),
    ciudad: text("ciudad").notNull(),
    direccion: text("direccion").notNull(),
    horario: text("horario").notNull().default(""),
    redes: text("redes").notNull().default(""),
    color: text("color").notNull().default("#1E3A8A"),
    monedaBase: monedaEnum("moneda_base").notNull().default("USD"),
    pedidoMinimoCent: bigint("pedido_minimo_cent", { mode: "number" }).notNull().default(0),
    mostrarStock: mostrarStockEnum("mostrar_stock").notNull().default("nivel"),
    whatsapp: text("whatsapp").notNull(),
    publicado: boolean("publicado").notNull().default(false),
    plan: planEnum("plan").notNull().default("inicial"),
    vence: timestamp("vence", { withTimezone: true }).notNull(),
    diasCancelacion: integer("dias_cancelacion").notNull().default(3),
    estado: estadoEmpresaEnum("estado").notNull().default("en_revision"),
    motivoEstado: text("motivo_estado"),
    creado: creado(),
  },
  (t) => [check("slug_formato", sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`), check("color_formato", sql`${t.color} ~ '^#[0-9A-Fa-f]{6}$'`)],
);

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    rol: rolEnum("rol").notNull(),
    creado: creado(),
  },
  (t) => [uniqueIndex("membership_unica").on(t.businessId, t.userId), index("membership_user_idx").on(t.userId)],
);

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    correo: text("correo").notNull(),
    rol: rolEnum("rol").notNull(),
    /** sha256 del token del enlace; el token en claro solo viaja en el correo */
    tokenHash: text("token_hash").notNull().unique(),
    expira: timestamp("expira", { withTimezone: true }).notNull(),
    aceptada: timestamp("aceptada", { withTimezone: true }),
    creado: creado(),
  },
  (t) => [uniqueIndex("invitacion_pendiente").on(t.businessId, t.correo)],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    orden: integer("orden").notNull().default(0),
  },
  (t) => [uniqueIndex("categoria_nombre").on(t.businessId, t.nombre)],
);

export const deliveryMethods = pgTable(
  "delivery_methods",
  {
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    tipo: tipoEntregaEnum("tipo").notNull(),
    detalle: text("detalle").notNull(),
  },
  (t) => [primaryKey({ columns: [t.businessId, t.tipo] })],
);

// ---------------------------------------------------------------------------------------- Catálogo

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    nombre: text("nombre").notNull(),
    marca: text("marca").notNull().default(""),
    sku: text("sku").notNull(),
    descripcion: text("descripcion").notNull().default(""),
    unidad: text("unidad").notNull().default("unidad"),
    unidadPlural: text("unidad_plural").notNull().default("unidades"),
    /** Precio por unidad base, en céntimos de la moneda base de la empresa */
    precioCent: bigint("precio_cent", { mode: "number" }).notNull(),
    /** Qué cambia entre variantes ("Talla"); null si el producto no tiene variantes visibles */
    atributo: text("atributo"),
    stockMinimo: integer("stock_minimo").notNull().default(0),
    minimo: integer("minimo").notNull().default(1),
    multiplo: integer("multiplo").notNull().default(1),
    bajoPedido: boolean("bajo_pedido").notNull().default(false),
    activo: boolean("activo").notNull().default(true),
    creado: creado(),
    actualizado: timestamp("actualizado", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("producto_sku").on(t.businessId, t.sku),
    index("producto_empresa_idx").on(t.businessId, t.activo),
    check("precio_positivo", sql`${t.precioCent} > 0`),
    check("minimo_multiplo", sql`${t.minimo} >= 1 and ${t.multiplo} >= 1`),
  ],
);

/** Todo producto tiene al menos una variante; la de un producto simple no tiene nombre. El stock vive aquí. */
export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    nombre: text("nombre"),
    sku: text("sku").notNull(),
    orden: integer("orden").notNull().default(0),
    /** Saldo en caché de los movimientos: físico y comprometido por pedidos confirmados */
    fisico: integer("fisico").notNull().default(0),
    reservado: integer("reservado").notNull().default(0),
  },
  (t) => [
    uniqueIndex("variante_sku").on(t.businessId, t.sku),
    index("variante_producto_idx").on(t.productId),
    check("stock_no_negativo", sql`${t.fisico} >= 0 and ${t.reservado} >= 0`),
  ],
);

export const presentations = pgTable(
  "presentations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    factor: integer("factor").notNull(),
    orden: integer("orden").notNull().default(0),
  },
  (t) => [index("presentacion_producto_idx").on(t.productId), check("factor_positivo", sql`${t.factor} >= 1`)],
);

export const priceTiers = pgTable(
  "price_tiers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    desde: integer("desde").notNull(),
    precioCent: bigint("precio_cent", { mode: "number" }).notNull(),
  },
  (t) => [uniqueIndex("escala_unica").on(t.productId, t.desde), check("escala_positiva", sql`${t.desde} > 1 and ${t.precioCent} > 0`)],
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    clave: text("clave").notNull(),
    ancho: integer("ancho").notNull(),
    alto: integer("alto").notNull(),
    orden: integer("orden").notNull().default(0),
  },
  (t) => [index("imagen_producto_idx").on(t.productId)],
);

// ---------------------------------------------------------------------------------------- Pedidos

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    numero: integer("numero").notNull(),
    buyerUserId: text("buyer_user_id").references(() => user.id, { onDelete: "set null" }),
    compradorNombre: text("comprador_nombre").notNull(),
    compradorTelefono: text("comprador_telefono").notNull(),
    compradorDocumento: text("comprador_documento").notNull().default(""),
    compradorCorreo: text("comprador_correo").notNull(),
    entrega: tipoEntregaEnum("entrega").notNull(),
    destino: text("destino").notNull().default(""),
    nota: text("nota").notNull().default(""),
    estado: estadoPedidoEnum("estado").notNull().default("pendiente"),
    moneda: monedaEnum("moneda").notNull(),
    /** Bs por unidad de la moneda base el día del pedido */
    tasa: numeric("tasa", { precision: 18, scale: 8 }).notNull(),
    fechaTasa: timestamp("fecha_tasa", { withTimezone: true }).notNull(),
    totalCent: bigint("total_cent", { mode: "number" }).notNull(),
    totalBsCent: bigint("total_bs_cent", { mode: "number" }).notNull(),
    /** Token del enlace público del pedido (vitrina.app/p/{token}) */
    tokenPublico: text("token_publico").notNull().unique(),
    whatsappAbierto: timestamp("whatsapp_abierto", { withTimezone: true }),
    ajustado: boolean("ajustado").notNull().default(false),
    creado: creado(),
  },
  (t) => [
    uniqueIndex("pedido_numero").on(t.businessId, t.numero),
    index("pedido_estado_idx").on(t.businessId, t.estado, t.creado),
    index("pedido_comprador_idx").on(t.buyerUserId),
  ],
);

/** Copia fija de cada línea: el pedido no cambia si después cambia el producto */
export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    presentationId: uuid("presentation_id").references(() => presentations.id, { onDelete: "set null" }),
    nombre: text("nombre").notNull(),
    detalle: text("detalle").notNull(),
    sku: text("sku").notNull(),
    cantidad: integer("cantidad").notNull(),
    unidadesBase: integer("unidades_base").notNull(),
    precioUnitCent: bigint("precio_unit_cent", { mode: "number" }).notNull(),
    totalCent: bigint("total_cent", { mode: "number" }).notNull(),
    totalBsCent: bigint("total_bs_cent", { mode: "number" }).notNull(),
  },
  (t) => [index("linea_pedido_idx").on(t.orderId)],
);

export const orderEvents = pgTable(
  "order_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    estado: estadoPedidoEnum("estado").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    nota: text("nota"),
    creado: creado(),
  },
  (t) => [index("evento_pedido_idx").on(t.orderId)],
);

/** Registro inmutable: el saldo de cada variante es la suma de sus movimientos (ADR-0008) */
export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    tipo: tipoMovimientoEnum("tipo").notNull(),
    cantidad: integer("cantidad").notNull(),
    motivo: text("motivo").notNull(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    creado: creado(),
  },
  (t) => [index("movimiento_variante_idx").on(t.variantId, t.creado), check("movimiento_no_cero", sql`${t.cantidad} <> 0`)],
);

// ---------------------------------------------------------------------------------------- Compradores

export const buyerProfiles = pgTable("buyer_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  telefono: text("telefono").notNull().default(""),
  documento: text("documento").notNull().default(""),
  razonSocial: text("razon_social").notNull().default(""),
});

export const buyerAddresses = pgTable(
  "buyer_addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    detalle: text("detalle").notNull(),
    creado: creado(),
  },
  (t) => [index("direccion_user_idx").on(t.userId)],
);

export const blockedBuyers = pgTable("blocked_buyers", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  motivo: text("motivo").notNull(),
  creado: creado(),
});

// ---------------------------------------------------------------------------------------- Plataforma

export const exchangeRates = pgTable(
  "exchange_rates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    moneda: monedaEnum("moneda").notNull(),
    /** Bs por unidad de la moneda */
    valor: numeric("valor", { precision: 18, scale: 8 }).notNull(),
    origen: origenTasaEnum("origen").notNull(),
    fuente: text("fuente").notNull(),
    /** Una tasa manual manda sobre la consulta en vivo mientras esté vigente */
    vigente: boolean("vigente").notNull().default(true),
    creado: creado(),
  },
  (t) => [index("tasa_moneda_idx").on(t.moneda, t.creado)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    plan: planEnum("plan").notNull(),
    metodo: metodoPagoEnum("metodo").notNull(),
    referencia: text("referencia").notNull(),
    montoCent: bigint("monto_cent", { mode: "number" }).notNull(),
    moneda: monedaEnum("moneda").notNull(),
    comprobanteClave: text("comprobante_clave").notNull(),
    estado: estadoPagoEnum("estado").notNull().default("en_revision"),
    motivo: text("motivo"),
    creado: creado(),
  },
  (t) => [index("pago_estado_idx").on(t.estado, t.creado)],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    motivo: motivoDenunciaEnum("motivo").notNull(),
    detalle: text("detalle").notNull(),
    autorCorreo: text("autor_correo").notNull(),
    estado: estadoDenunciaEnum("estado").notNull().default("abierta"),
    resolucion: text("resolucion"),
    creado: creado(),
  },
  (t) => [index("denuncia_estado_idx").on(t.estado)],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actor: text("actor").notNull(),
    accion: text("accion").notNull(),
    objetivo: text("objetivo").notNull(),
    detalle: text("detalle"),
    businessId: uuid("business_id").references(() => businesses.id, { onDelete: "set null" }),
    creado: creado(),
  },
  (t) => [index("auditoria_fecha_idx").on(t.creado), index("auditoria_empresa_idx").on(t.businessId)],
);
