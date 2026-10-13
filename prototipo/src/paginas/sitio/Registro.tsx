import { ChevronLeft, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";
import type { Categoria, Empresa } from "../../datos/tipos";
import { useDatos } from "../../estado/datos";
import { useSesion } from "../../estado/sesion";
import { Boton } from "../../ui/Boton";
import { Campo } from "../../ui/Campo";
import { Aviso } from "../../ui/piezas";
import { Casilla, Selector } from "../../ui/Selector";
import { CabeceraSitio } from "./Portada";

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** RIF venezolano: letra, 8 dígitos y dígito verificador. El dígito se valida contra el SENIAT en la app real. */
const RIF = /^[JGVEPC]-?\d{8}-?\d$/i;
const WHATSAPP = /^\+\d{8,15}$/;

// Muestra mínima para el boceto; la app real consulta el rango de contraseñas filtradas (k-anonimato)
const COMUNES = ["123456789012", "contraseña123", "contrasena123", "password1234", "qwertyuiopas", "000000000000", "vitrina12345"];

const RUBROS: { valor: string; texto: string; categorias: string[] }[] = [
  { valor: "ferreteria", texto: "Ferretería y construcción", categorias: ["Tornillería", "Herramientas", "Electricidad", "Plomería", "Pinturas"] },
  { valor: "ropa", texto: "Ropa y uniformes", categorias: ["Franelas", "Pantalones", "Uniformes", "Telas"] },
  { valor: "viveres", texto: "Víveres y limpieza", categorias: ["Víveres", "Bebidas", "Limpieza", "Cuidado personal"] },
  { valor: "repuestos", texto: "Repuestos automotrices", categorias: ["Motor", "Frenos", "Suspensión", "Eléctrico", "Lubricantes"] },
  { valor: "otro", texto: "Otro rubro", categorias: [] },
];

const PASOS = ["Cuenta", "Correo", "Doble factor", "Empresa", "Enlace"];

const slug = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

function secretoBase32(): string {
  const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  return Array.from(crypto.getRandomValues(new Uint8Array(20)), (b) => alfabeto[b % 32]).join("");
}

function codigosRecuperacion(): string[] {
  const letras = "abcdefghjkmnpqrstuvwxyz23456789";
  const parte = () => Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => letras[b % letras.length]).join("");
  return Array.from({ length: 10 }, () => `${parte()}-${parte()}`);
}

type Errores = Record<string, string>;

