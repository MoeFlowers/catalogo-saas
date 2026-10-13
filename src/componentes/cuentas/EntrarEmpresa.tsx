"use client";

import { ChevronLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authCliente, mensajeError } from "@/lib/auth-cliente";
import { Boton } from "@/ui/Boton";
import { Campo } from "@/ui/Campo";
import { Aviso, ResumenErrores } from "@/ui/piezas";
import { Casilla } from "@/ui/Selector";

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Entrada con correo, contraseña y verificación en dos pasos. La usan el panel y la administración. */
export function EntrarEmpresa({ titulo, descripcion, destino, registro = true }: { titulo: string; descripcion: string; destino: string; registro?: boolean }) {
  const router = useRouter();
  const [paso, setPaso] = useState<"clave" | "codigo">("clave");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [codigo, setCodigo] = useState("");
  const [recuperacion, setRecuperacion] = useState(false);
  const [confiar, setConfiar] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(false);

  const fallar = (e: Record<string, string>) => {
    setErrores(e);
    requestAnimationFrame(() => document.getElementById("errores")?.focus());
  };

  const entrar = async (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!CORREO.test(correo.trim())) err.correo = "Escribe un correo válido.";
    if (!clave) err.clave = "Escribe tu contraseña.";
    if (Object.keys(err).length) return fallar(err);
    setCargando(true);
    const r = await authCliente.signIn.email({ email: correo.trim().toLowerCase(), password: clave });
    setCargando(false);
    if (r.error) return fallar({ clave: mensajeError(r.error) });
    setErrores({});
    // Con doble factor activo, la sesión no se abre hasta verificar el código
    if (r.data && "twoFactorRedirect" in r.data && r.data.twoFactorRedirect) {
      setPaso("codigo");
      requestAnimationFrame(() => document.getElementById("codigo")?.focus());
      return;
    }
    router.push(destino);
    router.refresh();
  };

  const verificar = async (e: FormEvent) => {
    e.preventDefault();
    const limpio = codigo.replace(/\s/g, "");
    if (!(recuperacion ? limpio.length >= 8 : /^\d{6}$/.test(limpio))) {
      return fallar({ codigo: recuperacion ? "Escribe uno de tus códigos de recuperación." : "El código tiene 6 números." });
    }
    setCargando(true);
    const r = recuperacion
      ? await authCliente.twoFactor.verifyBackupCode({ code: limpio, trustDevice: confiar })
      : await authCliente.twoFactor.verifyTotp({ code: limpio, trustDevice: confiar });
    if (r.error) {
      setCargando(false);
      return fallar({ codigo: mensajeError(r.error) });
    }
    router.push(destino);
    router.refresh();
  };

  return (
    <main id="contenido" tabIndex={-1} className="mx-auto max-w-md px-4 py-10 outline-none">
      <Link href="/" className="text-lg font-bold">
        Vitrina
      </Link>
      <div className="mt-4">
        <ResumenErrores errores={errores} />
      </div>
      {paso === "clave" ? (
        <>
          <h1 className="mt-4 text-2xl font-bold">{titulo}</h1>
          <p className="mt-1 text-tenue">{descripcion}</p>
          <form onSubmit={entrar} noValidate className="mt-6 space-y-4">
            <Campo id="correo" etiqueta="Correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} error={errores.correo} autoComplete="username" />
            <Campo id="clave" etiqueta="Contraseña" type="password" value={clave} onChange={(e) => setClave(e.target.value)} error={errores.clave} autoComplete="current-password" />
            <Boton type="submit" variante="accion" className="w-full" cargando={cargando} textoCargando="Verificando">
              Continuar
            </Boton>
          </form>
          <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
            <Link href="/recuperar" className="inline-flex min-h-11 items-center font-semibold text-accion underline underline-offset-2">
              Olvidé mi contraseña
            </Link>
            {registro && (
              <Link href="/registro" className="inline-flex min-h-11 items-center font-semibold text-accion underline underline-offset-2">
                Registrar mi empresa
              </Link>
            )}
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              setPaso("clave");
              setErrores({});
            }}
            className="-ml-2 mt-2 inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-sm font-semibold hover:bg-hundido"
          >
            <ChevronLeft size={18} aria-hidden />
            Cambiar de cuenta
          </button>
          <ShieldCheck size={28} className="mt-4 text-accion" aria-hidden />
          <h1 className="mt-2 text-2xl font-bold">Verificación en dos pasos</h1>
          <p className="mt-1 text-tenue">
            {recuperacion
              ? "Escribe uno de los códigos de recuperación que guardaste. Cada código sirve una sola vez."
              : "Abre tu aplicación autenticadora y escribe el código de 6 números de Vitrina."}
          </p>
          <form onSubmit={verificar} noValidate className="mt-6 space-y-4">
            <Campo
              id="codigo"
              etiqueta={recuperacion ? "Código de recuperación" : "Código de verificación"}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              error={errores.codigo}
              inputMode={recuperacion ? "text" : "numeric"}
              autoComplete="one-time-code"
            />
            <Casilla
              id="confiar"
              checked={confiar}
              onChange={(e) => setConfiar(e.target.checked)}
              etiqueta="No pedir el código en este dispositivo por 30 días"
              descripcion="Solo en un teléfono o computadora que nadie más usa."
            />
            <Boton type="submit" variante="accion" className="w-full" cargando={cargando} textoCargando="Entrando">
              Entrar
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
      {paso === "clave" && (
        <div className="mt-8">
          <Aviso>Las cuentas de empresa siempre piden la verificación en dos pasos. Si es tu primera vez, la activas después de entrar.</Aviso>
        </div>
      )}
    </main>
  );
}
