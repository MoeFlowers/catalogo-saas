CREATE TYPE "public"."estado_denuncia" AS ENUM('abierta', 'resuelta', 'desestimada');--> statement-breakpoint
CREATE TYPE "public"."estado_empresa" AS ENUM('en_revision', 'activa', 'rechazada', 'suspendida');--> statement-breakpoint
CREATE TYPE "public"."estado_pago" AS ENUM('en_revision', 'validado', 'rechazado');--> statement-breakpoint
CREATE TYPE "public"."estado_pedido" AS ENUM('pendiente', 'confirmado', 'preparacion', 'listo', 'despachado', 'entregado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."metodo_pago" AS ENUM('pago_movil', 'transferencia', 'zelle', 'usdt');--> statement-breakpoint
CREATE TYPE "public"."moneda" AS ENUM('VES', 'USD', 'EUR', 'USDT');--> statement-breakpoint
CREATE TYPE "public"."mostrar_stock" AS ENUM('cantidad', 'nivel', 'oculto');--> statement-breakpoint
CREATE TYPE "public"."motivo_denuncia" AS ENUM('estafa', 'ilegal', 'precios', 'otro');--> statement-breakpoint
CREATE TYPE "public"."origen_tasa" AS ENUM('en_vivo', 'manual');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('inicial', 'negocio', 'mayorista');--> statement-breakpoint
CREATE TYPE "public"."rol" AS ENUM('dueno', 'administrador', 'vendedor', 'almacen', 'lectura');--> statement-breakpoint
CREATE TYPE "public"."tipo_entrega" AS ENUM('retiro', 'delivery', 'encomienda', 'coordinar');--> statement-breakpoint
CREATE TYPE "public"."tipo_movimiento" AS ENUM('entrada', 'salida', 'ajuste', 'reserva', 'liberacion');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL,
	"verified" boolean DEFAULT false,
	"failed_verification_count" integer DEFAULT 0,
	"locked_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"two_factor_enabled" boolean DEFAULT false,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor" text NOT NULL,
	"accion" text NOT NULL,
	"objetivo" text NOT NULL,
	"detalle" text,
	"business_id" uuid,
	"creado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocked_buyers" (
	"user_id" text PRIMARY KEY NOT NULL,
	"motivo" text NOT NULL,
	"creado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"nombre" text NOT NULL,
	"razon_social" text NOT NULL,
	"rif" text NOT NULL,
	"rubro" text NOT NULL,
	"descripcion" text DEFAULT '' NOT NULL,
	"ciudad" text NOT NULL,
	"direccion" text NOT NULL,
	"horario" text DEFAULT '' NOT NULL,
	"redes" text DEFAULT '' NOT NULL,
	"color" text DEFAULT '#1E3A8A' NOT NULL,
	"moneda_base" "moneda" DEFAULT 'USD' NOT NULL,
	"pedido_minimo_cent" bigint DEFAULT 0 NOT NULL,
	"mostrar_stock" "mostrar_stock" DEFAULT 'nivel' NOT NULL,
	"whatsapp" text NOT NULL,
	"publicado" boolean DEFAULT false NOT NULL,
	"plan" "plan" DEFAULT 'inicial' NOT NULL,
	"vence" timestamp with time zone NOT NULL,
	"dias_cancelacion" integer DEFAULT 3 NOT NULL,
	"estado" "estado_empresa" DEFAULT 'en_revision' NOT NULL,
	"motivo_estado" text,
	"creado" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "businesses_slug_unique" UNIQUE("slug"),
	CONSTRAINT "slug_formato" CHECK ("businesses"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "color_formato" CHECK ("businesses"."color" ~ '^#[0-9A-Fa-f]{6}$')
);
--> statement-breakpoint
CREATE TABLE "buyer_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"nombre" text NOT NULL,
	"detalle" text NOT NULL,
	"creado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "buyer_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"telefono" text DEFAULT '' NOT NULL,
	"documento" text DEFAULT '' NOT NULL,
	"razon_social" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_methods" (
	"business_id" uuid NOT NULL,
	"tipo" "tipo_entrega" NOT NULL,
	"detalle" text NOT NULL,
	CONSTRAINT "delivery_methods_business_id_tipo_pk" PRIMARY KEY("business_id","tipo")
);
--> statement-breakpoint
CREATE TABLE "exchange_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"moneda" "moneda" NOT NULL,
	"valor" numeric(18, 8) NOT NULL,
	"origen" "origen_tasa" NOT NULL,
	"fuente" text NOT NULL,
	"vigente" boolean DEFAULT true NOT NULL,
	"creado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"correo" text NOT NULL,
	"rol" "rol" NOT NULL,
	"token_hash" text NOT NULL,
	"expira" timestamp with time zone NOT NULL,
	"aceptada" timestamp with time zone,
	"creado" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"rol" "rol" NOT NULL,
	"creado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"estado" "estado_pedido" NOT NULL,
	"user_id" text,
	"nota" text,
	"creado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"variant_id" uuid,
	"presentation_id" uuid,
	"nombre" text NOT NULL,
	"detalle" text NOT NULL,
	"sku" text NOT NULL,
	"cantidad" integer NOT NULL,
	"unidades_base" integer NOT NULL,
	"precio_unit_cent" bigint NOT NULL,
	"total_cent" bigint NOT NULL,
	"total_bs_cent" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"numero" integer NOT NULL,
	"buyer_user_id" text,
	"comprador_nombre" text NOT NULL,
	"comprador_telefono" text NOT NULL,
	"comprador_documento" text DEFAULT '' NOT NULL,
	"comprador_correo" text NOT NULL,
	"entrega" "tipo_entrega" NOT NULL,
	"destino" text DEFAULT '' NOT NULL,
	"nota" text DEFAULT '' NOT NULL,
	"estado" "estado_pedido" DEFAULT 'pendiente' NOT NULL,
	"moneda" "moneda" NOT NULL,
	"tasa" numeric(18, 8) NOT NULL,
	"fecha_tasa" timestamp with time zone NOT NULL,
	"total_cent" bigint NOT NULL,
	"total_bs_cent" bigint NOT NULL,
	"token_publico" text NOT NULL,
	"whatsapp_abierto" timestamp with time zone,
	"ajustado" boolean DEFAULT false NOT NULL,
	"creado" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_token_publico_unique" UNIQUE("token_publico")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"plan" "plan" NOT NULL,
	"metodo" "metodo_pago" NOT NULL,
	"referencia" text NOT NULL,
	"monto_cent" bigint NOT NULL,
	"moneda" "moneda" NOT NULL,
	"comprobante_clave" text NOT NULL,
	"estado" "estado_pago" DEFAULT 'en_revision' NOT NULL,
	"motivo" text,
	"creado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "presentations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"factor" integer NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "factor_positivo" CHECK ("presentations"."factor" >= 1)
);
--> statement-breakpoint
CREATE TABLE "price_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"desde" integer NOT NULL,
	"precio_cent" bigint NOT NULL,
	CONSTRAINT "escala_positiva" CHECK ("price_tiers"."desde" > 1 and "price_tiers"."precio_cent" > 0)
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"clave" text NOT NULL,
	"ancho" integer NOT NULL,
	"alto" integer NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"nombre" text,
	"sku" text NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"fisico" integer DEFAULT 0 NOT NULL,
	"reservado" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "stock_no_negativo" CHECK ("product_variants"."fisico" >= 0 and "product_variants"."reservado" >= 0)
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"category_id" uuid,
	"nombre" text NOT NULL,
	"marca" text DEFAULT '' NOT NULL,
	"sku" text NOT NULL,
	"descripcion" text DEFAULT '' NOT NULL,
	"unidad" text DEFAULT 'unidad' NOT NULL,
	"unidad_plural" text DEFAULT 'unidades' NOT NULL,
	"precio_cent" bigint NOT NULL,
	"atributo" text,
	"stock_minimo" integer DEFAULT 0 NOT NULL,
	"minimo" integer DEFAULT 1 NOT NULL,
	"multiplo" integer DEFAULT 1 NOT NULL,
	"bajo_pedido" boolean DEFAULT false NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"creado" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "precio_positivo" CHECK ("products"."precio_cent" > 0),
	CONSTRAINT "minimo_multiplo" CHECK ("products"."minimo" >= 1 and "products"."multiplo" >= 1)
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"motivo" "motivo_denuncia" NOT NULL,
	"detalle" text NOT NULL,
	"autor_correo" text NOT NULL,
	"estado" "estado_denuncia" DEFAULT 'abierta' NOT NULL,
	"resolucion" text,
	"creado" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"tipo" "tipo_movimiento" NOT NULL,
	"cantidad" integer NOT NULL,
	"motivo" text NOT NULL,
	"order_id" uuid,
	"user_id" text,
	"creado" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "movimiento_no_cero" CHECK ("stock_movements"."cantidad" <> 0)
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_buyers" ADD CONSTRAINT "blocked_buyers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_addresses" ADD CONSTRAINT "buyer_addresses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD CONSTRAINT "buyer_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_methods" ADD CONSTRAINT "delivery_methods_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_presentation_id_presentations_id_fk" FOREIGN KEY ("presentation_id") REFERENCES "public"."presentations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_user_id_user_id_fk" FOREIGN KEY ("buyer_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentations" ADD CONSTRAINT "presentations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presentations" ADD CONSTRAINT "presentations_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_tiers" ADD CONSTRAINT "price_tiers_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_tiers" ADD CONSTRAINT "price_tiers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "two_factor_user_idx" ON "two_factor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "auditoria_fecha_idx" ON "audit_log" USING btree ("creado");--> statement-breakpoint
CREATE INDEX "auditoria_empresa_idx" ON "audit_log" USING btree ("business_id");--> statement-breakpoint
CREATE INDEX "direccion_user_idx" ON "buyer_addresses" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categoria_nombre" ON "categories" USING btree ("business_id","nombre");--> statement-breakpoint
CREATE INDEX "tasa_moneda_idx" ON "exchange_rates" USING btree ("moneda","creado");--> statement-breakpoint
CREATE UNIQUE INDEX "invitacion_pendiente" ON "invitations" USING btree ("business_id","correo");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_unica" ON "memberships" USING btree ("business_id","user_id");--> statement-breakpoint
CREATE INDEX "membership_user_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "evento_pedido_idx" ON "order_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "linea_pedido_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pedido_numero" ON "orders" USING btree ("business_id","numero");--> statement-breakpoint
CREATE INDEX "pedido_estado_idx" ON "orders" USING btree ("business_id","estado","creado");--> statement-breakpoint
CREATE INDEX "pedido_comprador_idx" ON "orders" USING btree ("buyer_user_id");--> statement-breakpoint
CREATE INDEX "pago_estado_idx" ON "payments" USING btree ("estado","creado");--> statement-breakpoint
CREATE INDEX "presentacion_producto_idx" ON "presentations" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "escala_unica" ON "price_tiers" USING btree ("product_id","desde");--> statement-breakpoint
CREATE INDEX "imagen_producto_idx" ON "product_images" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "variante_sku" ON "product_variants" USING btree ("business_id","sku");--> statement-breakpoint
CREATE INDEX "variante_producto_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "producto_sku" ON "products" USING btree ("business_id","sku");--> statement-breakpoint
CREATE INDEX "producto_empresa_idx" ON "products" USING btree ("business_id","activo");--> statement-breakpoint
CREATE INDEX "denuncia_estado_idx" ON "reports" USING btree ("estado");--> statement-breakpoint
CREATE INDEX "movimiento_variante_idx" ON "stock_movements" USING btree ("variant_id","creado");