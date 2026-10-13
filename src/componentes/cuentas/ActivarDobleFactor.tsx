"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useEffect, useState, type FormEvent } from "react";
import { authCliente, mensajeError } from "@/lib/auth-cliente";
import { Boton } from "@/ui/Boton";
import { Campo } from "@/ui/Campo";
import { Aviso, ResumenErrores } from "@/ui/piezas";
import { Casilla } from "@/ui/Selector";

/** Activa la aplicación autenticadora: contraseña, QR, código de prueba y códigos de recuperación */
export function ActivarDobleFactor({ volver }: { volver: string }) {
  const router = useRouter();
  const [clave, setClave] = useState("");
  const [totp, setTotp] = useState<{ uri: string; codigos: string[] } | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [verificado, setVerificado] = useState(false);
  const [guardo, setGuardo] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!totp) return;
    QRCode.toString(totp.uri, { type: "svg", margin: 1, color: { dark: "#1e293b", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [totp]);

  const fallar = (e: Record<string, string>) => {
    setErrores(e);
    requestAnimationFrame(() => document.getElementById("errores")?.focus());
  };

  const generar = async (e: FormEvent) => {
    e.preventDefault();
    if (!clave) return fallar({ "df-clave": "Escribe tu contraseña." });
    setCargando(true);
    const r = await authCliente.twoFactor.enable({ password: clave, issuer: "Vitrina" });
    setCargando(false);
    if (r.error || !r.data || r.data.method !== "totp") return fallar({ "df-clave": mensajeError(r.error) });
    setClave("");
    setErrores({});
    setTotp({ uri: r.data.totpURI, codigos: r.data.backupCodes });
  };

  const verificar = async (e: FormEvent) => {
    e.preventDefault();
    if (!verificado) {
      if (!/^\d{6}$/.test(codigo.trim())) return fallar({ "df-codigo": "Escribe el código de 6 números que muestra tu aplicación." });
      setCargando(true);
      const r = await authCliente.twoFactor.verifyTotp({ code: codigo.trim() });
      setCargando(false);
      if (r.error) return fallar({ "df-codigo": mensajeError(r.error) });
      setErrores({});
      setVerificado(true);
      return;
    }
    if (!guardo) return fallar({ "df-guarde": "Confirma que guardaste los códigos de recuperación." });
    router.push(volver);
    router.refresh();
  };

  return (
    <main id="contenido" tabIndex={-1} className="mx-auto max-w-md px-4 py-10 outline-none">
      <ShieldCheck size={28} className="text-accion" aria-hidden />
      <h1 className="mt-2 text-2xl font-bold">Activa la verificación en dos pasos</h1>
      <p className="mt-1 text-tenue">Es obligatoria para entrar al panel: aunque alguien adivine tu contraseña, no entra sin tu teléfono.</p>
      <div className="mt-4">
        <ResumenErrores errores={errores} />
      </div>
      {!totp ? (
        <form onSubmit={generar} noValidate className="mt-6 space-y-4">
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>Instala una aplicación autenticadora (Google Authenticator, Microsoft Authenticator, 2FAS u otra).</li>
            <li>Confirma tu contraseña para generar tu código QR.</li>
          </ol>
          <Campo id="df-clave" etiqueta="Tu contraseña" type="password" autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} />
          <Boton type="submit" variante="accion" className="w-full" cargando={cargando} textoCargando="Generando">
            Generar mi código QR
          </Boton>
        </form>
      ) : (
        <form onSubmit={verificar} noValidate className="mt-6 space-y-5">
          {!verificado ? (
            <>
              <p className="text-sm">Escanea el código con la aplicación y escribe el código de 6 números que te muestra.</p>
              {qr && (
                <div
                  className="mx-auto w-48 rounded-control border border-linea bg-white p-2 [&_svg]:h-auto [&_svg]:w-full"
                  role="img"
                  aria-label="Código QR para la aplicación autenticadora"
                  dangerouslySetInnerHTML={{ __html: qr }}
                />
              )}
              <div>
                <p className="text-sm font-semibold">Clave para escribir a mano</p>
                <p className="cifras mt-1 break-all rounded-control bg-hundido px-3 py-2 font-mono text-sm">
                  {new URL(totp.uri).searchParams.get("secret")?.match(/.{1,4}/g)?.join(" ")}
                </p>
              </div>
              <Campo id="df-codigo" etiqueta="Código de la aplicación" inputMode="numeric" autoComplete="one-time-code" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
              <Boton type="submit" variante="accion" className="w-full" cargando={cargando} textoCargando="Verificando">
                Verificar código
              </Boton>
            </>
          ) : (
            <>
              <Aviso titulo="Verificación activada">Guarda tus códigos de recuperación antes de seguir.</Aviso>
              <ul className="cifras grid grid-cols-2 gap-2 font-mono">
                {totp.codigos.map((c) => (
                  <li key={c} className="rounded-control bg-hundido px-3 py-2 text-center">
                    {c}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-tenue">Cada código sirve una vez. Guárdalos fuera del teléfono; no los volverás a ver.</p>
              <Casilla id="df-guarde" etiqueta="Guardé mis códigos de recuperación" checked={guardo} onChange={(e) => setGuardo(e.target.checked)} />
              <Boton type="submit" variante="accion" className="w-full">
                Continuar
              </Boton>
            </>
          )}
        </form>
      )}
    </main>
  );
}
