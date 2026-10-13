"use client";

import { ChevronLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { authCliente, mensajeError } from "@/lib/auth-cliente";
import { enlaceDisponible, registrarEmpresa } from "@/modulos/empresas/registro";
import { aSlug, datosEmpresa, erroresPorCampo, RUBROS } from "@/modulos/empresas/validacion";
import { Boton } from "@/ui/Boton";
import { Campo } from "@/ui/Campo";
import { Aviso, ResumenErrores } from "@/ui/piezas";
import { Casilla, Selector } from "@/ui/Selector";

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASOS = ["Cuenta", "Correo", "Doble factor", "Empresa", "Enlace"];

type Errores = Record<string, string>;

function Paso({ titulo, descripcion, children }: { titulo: string; descripcion?: ReactNode; children: ReactNode }) {
  return (
    <>
      <h1 tabIndex={-1} className="mt-2 text-2xl font-bold outline-none">
        {titulo}
      </h1>
      {descripcion && <div className="mt-1 text-tenue">{descripcion}</div>}
      <div className="mt-6">{children}</div>
    </>
  );
}

export function Asistente({ pasoInicial, correoInicial, dominio }: { pasoInicial: number; correoInicial: string; dominio: string }) {
  const router = useRouter();
  const [paso, setPaso] = useState(pasoInicial);
  const [errores, setErrores] = useState<Errores>({});
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const [cuenta, setCuenta] = useState({ nombre: "", correo: correoInicial, clave: "", repetir: "", terminos: false });
  const [codigoCorreo, setCodigoCorreo] = useState("");
  const [clave2fa, setClave2fa] = useState("");
  const [totp, setTotp] = useState<{ uri: string; codigos: string[] } | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [codigo2fa, setCodigo2fa] = useState("");
  const [verificado2fa, setVerificado2fa] = useState(false);
  const [guardoCodigos, setGuardoCodigos] = useState(false);
  const [empresa, setEmpresa] = useState({ razonSocial: "", rif: "", nombre: "", rubro: "ferreteria", ciudad: "", direccion: "", whatsapp: "", redes: "" });
  const [enlace, setEnlace] = useState("");
  const [chequeo, setChequeo] = useState<{ slug: string; libre: boolean } | null>(null);
  const primerRender = useRef(true);

  // Al cambiar de paso, el foco va al título para que el lector de pantalla anuncie dónde está
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    document.querySelector<HTMLElement>("main h1")?.focus();
  }, [paso]);

  useEffect(() => {
    if (!totp) return;
    QRCode.toString(totp.uri, { type: "svg", margin: 1, color: { dark: "#1e293b", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [totp]);

  const propuesto = aSlug(enlace);
  // Disponibilidad consultada al dejar de escribir; solo vale para el enlace que se consultó
  useEffect(() => {
    if (propuesto.length < 3) return;
    const t = setTimeout(() => void enlaceDisponible(propuesto).then((libre) => setChequeo({ slug: propuesto, libre })), 350);
    return () => clearTimeout(t);
  }, [propuesto]);
  const libre = chequeo?.slug === propuesto ? chequeo.libre : null;

  const fallar = (err: Errores) => {
    setErrores(err);
    if (Object.keys(err).length) {
      requestAnimationFrame(() => document.getElementById("errores")?.focus());
      return true;
    }
    return false;
  };

  const ir = (n: number) => {
    setErrores({});
    setAviso(null);
    setPaso(n);
  };

  const crearCuenta = async (e: FormEvent) => {
    e.preventDefault();
    const err: Errores = {};
    if (cuenta.nombre.trim().length < 3) err["reg-nombre"] = "Escribe tu nombre.";
    if (!CORREO.test(cuenta.correo.trim())) err["reg-correo"] = "Escribe un correo válido.";
    const local = cuenta.correo.split("@")[0]?.toLowerCase() ?? "";
    if (cuenta.clave.length < 12) err["reg-clave"] = "La contraseña debe tener al menos 12 caracteres.";
    else if (local.length >= 4 && cuenta.clave.toLowerCase().includes(local)) err["reg-clave"] = "La contraseña no puede contener tu correo.";
    if (cuenta.repetir !== cuenta.clave) err["reg-repetir"] = "Las contraseñas no coinciden.";
    if (!cuenta.terminos) err["reg-terminos"] = "Acepta los términos y la política de privacidad para continuar.";
    if (fallar(err)) return;
    setCargando(true);
    const r = await authCliente.signUp.email({ name: cuenta.nombre.trim(), email: cuenta.correo.trim().toLowerCase(), password: cuenta.clave });
    setCargando(false);
    if (r.error) return fallar({ "reg-correo": mensajeError(r.error) });
    setClave2fa(cuenta.clave);
    ir(1);
  };

  const verificarCorreo = async (e: FormEvent) => {
    e.preventDefault();
    if (fallar(/^\d{6}$/.test(codigoCorreo.trim()) ? {} : { "reg-codigo-correo": "El código tiene 6 números." })) return;
    setCargando(true);
    const r = await authCliente.emailOtp.verifyEmail({ email: cuenta.correo.trim().toLowerCase(), otp: codigoCorreo.trim() });
    setCargando(false);
    if (r.error) return fallar({ "reg-codigo-correo": mensajeError(r.error) });
    ir(2);
  };

  const reenviar = async () => {
    await authCliente.emailOtp.sendVerificationOtp({ email: cuenta.correo.trim().toLowerCase(), type: "email-verification" });
    setAviso(`Te enviamos un código nuevo a ${cuenta.correo}.`);
  };

  const prepararDobleFactor = async (e: FormEvent) => {
    e.preventDefault();
    if (fallar(clave2fa.length >= 12 ? {} : { "reg-clave-2fa": "Escribe tu contraseña para activar la verificación." })) return;
    setCargando(true);
    const r = await authCliente.twoFactor.enable({ password: clave2fa, issuer: "Vitrina" });
    setCargando(false);
    // Vitrina usa aplicación autenticadora (TOTP); la respuesta trae el URI del QR y los códigos de recuperación
    if (r.error || !r.data || r.data.method !== "totp") return fallar({ "reg-clave-2fa": mensajeError(r.error) });
    setTotp({ uri: r.data.totpURI, codigos: r.data.backupCodes });
    setErrores({});
  };

  const verificarDobleFactor = async (e: FormEvent) => {
    e.preventDefault();
    if (!verificado2fa) {
      if (fallar(/^\d{6}$/.test(codigo2fa.trim()) ? {} : { "reg-2fa": "Escribe el código de 6 números que muestra tu aplicación." })) return;
      setCargando(true);
      const r = await authCliente.twoFactor.verifyTotp({ code: codigo2fa.trim() });
      setCargando(false);
      if (r.error) return fallar({ "reg-2fa": mensajeError(r.error) });
      setVerificado2fa(true);
      setErrores({});
      return;
    }
    if (!fallar(guardoCodigos ? {} : { "reg-guarde": "Confirma que guardaste los códigos de recuperación." })) {
      setClave2fa("");
      ir(3);
    }
  };

  const datosCompletos = () => ({ ...empresa, slug: enlace || empresa.nombre });

  const revisarEmpresa = (e: FormEvent) => {
    e.preventDefault();
    const r = datosEmpresa.omit({ slug: true }).safeParse(empresa);
    if (!r.success) return fallar(Object.fromEntries(Object.entries(erroresPorCampo(r.error)).map(([k, v]) => [`emp-${k}`, v])));
    if (!enlace) setEnlace(aSlug(empresa.nombre));
    ir(4);
  };

  const terminar = async (e: FormEvent) => {
    e.preventDefault();
    if (propuesto.length < 3) return fallar({ "emp-slug": "El enlace necesita al menos 3 letras o números." });
    if (libre === false) return fallar({ "emp-slug": `El enlace /c/${propuesto} ya está en uso. Prueba con la ciudad al final.` });
    setCargando(true);
    const r = await registrarEmpresa(datosCompletos());
    if (!r.ok) {
      setCargando(false);
      return fallar(r.campos ? Object.fromEntries(Object.entries(r.campos).map(([k, v]) => [`emp-${k}`, v])) : { general: r.error });
    }
    router.push("/panel");
    router.refresh();
  };

  const rubro = RUBROS.find((r) => r.valor === empresa.rubro)!;

  return (
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

      {paso === 4 && (
        <button type="button" onClick={() => ir(3)} className="-ml-2 mt-2 inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-sm font-semibold hover:bg-hundido">
          <ChevronLeft size={18} aria-hidden />
          Volver
        </button>
      )}

      <div className="mt-2 space-y-4">
        <ResumenErrores errores={errores} />
        {aviso && <Aviso>{aviso}</Aviso>}
      </div>

      {paso === 0 && (
        <Paso titulo="Registra tu empresa" descripcion="Primero tu cuenta personal: con ella entras al panel. Después, los datos de la empresa.">
          <form onSubmit={crearCuenta} noValidate className="space-y-4">
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
                  <Link href="/terminos" target="_blank" className="font-semibold text-accion underline underline-offset-2">
                    Términos
                  </Link>{" "}
                  y{" "}
                  <Link href="/privacidad" target="_blank" className="font-semibold text-accion underline underline-offset-2">
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
              <Link href="/panel/entrar" className="font-semibold text-accion underline underline-offset-2">
                Entra al panel
              </Link>
            </p>
          </form>
        </Paso>
      )}

      {paso === 1 && (
        <Paso titulo="Verifica tu correo" descripcion={`Te enviamos un código de 6 números a ${cuenta.correo}. Vence en 15 minutos.`}>
          <form onSubmit={verificarCorreo} noValidate className="space-y-4">
            <Campo id="reg-codigo-correo" etiqueta="Código del correo" inputMode="numeric" autoComplete="one-time-code" value={codigoCorreo} onChange={(e) => setCodigoCorreo(e.target.value)} />
            <Boton type="submit" variante="accion" className="w-full" cargando={cargando} textoCargando="Verificando">
              Verificar correo
            </Boton>
            <Boton variante="fantasma" className="w-full" onClick={reenviar}>
              No me llegó: enviar otro código
            </Boton>
          </form>
        </Paso>
      )}

      {paso === 2 && (
        <Paso titulo="Activa la verificación en dos pasos" descripcion="Es obligatoria en las cuentas de empresa: aunque alguien adivine tu contraseña, no entra sin tu teléfono.">
          {!totp ? (
            <form onSubmit={prepararDobleFactor} noValidate className="space-y-4">
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                <li>Instala una aplicación autenticadora en tu teléfono (Google Authenticator, Microsoft Authenticator, 2FAS u otra).</li>
                <li>Confirma tu contraseña para generar tu código QR.</li>
              </ol>
              <Campo id="reg-clave-2fa" etiqueta="Tu contraseña" type="password" autoComplete="current-password" value={clave2fa} onChange={(e) => setClave2fa(e.target.value)} />
              <Boton type="submit" variante="accion" className="w-full" cargando={cargando} textoCargando="Generando">
                Generar mi código QR
              </Boton>
            </form>
          ) : (
            <form onSubmit={verificarDobleFactor} noValidate className="space-y-5">
              {!verificado2fa ? (
                <>
                  <p className="text-sm">Escanea este código con la aplicación y escribe el código de 6 números que te muestra.</p>
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
                    <p className="cifras mt-1 break-all rounded-control bg-hundido px-3 py-2 font-mono text-sm">
                      {new URL(totp.uri).searchParams.get("secret")?.match(/.{1,4}/g)?.join(" ")}
                    </p>
                  </div>
                  <Campo id="reg-2fa" etiqueta="Código de la aplicación" inputMode="numeric" autoComplete="one-time-code" value={codigo2fa} onChange={(e) => setCodigo2fa(e.target.value)} />
                  <Boton type="submit" variante="accion" className="w-full" cargando={cargando} textoCargando="Verificando">
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
                      {totp.codigos.map((c) => (
                        <li key={c} className="rounded-control bg-hundido px-3 py-2 text-center">
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Casilla id="reg-guarde" etiqueta="Guardé mis códigos de recuperación" checked={guardoCodigos} onChange={(e) => setGuardoCodigos(e.target.checked)} />
                  <Boton type="submit" variante="accion" className="w-full">
                    Continuar
                  </Boton>
                </>
              )}
              <p className="flex items-center gap-2 text-sm text-tenue">
                <ShieldCheck size={16} aria-hidden />
                Vitrina guarda la clave cifrada; nadie del equipo puede verla.
              </p>
            </form>
          )}
        </Paso>
      )}

      {paso === 3 && (
        <Paso titulo="Datos de tu empresa" descripcion="Los revisamos antes de publicar tu catálogo. Así evitamos que alguien se haga pasar por otra empresa.">
          <form onSubmit={revisarEmpresa} noValidate className="space-y-4">
            <Campo id="emp-razonSocial" etiqueta="Razón social" value={empresa.razonSocial} onChange={(e) => setEmpresa({ ...empresa, razonSocial: e.target.value })} ayuda="Como aparece en el RIF." />
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
              <Campo id="emp-whatsapp" etiqueta="WhatsApp de pedidos" type="tel" inputMode="tel" value={empresa.whatsapp} onChange={(e) => setEmpresa({ ...empresa, whatsapp: e.target.value })} ayuda="+58 414 1234567" />
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
            <Boton type="submit" variante="accion" className="w-full">
              Continuar
            </Boton>
          </form>
        </Paso>
      )}

      {paso === 4 && (
        <Paso titulo="El enlace de tu catálogo" descripcion="Es lo que vas a compartir con tus clientes. Se puede cambiar después, pero los enlaces viejos dejarían de funcionar.">
          <form onSubmit={terminar} noValidate className="space-y-4">
            <Campo id="emp-slug" etiqueta="Enlace" value={enlace} onChange={(e) => setEnlace(e.target.value)} />
            <p className="cifras break-all rounded-control bg-hundido px-3 py-2 text-sm" aria-live="polite">
              {dominio}/c/<span className="font-semibold">{propuesto || "tu-empresa"}</span>
              {libre != null && <span className={`block font-semibold ${libre ? "text-exito" : "text-peligro"}`}>{libre ? "Disponible" : "Ya está en uso"}</span>}
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
  );
}
