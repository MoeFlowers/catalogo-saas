import { BadgeDollarSign, Building2, ClipboardCheck, Flag, Gauge, Layers, LogOut, Percent, ScrollText, UserX, type LucideIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, NavLink, Outlet, useNavigate, useOutletContext } from "react-router";
import { useShallow } from "zustand/react/shallow";
import { useDatos } from "../../estado/datos";
import { useSesion, type SesionAdmin } from "../../estado/sesion";
import { Boton } from "../../ui/Boton";
import { Campo } from "../../ui/Campo";
import { Aviso } from "../../ui/piezas";

export function useAdmin(): SesionAdmin {
  return useOutletContext<SesionAdmin>();
}

interface Seccion {
  ruta: string;
  texto: string;
  Icono: LucideIcon;
}

const SECCIONES: Seccion[] = [
  { ruta: "/admin", texto: "Resumen", Icono: Gauge },
  { ruta: "/admin/solicitudes", texto: "Solicitudes", Icono: ClipboardCheck },
  { ruta: "/admin/empresas", texto: "Empresas", Icono: Building2 },
  { ruta: "/admin/pagos", texto: "Pagos", Icono: BadgeDollarSign },
  { ruta: "/admin/tasas", texto: "Tasas", Icono: Percent },
  { ruta: "/admin/denuncias", texto: "Denuncias", Icono: Flag },
  { ruta: "/admin/compradores", texto: "Compradores", Icono: UserX },
  { ruta: "/admin/planes", texto: "Planes", Icono: Layers },
  { ruta: "/admin/auditoria", texto: "Auditoría", Icono: ScrollText },
];

export function AdminLayout() {
  const admin = useSesion((s) => s.admin);
  const salirAdmin = useSesion((s) => s.salirAdmin);
  const navegar = useNavigate();
  // useShallow: el selector arma un objeto nuevo en cada lectura
  const pendientes = useDatos(useShallow((s) => ({
    "/admin/solicitudes": s.empresas.filter((e) => e.estado === "en-revision").length,
    "/admin/pagos": s.pagos.filter((p) => p.estado === "en-revision").length,
    "/admin/denuncias": s.denuncias.filter((d) => d.estado === "abierta").length,
  })));
  if (!admin) return <Navigate to="/admin/entrar" replace />;

  const salir = () => {
    salirAdmin();
    navegar("/admin/entrar");
  };
  const cuenta = (ruta: string) => (pendientes as Record<string, number>)[ruta] ?? 0;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      <nav aria-label="Administración de Vitrina" className="border-b border-linea bg-superficie lg:min-h-dvh lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-4 py-3 lg:block lg:border-b lg:border-linea lg:py-4">
          <p className="flex-1 font-bold">Vitrina, administración</p>
          <p className="hidden truncate text-sm text-tenue lg:block">{admin.correo}</p>
          <button type="button" onClick={salir} className="flex min-h-11 items-center gap-1.5 rounded-control px-2 text-sm font-semibold hover:bg-hundido lg:hidden">
            <LogOut size={16} aria-hidden />
            Salir
          </button>
        </div>
        {/* En el celular las secciones se acomodan en varias líneas: una fila con desplazamiento estiraba la página */}
        <div className="flex flex-wrap gap-1 px-2 pb-2 lg:block lg:space-y-0.5 lg:p-3">
          {SECCIONES.map((s) => (
            <NavLink
              key={s.ruta}
              to={s.ruta}
              end={s.ruta === "/admin"}
              className={({ isActive }) =>
                `flex min-h-11 shrink-0 items-center gap-3 rounded-control px-3 text-sm font-semibold ${isActive ? "bg-hundido text-tinta" : "text-tenue hover:bg-hundido hover:text-tinta"}`
              }
            >
              <s.Icono size={18} aria-hidden />
              {s.texto}
              {cuenta(s.ruta) > 0 && (
                <span className="cifras ml-auto rounded-full bg-alerta px-1.5 text-xs font-bold text-white">
                  {cuenta(s.ruta)}
                  <span className="sr-only"> por atender</span>
                </span>
              )}
            </NavLink>
          ))}
          <button type="button" onClick={salir} className="hidden min-h-11 w-full items-center gap-3 rounded-control px-3 text-sm font-semibold text-tenue hover:bg-hundido hover:text-tinta lg:flex">
            <LogOut size={18} aria-hidden />
            Salir
          </button>
        </div>
      </nav>
      <main id="contenido" tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 py-6 outline-none lg:px-8">
        <Outlet context={admin} />
      </main>
    </div>
  );
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function AdminEntrar() {
  const entrarAdmin = useSesion((s) => s.entrarAdmin);
  const navegar = useNavigate();
  const [paso, setPaso] = useState<"clave" | "codigo">("clave");
  const [correo, setCorreo] = useState("admin@vitrina.test");
  const [clave, setClave] = useState("");
  const [codigo, setCodigo] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (paso === "clave") {
      if (!CORREO.test(correo.trim())) err["adm-correo"] = "Escribe un correo válido.";
      if (clave.length < 12) err["adm-clave"] = "La contraseña tiene al menos 12 caracteres.";
    } else if (!/^\d{6}$/.test(codigo.trim())) err["adm-codigo"] = "El código tiene 6 números.";
    setErrores(err);
    const primero = Object.keys(err)[0];
    if (primero) return document.getElementById(primero)?.focus();
    if (paso === "clave") return setPaso("codigo");
    entrarAdmin({ correo: correo.trim(), desde: new Date().toISOString() });
    navegar("/admin", { replace: true });
  };

  return (
    <main id="contenido" tabIndex={-1} className="mx-auto max-w-md px-4 py-10 outline-none">
      <Link to="/" className="text-lg font-bold">
        Vitrina
      </Link>
      <h1 className="mt-6 text-2xl font-bold">Administración de la plataforma</h1>
      <p className="mt-1 text-tenue">Solo para el equipo de Vitrina. Sin entrada con Google y con verificación en dos pasos obligatoria.</p>
      <form onSubmit={enviar} noValidate className="mt-6 space-y-4">
        {paso === "clave" ? (
          <>
            <Campo id="adm-correo" etiqueta="Correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} error={errores["adm-correo"]} autoComplete="username" />
            <Campo
              id="adm-clave"
              etiqueta="Contraseña"
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              error={errores["adm-clave"]}
              autoComplete="current-password"
              ayuda="En el boceto sirve cualquier contraseña de 12 caracteres o más."
            />
          </>
        ) : (
          <Campo
            id="adm-codigo"
            etiqueta="Código de verificación"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            error={errores["adm-codigo"]}
            autoFocus
            ayuda="En el boceto sirve cualquier código de 6 números."
          />
        )}
        <Boton type="submit" variante="accion" className="w-full">
          {paso === "clave" ? "Continuar" : "Entrar"}
        </Boton>
      </form>
      <div className="mt-8">
        <Aviso titulo="En el boceto">La cuenta de administración es simulada. En la versión final la tiene solo el operador de Vitrina y cada acción queda en la auditoría.</Aviso>
      </div>
    </main>
  );
}
