import {
  ClipboardList,
  CreditCard,
  Ellipsis,
  ExternalLink,
  House,
  LogOut,
  Package,
  ShieldCheck,
  Store,
  Tags,
  Truck,
  UserCog,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, NavLink, Outlet, useNavigate, useOutletContext } from "react-router";
import { NOMBRE_ROL } from "../../datos/planes";
import type { Empresa } from "../../datos/tipos";
import { useDatos, useEmpresaPorSlug } from "../../estado/datos";
import { useSesion, type SesionPanel } from "../../estado/sesion";
import { Aviso } from "../../ui/piezas";

export interface ContextoPanel {
  empresa: Empresa;
  sesion: SesionPanel;
}

export function usePanel(): ContextoPanel {
  return useOutletContext<ContextoPanel>();
}

interface Seccion {
  ruta: string;
  texto: string;
  Icono: LucideIcon;
  /** Aparece en la barra inferior del celular */
  principal?: boolean;
}

export const SECCIONES: Seccion[] = [
  { ruta: "/panel", texto: "Inicio", Icono: House, principal: true },
  { ruta: "/panel/pedidos", texto: "Pedidos", Icono: ClipboardList, principal: true },
  { ruta: "/panel/productos", texto: "Productos", Icono: Package, principal: true },
  { ruta: "/panel/inventario", texto: "Inventario", Icono: Warehouse, principal: true },
  { ruta: "/panel/clientes", texto: "Clientes", Icono: Users },
  { ruta: "/panel/categorias", texto: "Categorías", Icono: Tags },
  { ruta: "/panel/entrega", texto: "Entrega", Icono: Truck },
  { ruta: "/panel/catalogo", texto: "Catálogo", Icono: Store },
  { ruta: "/panel/equipo", texto: "Equipo", Icono: UserCog },
  { ruta: "/panel/suscripcion", texto: "Suscripción", Icono: CreditCard },
  { ruta: "/panel/seguridad", texto: "Seguridad", Icono: ShieldCheck },
];

export function PanelLayout() {
  const sesion = useSesion((s) => s.panel);
  const salirPanel = useSesion((s) => s.salirPanel);
  const empresa = useEmpresaPorSlug(sesion?.empresa);
  const cancelarVencidos = useDatos((s) => s.cancelarVencidos);
  const pendientes = useDatos((s) => s.pedidos.filter((p) => p.empresa === sesion?.empresa && p.estado === "pendiente").length);
  const navegar = useNavigate();
  const [cancelados, setCancelados] = useState(0);

  useEffect(() => {
    if (sesion) setCancelados(cancelarVencidos(sesion.empresa));
  }, [sesion, cancelarVencidos]);

  if (!sesion || !empresa) return <Navigate to="/panel/entrar" replace />;

  const salir = () => {
    salirPanel();
    navegar("/panel/entrar");
  };

  const enlace = (s: Seccion, compacto: boolean) => (
    <NavLink
      key={s.ruta}
      to={s.ruta}
      end={s.ruta === "/panel"}
      className={({ isActive }) =>
        compacto
          ? `relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${isActive ? "text-accion" : "text-tenue"}`
          : `flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-semibold ${isActive ? "bg-hundido text-tinta" : "text-tenue hover:bg-hundido hover:text-tinta"}`
      }
    >
      <s.Icono size={compacto ? 22 : 18} aria-hidden />
      {s.texto}
      {s.ruta === "/panel/pedidos" && pendientes > 0 && (
        <span className={`cifras rounded-full bg-alerta px-1.5 text-xs font-bold text-white ${compacto ? "absolute right-[22%] top-1.5" : "ml-auto"}`}>
          {pendientes}
          <span className="sr-only"> por confirmar</span>
        </span>
      )}
    </NavLink>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="hidden border-r border-linea bg-superficie lg:flex lg:min-h-dvh lg:flex-col print:hidden">
        <div className="border-b border-linea px-4 py-4">
          <p className="font-bold leading-tight">{empresa.nombre}</p>
          <p className="text-sm text-tenue">
            {sesion.nombre || sesion.correo}, {NOMBRE_ROL[sesion.rol].toLowerCase()}
          </p>
        </div>
        <nav aria-label="Panel" className="flex-1 space-y-0.5 p-3">
          {SECCIONES.map((s) => enlace(s, false))}
        </nav>
        <div className="space-y-0.5 border-t border-linea p-3">
          <Link to={`/c/${empresa.slug}`} className="flex min-h-11 items-center gap-3 rounded-control px-3 text-sm font-semibold text-tenue hover:bg-hundido hover:text-tinta">
            <ExternalLink size={18} aria-hidden />
            Ver mi catálogo
          </Link>
          <button type="button" onClick={salir} className="flex min-h-11 w-full items-center gap-3 rounded-control px-3 text-sm font-semibold text-tenue hover:bg-hundido hover:text-tinta">
            <LogOut size={18} aria-hidden />
            Salir
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex items-center gap-3 border-b border-linea bg-superficie px-4 py-3 lg:hidden print:hidden">
          <p className="min-w-0 flex-1 truncate font-bold">{empresa.nombre}</p>
          <Link to={`/c/${empresa.slug}`} className="flex min-h-11 items-center gap-1.5 rounded-control px-2 text-sm font-semibold hover:bg-hundido">
            <ExternalLink size={16} aria-hidden />
            Catálogo
          </Link>
          <button type="button" onClick={salir} className="flex min-h-11 items-center gap-1.5 rounded-control px-2 text-sm font-semibold hover:bg-hundido">
            <LogOut size={16} aria-hidden />
            Salir
          </button>
        </header>

        <main id="contenido" tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-28 pt-6 outline-none lg:px-8 lg:pb-12">
          {cancelados > 0 && (
            <div className="mb-5">
              <Aviso tipo="alerta" titulo={`Se cancelaron ${cancelados} ${cancelados === 1 ? "pedido pendiente" : "pedidos pendientes"}`}>
                Llevaban más de {empresa.diasCancelacion} días sin confirmar. Puedes cambiar ese plazo en Catálogo.
              </Aviso>
            </div>
          )}
          <Outlet context={{ empresa, sesion } satisfies ContextoPanel} />
        </main>
      </div>

      <nav aria-label="Panel" className="fixed inset-x-0 bottom-0 z-20 flex border-t border-linea bg-superficie pb-[env(safe-area-inset-bottom)] lg:hidden print:hidden">
        {SECCIONES.filter((s) => s.principal).map((s) => enlace(s, true))}
        {enlace({ ruta: "/panel/mas", texto: "Más", Icono: Ellipsis }, true)}
      </nav>
    </div>
  );
}
