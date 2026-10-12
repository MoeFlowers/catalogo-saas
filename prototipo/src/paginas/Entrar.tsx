import { ChevronLeft } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import type { Comprador } from "../datos/tipos";
import { usePedidos } from "../estado/pedidos";
import { useSesion } from "../estado/sesion";
import { Boton } from "../ui/Boton";
import { Campo } from "../ui/Campo";
import { Aviso } from "../ui/piezas";

function LogoGoogle() {
  return (
    <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function Entrar() {
  const [params] = useSearchParams();
  // Solo rutas internas: un "volver" externo no debe sacar al comprador del sitio
  const solicitada = params.get("volver") ?? "";
  const volver = solicitada.startsWith("/") && !solicitada.startsWith("//") ? solicitada : "/cuenta";
  const vieneDePedido = volver.includes("/pedido");
  const navegar = useNavigate();
  const entrar = useSesion((s) => s.entrar);
  const sembrar = usePedidos((s) => s.sembrar);

  const [modo, setModo] = useState<"entrar" | "crear">("entrar");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState<"google" | "correo" | null>(null);

  const terminar = (c: Comprador) => {
    entrar(c);
    sembrar();
    navegar(volver, { replace: true });
  };

  const conGoogle = () => {
    setCargando("google");
    setTimeout(
      () => terminar({ nombre: "Comprador de prueba", correo: "comprador@ejemplo.com", telefono: "", documento: "", razonSocial: "", metodo: "google" }),
      500,
    );
  };

  const conCorreo = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (modo === "crear" && nombre.trim().length < 3) err.nombre = "Escribe tu nombre.";
    if (!CORREO.test(correo.trim())) err.correo = "Escribe un correo válido, por ejemplo nombre@dominio.com.";
    if (clave.length < 10) err.clave = "La contraseña debe tener al menos 10 caracteres.";
    setErrores(err);
    if (Object.keys(err).length > 0) {
      document.getElementById(Object.keys(err)[0]!)?.focus();
      return;
    }
    setCargando("correo");
    setTimeout(
      () =>
        terminar({
          nombre: modo === "crear" ? nombre.trim() : "Comprador de prueba",
          correo: correo.trim(),
          telefono: "",
          documento: "",
          razonSocial: "",
          metodo: "correo",
        }),
      500,
    );
  };

  return (
    <main id="contenido" tabIndex={-1} className="mx-auto max-w-md px-4 py-10 outline-none">
      <div className="flex items-center justify-between gap-4">
        <Link to="/" className="text-lg font-bold">
          Vitrina
        </Link>
        {vieneDePedido && (
          <Link to={volver} className="inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-sm font-semibold hover:bg-hundido">
            <ChevronLeft size={18} aria-hidden />
            Volver al pedido
          </Link>
        )}
      </div>
      <h1 className="mt-6 text-2xl font-bold">{vieneDePedido ? "Entra para enviar tu pedido" : modo === "crear" ? "Crea tu cuenta" : "Entra a tu cuenta"}</h1>
      <p className="mt-1 text-tenue">Una sola cuenta sirve para comprar en todos los catálogos de Vitrina y ver tus pedidos.</p>

      <button
        type="button"
        onClick={conGoogle}
        disabled={cargando != null}
        className="mt-6 flex min-h-12 w-full items-center justify-center gap-3 rounded-control border border-control bg-superficie font-semibold hover:bg-hundido disabled:opacity-60"
      >
        <LogoGoogle />
        {cargando === "google" ? "Conectando con Google" : "Continuar con Google"}
      </button>

      <div className="my-6 flex items-center gap-3 text-sm text-tenue" aria-hidden>
        <span className="h-px flex-1 bg-linea" />o con tu correo<span className="h-px flex-1 bg-linea" />
      </div>

      <form onSubmit={conCorreo} noValidate className="space-y-4">
        {modo === "crear" && (
          <Campo id="nombre" etiqueta="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} error={errores.nombre} autoComplete="name" />
        )}
        <Campo id="correo" etiqueta="Correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} error={errores.correo} autoComplete="email" />
        <Campo
          id="clave"
          etiqueta="Contraseña"
          type="password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          error={errores.clave}
          autoComplete={modo === "crear" ? "new-password" : "current-password"}
          ayuda={modo === "crear" ? "Al menos 10 caracteres." : undefined}
        />
        <Boton type="submit" variante="accion" className="w-full" cargando={cargando === "correo"} textoCargando={modo === "crear" ? "Creando cuenta" : "Entrando"} disabled={cargando === "google"}>
          {modo === "crear" ? "Crear cuenta" : "Entrar"}
        </Boton>
      </form>

      <p className="mt-4 text-center text-sm">
        {modo === "entrar" ? "¿Primera vez en Vitrina?" : "¿Ya tienes cuenta?"}{" "}
        <button
          type="button"
          onClick={() => {
            setModo(modo === "entrar" ? "crear" : "entrar");
            setErrores({});
          }}
          className="min-h-11 font-semibold text-accion underline underline-offset-2"
        >
          {modo === "entrar" ? "Crea tu cuenta" : "Entra"}
        </button>
      </p>

      <div className="mt-8">
        <Aviso titulo="En el boceto">
          No se conecta con Google ni se guarda ninguna contraseña. La sesión es de prueba y vive solo en este navegador.
        </Aviso>
      </div>
    </main>
  );
}
