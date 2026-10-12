import { LogOut } from "lucide-react";
import { Link, Navigate, NavLink, Outlet, useNavigate } from "react-router";
import { useSesion } from "../../estado/sesion";

const PESTANA =
  "flex min-h-11 items-center border-b-2 px-1 text-sm font-semibold aria-[current=page]:border-tinta aria-[current=page]:text-tinta border-transparent text-tenue hover:text-tinta";

export function CuentaLayout() {
  const { comprador, salir } = useSesion();
  const navegar = useNavigate();
  if (!comprador) return <Navigate to="/entrar?volver=/cuenta" replace />;

  return (
    <div className="min-h-dvh">
      <header className="border-b border-linea bg-superficie">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 pt-3">
          <Link to="/" className="text-lg font-bold">
            Vitrina
          </Link>
          <p className="ml-auto truncate text-sm text-tenue">{comprador.correo}</p>
          <button
            type="button"
            onClick={() => {
              salir();
              navegar("/");
            }}
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-control px-3 text-sm font-semibold hover:bg-hundido"
          >
            <LogOut size={16} aria-hidden />
            Salir
          </button>
        </div>
        <nav aria-label="Mi cuenta" className="mx-auto flex max-w-4xl gap-6 px-4">
          <NavLink to="/cuenta" end className={PESTANA}>
            Mis pedidos
          </NavLink>
          <NavLink to="/cuenta/datos" className={PESTANA}>
            Mis datos
          </NavLink>
        </nav>
      </header>
      <main id="contenido" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-6 outline-none">
        <Outlet />
      </main>
    </div>
  );
}
