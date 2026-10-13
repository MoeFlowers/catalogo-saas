-- Rol con el que corre la aplicación (ADR-0002): no es dueño de las tablas, no es superusuario y no
-- puede saltarse la seguridad por fila. Los permisos sobre las tablas los da la migración 0001.
-- La contraseña de desarrollo coincide con .env.example; en producción se crea con otra.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_runtime') THEN
    CREATE ROLE app_runtime LOGIN PASSWORD 'solo-desarrollo' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END $$;
