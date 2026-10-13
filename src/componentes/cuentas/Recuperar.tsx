"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { authCliente, mensajeError } from "@/lib/auth-cliente";
import { Boton } from "@/ui/Boton";
import { Campo } from "@/ui/Campo";
import { Aviso, ResumenErrores } from "@/ui/piezas";

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Cambiar la contraseña con un código enviado al correo */
export function Recuperar() {
  const [paso, setPaso] = useState<"correo" | "codigo" | "listo">("correo");
  const [correo, setCorreo] = useState("");
  const [codigo, setCodigo] = useState("");
  const [clave, setClave] = useState("");
  const [repetir, setRepetir] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(false);

  const fallar = (e: Record<string, string>) => {
    setErrores(e);
    requestAnimationFrame(() => document.getElementById("errores")?.focus());
  };

  const pedir = async (e: FormEvent) => {
    e.preventDefault();
    if (!CORREO.test(correo.trim())) return fallar({ "rec-correo": "Escribe un correo válido." });
    setCargando(true);
    // Responde igual exista o no la cuenta: no revela qué correos están registrados
    await authCliente.forgetPassword.emailOtp({ email: correo.trim().toLowerCase() });
    setCargando(false);
    setErrores({});
    setPaso("codigo");
  };

  const cambiar = async (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!/^\d{6}$/.test(codigo.trim())) err["rec-codigo"] = "El código tiene 6 números.";
    if (clave.length < 12) err["rec-clave"] = "La contraseña nueva debe tener al menos 12 caracteres.";
    if (repetir !== clave) err["rec-repetir"] = "Las contraseñas no coinciden.";
    if (Object.keys(err).length) return fallar(err);
    setCargando(true);
    const r = await authCliente.emailOtp.resetPassword({ email: correo.trim().toLowerCase(), otp: codigo.trim(), password: clave });
    setCargando(false);
    if (r.error) return fallar({ "rec-codigo": mensajeError(r.error) });
    setErrores({});
    setPaso("listo");
  };

  return (
    <main id="contenido" tabIndex={-1} className="mx-auto max-w-md px-4 py-10 outline-none">
      <Link href="/" className="text-lg font-bold">
        Vitrina
      </Link>
      <h1 className="mt-6 text-2xl font-bold">Cambiar la contraseña</h1>
      <div className="mt-4">
        <ResumenErrores errores={errores} />
      </div>
      {paso === "correo" && (
        <form onSubmit={pedir} noValidate className="mt-4 space-y-4">
          <p className="text-tenue">Te enviamos un código al correo de tu cuenta.</p>
          <Campo id="rec-correo" etiqueta="Correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} autoComplete="email" />
          <Boton type="submit" variante="accion" className="w-full" cargando={cargando} textoCargando="Enviando">
            Enviar código
          </Boton>
        </form>
      )}
      {paso === "codigo" && (
        <form onSubmit={cambiar} noValidate className="mt-4 space-y-4">
          <p className="text-tenue">Si {correo} tiene una cuenta, te llegó un código de 6 números. Vence en 15 minutos.</p>
          <Campo id="rec-codigo" etiqueta="Código" inputMode="numeric" autoComplete="one-time-code" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          <Campo id="rec-clave" etiqueta="Contraseña nueva" type="password" autoComplete="new-password" value={clave} onChange={(e) => setClave(e.target.value)} ayuda="Al menos 12 caracteres." />
          <Campo id="rec-repetir" etiqueta="Repite la contraseña nueva" type="password" autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)} />
          <Boton type="submit" variante="accion" className="w-full" cargando={cargando} textoCargando="Cambiando">
            Cambiar contraseña
          </Boton>
        </form>
      )}
      {paso === "listo" && (
        <div className="mt-4 space-y-4">
          <Aviso titulo="Contraseña cambiada">Las demás sesiones se cerraron. Entra con tu contraseña nueva.</Aviso>
          <div className="flex flex-wrap gap-4 text-sm font-semibold">
            <Link href="/panel/entrar" className="inline-flex min-h-11 items-center text-accion underline underline-offset-2">
              Entrar al panel
            </Link>
            <Link href="/entrar" className="inline-flex min-h-11 items-center text-accion underline underline-offset-2">
              Entrar como comprador
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
