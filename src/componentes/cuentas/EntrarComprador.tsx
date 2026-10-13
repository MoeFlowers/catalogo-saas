"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authCliente, mensajeError } from "@/lib/auth-cliente";
import { Boton } from "@/ui/Boton";
import { Campo } from "@/ui/Campo";
import { Aviso, ResumenErrores } from "@/ui/piezas";

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

/** Entrada y registro del comprador. Una cuenta sirve para todos los catálogos. */
export function EntrarComprador({ volver, google }: { volver: string; google: boolean }) {
  const router = useRouter();
  const [modo, setModo] = useState<"entrar" | "crear" | "codigo" | "doble">("entrar");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [codigo, setCodigo] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const vieneDePedido = volver.includes("/pedido");

  const fallar = (e: Record<string, string>) => {
    setErrores(e);
    requestAnimationFrame(() => document.getElementById("errores")?.focus());
  };
  const listo = () => {
    router.push(volver);
    router.refresh();
  };
  const email = () => correo.trim().toLowerCase();

  const pedirCodigo = async () => {
    await authCliente.emailOtp.sendVerificationOtp({ email: email(), type: "email-verification" });
    setModo("codigo");
    setAviso(`Te enviamos un código de 6 números a ${correo}.`);
  };

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (modo === "crear" && nombre.trim().length < 3) err.nombre = "Escribe tu nombre.";
    if (!CORREO.test(correo.trim())) err.correo = "Escribe un correo válido, por ejemplo nombre@dominio.com.";
    if (modo === "crear" ? clave.length < 12 : !clave) err.clave = modo === "crear" ? "La contraseña debe tener al menos 12 caracteres." : "Escribe tu contraseña.";
    if (Object.keys(err).length) return fallar(err);
    setCargando(true);
    setAviso(null);
    if (modo === "crear") {
      const r = await authCliente.signUp.email({ name: nombre.trim(), email: email(), password: clave });
      setCargando(false);
      if (r.error) return fallar({ correo: mensajeError(r.error) });
      setErrores({});
      setModo("codigo");
      setAviso(`Te enviamos un código de 6 números a ${correo}.`);
      return;
    }
    const r = await authCliente.signIn.email({ email: email(), password: clave });
    setCargando(false);
    if (r.error) {
      if (r.error.code === "EMAIL_NOT_VERIFIED") {
        setErrores({});
        return pedirCodigo();
      }
      return fallar({ clave: mensajeError(r.error) });
    }
    if (r.data && "twoFactorRedirect" in r.data && r.data.twoFactorRedirect) {
      setErrores({});
      return setModo("doble");
    }
    listo();
  };

  const verificar = async (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(codigo.trim())) return fallar({ codigo: "El código tiene 6 números." });
    setCargando(true);
    const r = modo === "doble" ? await authCliente.twoFactor.verifyTotp({ code: codigo.trim() }) : await authCliente.emailOtp.verifyEmail({ email: email(), otp: codigo.trim() });
    if (r.error) {
      setCargando(false);
      return fallar({ codigo: mensajeError(r.error) });
    }
    // Tras verificar el correo la sesión ya está abierta; si no, entra con la contraseña
    const sesion = await authCliente.getSession();
    if (!sesion.data && clave) await authCliente.signIn.email({ email: email(), password: clave });
    listo();
  };

  return (
    <main id="contenido" tabIndex={-1} className="mx-auto max-w-md px-4 py-10 outline-none">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="text-lg font-bold">
          Vitrina
        </Link>
        {vieneDePedido && (
          <Link href={volver} className="inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-sm font-semibold hover:bg-hundido">
            <ChevronLeft size={18} aria-hidden />
            Volver al pedido
          </Link>
        )}
      </div>
      <div className="mt-4 space-y-3">
        <ResumenErrores errores={errores} />
        {aviso && <Aviso>{aviso}</Aviso>}
      </div>

      {modo === "codigo" || modo === "doble" ? (
        <>
          <h1 className="mt-4 text-2xl font-bold">{modo === "doble" ? "Verificación en dos pasos" : "Verifica tu correo"}</h1>
          <form onSubmit={verificar} noValidate className="mt-6 space-y-4">
            <Campo
              id="codigo"
              etiqueta={modo === "doble" ? "Código de tu aplicación" : "Código del correo"}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
            <Boton type="submit" variante="accion" className="w-full" cargando={cargando} textoCargando="Verificando">
              Continuar
            </Boton>
            {modo === "codigo" && (
              <Boton variante="fantasma" className="w-full" onClick={pedirCodigo}>
                No me llegó: enviar otro código
              </Boton>
            )}
          </form>
        </>
      ) : (
        <>
          <h1 className="mt-4 text-2xl font-bold">{vieneDePedido ? "Entra para enviar tu pedido" : modo === "crear" ? "Crea tu cuenta" : "Entra a tu cuenta"}</h1>
          <p className="mt-1 text-tenue">Una sola cuenta sirve para comprar en todos los catálogos de Vitrina y ver tus pedidos.</p>
          {google && (
            <>
              <button
                type="button"
                onClick={() => void authCliente.signIn.social({ provider: "google", callbackURL: volver })}
                className="mt-6 flex min-h-12 w-full items-center justify-center gap-3 rounded-control border border-control bg-superficie font-semibold hover:bg-hundido"
              >
                <LogoGoogle />
                Continuar con Google
              </button>
              <div className="my-6 flex items-center gap-3 text-sm text-tenue" aria-hidden>
                <span className="h-px flex-1 bg-linea" />o con tu correo<span className="h-px flex-1 bg-linea" />
              </div>
            </>
          )}
          <form onSubmit={enviar} noValidate className={`space-y-4 ${google ? "" : "mt-6"}`}>
            {modo === "crear" && <Campo id="nombre" etiqueta="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" />}
            <Campo id="correo" etiqueta="Correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} autoComplete="email" />
            <Campo
              id="clave"
              etiqueta="Contraseña"
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              autoComplete={modo === "crear" ? "new-password" : "current-password"}
              ayuda={modo === "crear" ? "Al menos 12 caracteres." : undefined}
            />
            <Boton type="submit" variante="accion" className="w-full" cargando={cargando} textoCargando={modo === "crear" ? "Creando cuenta" : "Entrando"}>
              {modo === "crear" ? "Crear cuenta" : "Entrar"}
            </Boton>
          </form>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
            <button
              type="button"
              onClick={() => {
                setModo(modo === "entrar" ? "crear" : "entrar");
                setErrores({});
              }}
              className="min-h-11 font-semibold text-accion underline underline-offset-2"
            >
              {modo === "entrar" ? "Crear una cuenta" : "Ya tengo cuenta"}
            </button>
            <Link href="/recuperar" className="inline-flex min-h-11 items-center font-semibold text-accion underline underline-offset-2">
              Olvidé mi contraseña
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