function Resumen({ errores }: { errores: Errores }) {
  const lista = Object.entries(errores);
  if (!lista.length) return null;
  return (
    <div id="errores-registro" tabIndex={-1} role="alert" className="rounded-control border border-peligro/40 bg-[#fef2f2] p-4 outline-none">
      <p className="font-semibold">Revisa antes de seguir:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {lista.map(([id, texto]) => (
          <li key={id}>
            <button type="button" onClick={() => document.getElementById(id)?.focus()} className="inline text-left font-medium text-peligro underline underline-offset-2">
              {texto}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Paso({ titulo, children, descripcion }: { titulo: string; descripcion?: ReactNode; children: ReactNode }) {
  return (
    <>
      <h1 tabIndex={-1} className="mt-2 text-2xl font-bold outline-none">{titulo}</h1>
      {descripcion && <div className="mt-1 text-tenue">{descripcion}</div>}
      <div className="mt-6">{children}</div>
    </>
  );
}

export function Registro() {
  const empresas = useDatos((s) => s.empresas);
  const registrarEmpresa = useDatos((s) => s.registrarEmpresa);
  const entrarPanel = useSesion((s) => s.entrarPanel);
  const navegar = useNavigate();

  const [paso, setPaso] = useState(0);
  const [errores, setErrores] = useState<Errores>({});
  const [cargando, setCargando] = useState(false);

  const [cuenta, setCuenta] = useState({ nombre: "", correo: "", clave: "", repetir: "", terminos: false });
  const [codigoCorreo, setCodigoCorreo] = useState("");
  const secreto = useMemo(secretoBase32, []);
  const codigos = useMemo(codigosRecuperacion, []);
  const [qr, setQr] = useState<string | null>(null);
  const [codigo2fa, setCodigo2fa] = useState("");
  const [verificado2fa, setVerificado2fa] = useState(false);
  const [guardoCodigos, setGuardoCodigos] = useState(false);
  const [empresa, setEmpresa] = useState({ razonSocial: "", rif: "", nombre: "", rubro: "ferreteria", ciudad: "", direccion: "", whatsapp: "", redes: "" });
  const [enlace, setEnlace] = useState("");

  const uri = `otpauth://totp/Vitrina:${encodeURIComponent(cuenta.correo)}?secret=${secreto}&issuer=Vitrina`;
  useEffect(() => {
    if (paso !== 2) return;
    QRCode.toString(uri, { type: "svg", margin: 1, color: { dark: "#1e293b", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [paso, uri]);

  const fallar = (err: Errores) => {
    setErrores(err);
    if (Object.keys(err).length) {
      requestAnimationFrame(() => document.getElementById("errores-registro")?.focus());
      return true;
    }
    return false;
  };

  const avanzar = () => {
    setErrores({});
    setCargando(true);
    // Pausa breve: en la app real cada paso habla con el servidor
    setTimeout(() => {
      setCargando(false);
      setPaso((p) => p + 1);
      requestAnimationFrame(() => document.querySelector("h1")?.focus());
    }, 400);
  };

  const enviarCuenta = (e: FormEvent) => {
    e.preventDefault();
    const err: Errores = {};
    if (cuenta.nombre.trim().length < 3) err["reg-nombre"] = "Escribe tu nombre.";
    if (!CORREO.test(cuenta.correo.trim())) err["reg-correo"] = "Escribe un correo válido.";
    else if (empresas.some((x) => x.equipo.some((m) => m.correo.toLowerCase() === cuenta.correo.trim().toLowerCase()))) {
      err["reg-correo"] = "Ese correo ya tiene una cuenta de empresa. Entra con él.";
    }
    const local = cuenta.correo.split("@")[0]?.toLowerCase() ?? "";
    if (cuenta.clave.length < 12) err["reg-clave"] = "La contraseña debe tener al menos 12 caracteres.";
    else if (COMUNES.includes(cuenta.clave.toLowerCase())) err["reg-clave"] = "Esa contraseña aparece en filtraciones conocidas. Elige otra.";
    else if (local.length >= 4 && cuenta.clave.toLowerCase().includes(local)) err["reg-clave"] = "La contraseña no puede contener tu correo.";
    if (cuenta.repetir !== cuenta.clave) err["reg-repetir"] = "Las contraseñas no coinciden.";
    if (!cuenta.terminos) err["reg-terminos"] = "Acepta los términos y la política de privacidad para continuar.";
    if (!fallar(err)) avanzar();
  };

  const enviarCodigoCorreo = (e: FormEvent) => {
    e.preventDefault();
    if (!fallar(/^\d{6}$/.test(codigoCorreo.trim()) ? {} : { "reg-codigo-correo": "El código tiene 6 números." })) avanzar();
  };

  const enviar2fa = (e: FormEvent) => {
    e.preventDefault();
    if (!verificado2fa) {
      if (fallar(/^\d{6}$/.test(codigo2fa.trim()) ? {} : { "reg-2fa": "Escribe el código de 6 números que muestra tu aplicación." })) return;
      setVerificado2fa(true);
      setErrores({});
      return;
    }
    if (!fallar(guardoCodigos ? {} : { "reg-guarde": "Confirma que guardaste los códigos de recuperación." })) avanzar();
  };

  const enviarEmpresa = (e: FormEvent) => {
    e.preventDefault();
    const err: Errores = {};
    if (empresa.razonSocial.trim().length < 3) err["emp-razon"] = "Escribe la razón social como aparece en el RIF.";
    if (!RIF.test(empresa.rif.trim())) err["emp-rif"] = "El RIF tiene el formato J-12345678-9.";
    if (empresa.nombre.trim().length < 3) err["emp-nombre"] = "Escribe el nombre comercial que verán tus clientes.";
    if (empresa.ciudad.trim().length < 3) err["emp-ciudad"] = "Escribe la ciudad.";
    if (empresa.direccion.trim().length < 8) err["emp-direccion"] = "Escribe la dirección fiscal o del local.";
    if (!WHATSAPP.test(empresa.whatsapp.replace(/[\s-]/g, ""))) err["emp-whatsapp"] = "Escribe el WhatsApp con código de país, por ejemplo +58 414 1234567.";
    if (fallar(err)) return;
    if (!enlace) setEnlace(slug(empresa.nombre));
    avanzar();
  };

  const tomado = (s: string) => empresas.some((x) => x.slug === s);

  const terminar = (e: FormEvent) => {
    e.preventDefault();
    const s = slug(enlace);
    const err: Errores = {};
    if (s.length < 3) err["emp-enlace"] = "El enlace necesita al menos 3 letras o números.";
    else if (tomado(s)) err["emp-enlace"] = `El enlace /c/${s} ya está en uso. Prueba con la ciudad al final.`;
    if (fallar(err)) return;
    setCargando(true);
    const rubro = RUBROS.find((r) => r.valor === empresa.rubro)!;
    const categorias: Categoria[] = rubro.categorias.map((c) => ({ id: slug(c), nombre: c }));
    const ahora = new Date();
    const nueva: Empresa = {
      slug: s,
      nombre: empresa.nombre.trim(),
      razonSocial: empresa.razonSocial.trim(),
      rif: empresa.rif.trim().toUpperCase(),
      rubro: rubro.texto,
      descripcion: "",
      ciudad: empresa.ciudad.trim(),
      horario: "",
      color: "#1E3A8A",
      monedaBase: "USD",
      pedidoMinimoCent: 0,
      mostrarStock: "nivel",
      entregas: [{ tipo: "coordinar", detalle: "Se coordina por WhatsApp.", pideDireccion: false }],
      categorias,
      whatsapp: empresa.whatsapp.replace(/[\s-]/g, ""),
      publicado: false,
      plan: "inicial",
      vence: new Date(ahora.getTime() + 30 * 86_400_000).toISOString(),
      equipo: [{ correo: cuenta.correo.trim().toLowerCase(), nombre: cuenta.nombre.trim(), rol: "dueno", estado: "activo" }],
      diasCancelacion: 3,
      estado: "en-revision",
      creada: ahora.toISOString(),
      direccion: empresa.direccion.trim(),
      redes: empresa.redes.trim(),
    };
    setTimeout(() => {
      registrarEmpresa(nueva);
      entrarPanel({ empresa: s, correo: nueva.equipo[0]!.correo, nombre: nueva.equipo[0]!.nombre, rol: "dueno", desde: ahora.toISOString() });
      navegar("/panel", { replace: true });
    }, 500);
  };

  const rubro = RUBROS.find((r) => r.valor === empresa.rubro)!;
  const propuesto = slug(enlace);

  return (
    <>
      <CabeceraSitio />
      <main id="contenido" tabIndex={-1} className="mx-auto max-w-lg px-4 py-8 outline-none">
        <nav aria-label="Pasos del registro">
          <ol className="flex gap-1">
            {PASOS.map((p, i) => (
              <li key={p} className="flex-1" aria-current={i === paso ? "step" : undefined}>
                <span className={`block h-1.5 rounded-full ${i <= paso ? "bg-accion" : "bg-linea"}`} aria-hidden />
                <span className={`mt-1.5 hidden text-xs sm:block ${i === paso ? "font-semibold" : "text-tenue"}`}>{p}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-tenue">
            Paso {paso + 1} de {PASOS.length}: {PASOS[paso]}
          </p>
        </nav>

        {paso > 0 && paso < 3 && (
          <button
            type="button"
            onClick={() => {
              setPaso(paso - 1);
              setErrores({});
            }}
            className="-ml-2 mt-2 inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-sm font-semibold hover:bg-hundido"
          >
            <ChevronLeft size={18} aria-hidden />
            Volver
          </button>
        )}

        <div className="mt-2 space-y-4">
          <Resumen errores={errores} />
        </div>

        {paso === 0 && (
          <Paso titulo="Registra tu empresa" descripcion="Primero tu cuenta personal: con ella entras al panel. Después los datos de la empresa.">
            <form onSubmit={enviarCuenta} noValidate className="space-y-4">
              <Campo id="reg-nombre" etiqueta="Tu nombre" value={cuenta.nombre} onChange={(e) => setCuenta({ ...cuenta, nombre: e.target.value })} autoComplete="name" />
              <Campo id="reg-correo" etiqueta="Correo" type="email" value={cuenta.correo} onChange={(e) => setCuenta({ ...cuenta, correo: e.target.value })} autoComplete="email" />
              <Campo
                id="reg-clave"
                etiqueta="Contraseña"
                type="password"
                value={cuenta.clave}
                onChange={(e) => setCuenta({ ...cuenta, clave: e.target.value })}
                autoComplete="new-password"
                ayuda={`Al menos 12 caracteres. ${cuenta.clave.length > 0 ? `Llevas ${cuenta.clave.length}.` : "Una frase de varias palabras es fácil de recordar y difícil de adivinar."}`}
              />
              <Campo id="reg-repetir" etiqueta="Repite la contraseña" type="password" value={cuenta.repetir} onChange={(e) => setCuenta({ ...cuenta, repetir: e.target.value })} autoComplete="new-password" />
              <Casilla
                id="reg-terminos"
                checked={cuenta.terminos}
                onChange={(e) => setCuenta({ ...cuenta, terminos: e.target.checked })}
                etiqueta="Acepto los términos y la política de privacidad"
                descripcion={
                  <>
                    Léelos en{" "}
                    <Link to="/terminos" target="_blank" className="font-semibold text-accion underline underline-offset-2">
                      Términos
                    </Link>{" "}
                    y{" "}
                    <Link to="/privacidad" target="_blank" className="font-semibold text-accion underline underline-offset-2">
                      Privacidad
                    </Link>
                    .
                  </>
                }
              />
              <Boton type="submit" variante="accion" className="w-full" cargando={cargando} textoCargando="Creando cuenta">
                Crear cuenta
              </Boton>
              <p className="text-center text-sm">
                ¿Ya tienes cuenta?{" "}
                <Link to="/panel/entrar" className="font-semibold text-accion underline underline-offset-2">
                  Entra al panel
                </Link>
              </p>
            </form>
          </Paso>
        )}

        {paso === 1 && (
          <Paso titulo="Verifica tu correo" descripcion={`Te enviamos un código de 6 números a ${cuenta.correo}. Vence en 15 minutos.`}>
            <form onSubmit={enviarCodigoCorreo} noValidate className="space-y-4">
              <Campo
                id="reg-codigo-correo"
                etiqueta="Código del correo"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={codigoCorreo}
                onChange={(e) => setCodigoCorreo(e.target.value)}
                ayuda="En el boceto no se envía ningún correo: sirve cualquier código de 6 números."
              />
              <Boton type="submit" variante="accion" className="w-full" cargando={cargando} textoCargando="Verificando">
                Verificar correo
              </Boton>
            </form>
          </Paso>
        )}

        {paso === 2 && (
          <Paso
            titulo="Activa la verificación en dos pasos"
            descripcion="Es obligatoria en las cuentas de empresa: aunque alguien adivine tu contraseña, no entra sin tu teléfono."
          >
            <form onSubmit={enviar2fa} noValidate className="space-y-5">
              {!verificado2fa ? (
                <>
                  <ol className="list-decimal space-y-1 pl-5 text-sm">
                    <li>Instala una aplicación autenticadora en tu teléfono (Google Authenticator, Microsoft Authenticator, 2FAS u otra).</li>
                    <li>Escanea este código o escribe la clave a mano.</li>
                    <li>Escribe el código de 6 números que te muestra.</li>
                  </ol>
                  {qr ? (
                    <div
                      className="mx-auto w-48 rounded-control border border-linea bg-white p-2 [&_svg]:h-auto [&_svg]:w-full"
                      role="img"
                      aria-label="Código QR para la aplicación autenticadora"
                      dangerouslySetInnerHTML={{ __html: qr }}
                    />
                  ) : (
                    <p className="text-sm text-tenue">Generando el código QR.</p>
                  )}
                  <div>
                    <p className="text-sm font-semibold">Clave para escribir a mano</p>
                    <p className="cifras mt-1 break-all rounded-control bg-hundido px-3 py-2 font-mono text-sm">{secreto.match(/.{1,4}/g)?.join(" ")}</p>
                  </div>
                  <Campo id="reg-2fa" etiqueta="Código de la aplicación" inputMode="numeric" autoComplete="one-time-code" value={codigo2fa} onChange={(e) => setCodigo2fa(e.target.value)} />
                  <Boton type="submit" variante="accion" className="w-full">
                    Verificar código
                  </Boton>
                </>
              ) : (
                <>
                  <Aviso titulo="Verificación activada">Ahora guarda tus códigos de recuperación.</Aviso>
                  <div>
                    <p className="font-semibold">Códigos de recuperación</p>
                    <p className="text-sm text-tenue">Si pierdes el teléfono, entras con uno de estos. Cada uno sirve una vez. Guárdalos fuera del teléfono; no los volverás a ver.</p>
                    <ul className="cifras mt-3 grid grid-cols-2 gap-2 font-mono">
                      {codigos.map((c) => (
                        <li key={c} className="rounded-control bg-hundido px-3 py-2 text-center">
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Casilla id="reg-guarde" etiqueta="Guardé mis códigos de recuperación" checked={guardoCodigos} onChange={(e) => setGuardoCodigos(e.target.checked)} />
                  <Boton type="submit" variante="accion" className="w-full" cargando={cargando} textoCargando="Guardando">
                    Continuar
                  </Boton>
                </>
              )}
              <p className="flex items-center gap-2 text-sm text-tenue">
                <ShieldCheck size={16} aria-hidden />
                En el boceto sirve cualquier código de 6 números.
              </p>
            </form>
          </Paso>
        )}

        {paso === 3 && (
          <Paso titulo="Datos de tu empresa" descripcion="Los revisamos antes de publicar tu catálogo. Así evitamos que alguien se haga pasar por otra empresa.">
            <form onSubmit={enviarEmpresa} noValidate className="space-y-4">
              <Campo id="emp-razon" etiqueta="Razón social" value={empresa.razonSocial} onChange={(e) => setEmpresa({ ...empresa, razonSocial: e.target.value })} ayuda="Como aparece en el RIF." />
              <Campo id="emp-rif" etiqueta="RIF" value={empresa.rif} onChange={(e) => setEmpresa({ ...empresa, rif: e.target.value })} ayuda="J-12345678-9" />
              <Campo id="emp-nombre" etiqueta="Nombre comercial" value={empresa.nombre} onChange={(e) => setEmpresa({ ...empresa, nombre: e.target.value })} ayuda="El que verán tus clientes en el catálogo." />
              <Selector
                id="emp-rubro"
                etiqueta="Rubro"
                value={empresa.rubro}
                onChange={(e) => setEmpresa({ ...empresa, rubro: e.target.value })}
                opciones={RUBROS.map((r) => ({ valor: r.valor, texto: r.texto }))}
                ayuda={rubro.categorias.length ? `Te dejamos estas categorías para empezar: ${rubro.categorias.join(", ")}.` : "Crearás tus categorías en el panel."}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo id="emp-ciudad" etiqueta="Ciudad" value={empresa.ciudad} onChange={(e) => setEmpresa({ ...empresa, ciudad: e.target.value })} autoComplete="address-level2" />
                <Campo
                  id="emp-whatsapp"
                  etiqueta="WhatsApp de pedidos"
                  type="tel"
                  inputMode="tel"
                  value={empresa.whatsapp}
                  onChange={(e) => setEmpresa({ ...empresa, whatsapp: e.target.value })}
                  ayuda="+58 414 1234567"
                />
              </div>
              <Campo id="emp-direccion" etiqueta="Dirección" value={empresa.direccion} onChange={(e) => setEmpresa({ ...empresa, direccion: e.target.value })} autoComplete="street-address" />
              <Campo
                id="emp-redes"
                etiqueta="Instagram o página web"
                opcional
                value={empresa.redes}
                onChange={(e) => setEmpresa({ ...empresa, redes: e.target.value })}
                ayuda="Nos ayuda a verificar que la empresa es tuya."
              />
              <Boton type="submit" variante="accion" className="w-full" cargando={cargando} textoCargando="Guardando">
                Continuar
              </Boton>
            </form>
          </Paso>
        )}

        {paso === 4 && (
          <Paso titulo="El enlace de tu catálogo" descripcion="Es lo que vas a compartir con tus clientes. Se puede cambiar después, pero los enlaces viejos dejarían de funcionar.">
            <form onSubmit={terminar} noValidate className="space-y-4">
              <Campo id="emp-enlace" etiqueta="Enlace" value={enlace} onChange={(e) => setEnlace(e.target.value)} />
              <p className="cifras break-all rounded-control bg-hundido px-3 py-2 text-sm" aria-live="polite">
                vitrina.app/c/<span className="font-semibold">{propuesto || "tu-empresa"}</span>
                {propuesto.length >= 3 && <span className={`block font-semibold ${tomado(propuesto) ? "text-peligro" : "text-exito"}`}>{tomado(propuesto) ? "Ya está en uso" : "Disponible"}</span>}
              </p>
              <Aviso titulo="Qué pasa ahora">
                Tu empresa queda en revisión. Mientras tanto ya puedes cargar productos en el panel. Te escribimos al correo cuando la aprobemos; desde ese día corre tu mes gratis.
              </Aviso>
              <Boton type="submit" variante="accion" className="w-full" cargando={cargando} textoCargando="Enviando solicitud">
                Enviar solicitud y entrar al panel
              </Boton>
            </form>
          </Paso>
        )}
      </main>
    </>
  );
}
