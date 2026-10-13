-- Seguridad por fila (ADR-0002, capa 2). La app se conecta como app_runtime, que no es dueño de las
-- tablas ni tiene BYPASSRLS, y declara en cada transacción quién actúa (src/lib/db/index.ts:
-- conContexto). Si el código olvida filtrar por empresa, PostgreSQL igual no entrega filas ajenas.

-- Contexto de la transacción. Vacío si no se declaró: entonces ninguna política deja ver nada.
CREATE OR REPLACE FUNCTION app_rol() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT coalesce(current_setting('app.rol', true), '')
$$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION app_business() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.business_id', true), '')::uuid
$$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION app_user() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.user_id', true), '')
$$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION app_token() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('app.token', true), '')
$$;--> statement-breakpoint
-- Un catálogo es público si la empresa está aprobada, activa y lo publicó
CREATE OR REPLACE FUNCTION catalogo_publico(empresa uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM businesses b WHERE b.id = empresa AND b.estado = 'activa' AND b.publicado)
$$;--> statement-breakpoint

-- Permisos del rol de la app: solo datos, nunca estructura
GRANT USAGE ON SCHEMA public TO app_runtime;--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_runtime;--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_runtime;--> statement-breakpoint
GRANT EXECUTE ON FUNCTION app_rol(), app_business(), app_user(), app_token(), catalogo_publico(uuid) TO app_runtime;--> statement-breakpoint
-- El registro de movimientos es inmutable: se corrige con otro movimiento, nunca editando (ADR-0008)
REVOKE UPDATE, DELETE ON stock_movements FROM app_runtime;--> statement-breakpoint
REVOKE UPDATE, DELETE ON audit_log FROM app_runtime;--> statement-breakpoint

-- Tablas con datos de una empresa: RLS activa y forzada
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'memberships', 'invitations', 'categories', 'delivery_methods', 'products', 'product_variants',
    'presentations', 'price_tiers', 'product_images', 'orders', 'order_items', 'order_events',
    'stock_movements', 'payments', 'reports'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    -- La empresa que actúa ve y cambia solo sus filas
    EXECUTE format('CREATE POLICY empresa ON %I FOR ALL USING (business_id = app_business()) WITH CHECK (business_id = app_business())', t);
    -- El equipo de Vitrina y las tareas internas ven todo
    EXECUTE format('CREATE POLICY plataforma ON %I FOR ALL USING (app_rol() IN (''admin'', ''sistema'')) WITH CHECK (app_rol() IN (''admin'', ''sistema''))', t);
  END LOOP;

  -- Visitantes: solo leen el catálogo de empresas activas que lo publicaron
  FOREACH t IN ARRAY ARRAY['categories', 'delivery_methods', 'products', 'product_variants', 'presentations', 'price_tiers', 'product_images'] LOOP
    EXECUTE format('CREATE POLICY publico ON %I FOR SELECT USING (app_rol() = ''publico'' AND catalogo_publico(business_id))', t);
  END LOOP;
END $$;--> statement-breakpoint

-- Compradores: ven sus propios pedidos, sus líneas y su historial
CREATE POLICY comprador ON orders FOR SELECT USING (app_rol() = 'comprador' AND buyer_user_id = app_user());--> statement-breakpoint
CREATE POLICY comprador ON order_items FOR SELECT USING (
  app_rol() = 'comprador' AND EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.buyer_user_id = app_user())
);--> statement-breakpoint
CREATE POLICY comprador ON order_events FOR SELECT USING (
  app_rol() = 'comprador' AND EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.buyer_user_id = app_user())
);--> statement-breakpoint
-- El comprador puede marcar que abrió WhatsApp con su pedido, y nada más (la columna la limita la app)
CREATE POLICY comprador_whatsapp ON orders FOR UPDATE USING (app_rol() = 'comprador' AND buyer_user_id = app_user())
  WITH CHECK (app_rol() = 'comprador' AND buyer_user_id = app_user());--> statement-breakpoint

-- Enlace público de un pedido (vitrina.app/p/{token}): solo ese pedido y sus líneas
CREATE POLICY enlace ON orders FOR SELECT USING (app_token() IS NOT NULL AND token_publico = app_token());--> statement-breakpoint
CREATE POLICY enlace ON order_items FOR SELECT USING (
  app_token() IS NOT NULL AND EXISTS (SELECT 1 FROM orders o WHERE o.id = order_id AND o.token_publico = app_token())
);--> statement-breakpoint

-- Una persona ve sus propias membresías para elegir con qué empresa entra al panel
CREATE POLICY propias ON memberships FOR SELECT USING (user_id = app_user());
