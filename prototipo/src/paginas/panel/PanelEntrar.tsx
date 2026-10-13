import { ChevronLeft, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useDatos } from "../../estado/datos";
import { useSesion } from "../../estado/sesion";
import { Boton } from "../../ui/Boton";
import { Campo } from "../../ui/Campo";
import { Aviso } from "../../ui/piezas";

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function PanelEntrar() {
  const empresas = useDatos((s) => s.empresas);
  const entrarPanel = useSesion((s) => s.entrarPanel);
  const navegar = useNavigate();

  const [paso, setPaso] = useState<"clave" | "codigo">("clave");
  const [slug, setSlug] = useState(empresas[0]!.slug);
  const empresa = empresas.find((e) => e.slug === slug)!;
  const dueno = empresa.equipo.find((m) => m.rol === "dueno")!;
  const [correo, setCorreo] = useState(dueno.correo);
  const [clave, setClave] = useState("");
  const [codigo, setCodigo] = useState("");
  const [recuperacion, setRecuperacion] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(false);

  const enfocarPrimerError = (err: Record<string, string>) => {
    const primero = Object.keys(err)[0];
    if (primero) document.getElementById(primero)?.focus();
  };

  const enviarClave = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!CORREO.test(correo.trim())) err.correo = "Escribe un correo válido.";
    if (clave.length < 12) err.clave = "La contraseña de una empresa tiene al menos 12 caracteres.";
    setErrores(err);
    if (Object.keys(err).length) return enfocarPrimerError(err);
    setCargando(true);
    setTimeout(() => {
      setCargando(false);
      setPaso("codigo");
    }, 500);
  };

  const enviarCodigo = (e: FormEvent) => {
    e.preventDefault();
    const limpio = codigo.replace(/\s/g, "");
    const valido = recuperacion ? /^[a-z0-9]{4}-[a-z0-9]{4}$/i.test(limpio) : /^\d{6}$/.test(limpio);
    const err: Record<string, string> = valido
      ? {}
      : { codigo: recuperacion ? "El código de recuperación tiene el formato xxxx-xxxx." : "El código tiene 6 números." };
    setErrores(err);
    if (Object.keys(err).length) return enfocarPrimerError(err);
    setCargando(true);
    const miembro = empresa.equipo.find((m) => m.correo.toLowerCase() === correo.trim().toLowerCase()) ?? dueno;
    setTimeout(() => {
      entrarPanel({ empresa: slug, correo: miembro.correo, nombre: miembro.nombre, rol: miembro.rol, desde: new Date().toISOString() });
      navegar("/panel", { replace: true });
    }, 500);
  };

  return (
    <main id="contenido" tabIndex={-1} className="mx-auto max-w-md px-4 py-10 outline-none">
      <Link to="/" className="text-lg font-bold">
        Vitrina
      </Link>

      {paso === "clave" ? (
        <>
          <h1 className="mt-6 text-2xl font-bold">Panel de tu empresa</h1>
          <p className="mt-1 text-tenue">Entra con el correo y la contraseña de tu empresa.</p>
          <form onSubmit={enviarClave} noValidate className="mt-6 space-y-4">
            <fieldset>
              <legend className="text-sm font-semibold">Empresa de demostración</legend>
              <div className="mt-2 space-y-2">
                {empresas.map((e) => (
                  <label key={e.slug} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control border border-control px-3 has-[:checked]:border-accion has-[:checked]:ring-1 has-[:checked]:ring-accion">
                    <input
                      type="radio"
                      name="empresa"
                      checked={slug === e.slug}
                      onChange={() => {
                        setSlug(e.slug);
                        setCorreo(e.equipo.find((m) => m.rol === "dueno")!.correo);
                      }}
                      className="size-5 accent-[var(--color-accion)]"
                    />
                    {e.nombre}
                  </label>
                ))}
              </div>
            </fieldset>
            <Campo id="correo" etiqueta="Correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} error={errores.correo} autoComplete="username" />
            <Campo
              id="clave"
              etiqueta="Contraseña"
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              error={errores.clave}
              autoComplete="current-password"
              ayuda="En el boceto sirve cualquier contraseña de 12 caracteres o más."
            />
            <Boton type="submit" variante="accion" className="w-full" cargando={cargando} textoCargando="Verificando">
              Continuar
            </Boton>
          </form>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              setPaso("clave");
              setErrores({});
            }}
            className="-ml-2 mt-4 inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-sm font-semibold hover:bg-hundido"
          >
            <ChevronLeft size={18} aria-hidden />
            Cambiar de cuenta
          </button>
          <ShieldCheck size={28} className="mt-4 text-accion" aria-hidden />
          <h1 className="mt-2 text-2xl font-bold">Verificación en dos pasos</h1>
          <p className="mt-1 text-tenue">
            {recuperacion
              ? "Escribe uno de los códigos de recuperación que guardaste al activar la verificación. Cada código sirve una sola vez."
              : "Abre tu aplicación autenticadora y escribe el código de 6 números de Vitrina."}
          </p>
          <form onSubmit={enviarCodigo} noValidate className="mt-6 space-y-4">
            <Campo
              id="codigo"
              etiqueta={recuperacion ? "Código de recuperación" : "Código de verificación"}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              error={errores.codigo}
              inputMode={recuperacion ? "text" : "numeric"}
              autoComplete="one-time-code"
              autoFocus
              ayuda={recuperacion ? undefined : "En el boceto sirve cualquier código de 6 números."}
            />
            <Boton type="submit" variante="accion" className="w-full" cargando={cargando} textoCargando="Entrando">
              Entrar al panel
            </Boton>
          </form>
          <button
            type="button"
            onClick={() => {
              setRecuperacion(!recuperacion);
              setCodigo("");
              setErrores({});
            }}
            className="mt-3 min-h-11 text-sm font-semibold text-accion underline underline-offset-2"
          >
            {recuperacion ? "Usar la aplicación autenticadora" : "No tengo el teléfono: usar un código de recuperación"}
          </button>
        </>
      )}

      <div className="mt-8">
        <Aviso titulo="En el boceto">
          No se valida ninguna contraseña ni código. En la versión final la verificación en dos pasos es obligatoria para todas las cuentas de empresa.
        </Aviso>
      </div>
      <p className="mt-6 text-center text-sm text-tenue">
        ¿Tu empresa todavía no está en Vitrina? El registro de empresas llega al boceto esta semana.
      </p>
    </main>
  );
}
