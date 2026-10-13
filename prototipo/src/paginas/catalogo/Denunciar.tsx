import { ChevronLeft } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import type { Denuncia } from "../../datos/tipos";
import { useDatos } from "../../estado/datos";
import { useSesion } from "../../estado/sesion";
import { Boton } from "../../ui/Boton";
import { Area, Campo } from "../../ui/Campo";
import { Aviso } from "../../ui/piezas";
import { useEmpresa } from "./CatalogoLayout";

const MOTIVOS: { valor: Denuncia["motivo"]; texto: string }[] = [
  { valor: "estafa", texto: "Creo que es una estafa o se hace pasar por otra empresa" },
  { valor: "ilegal", texto: "Vende productos ilegales, falsificados o robados" },
  { valor: "precios", texto: "Los precios o productos no coinciden con lo que entregan" },
  { valor: "otro", texto: "Otro motivo" },
];

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function Denunciar() {
  const empresa = useEmpresa();
  const comprador = useSesion((s) => s.comprador);
  const denunciar = useDatos((s) => s.denunciar);
  const [motivo, setMotivo] = useState<Denuncia["motivo"] | "">("");
  const [detalle, setDetalle] = useState("");
  const [correo, setCorreo] = useState(comprador?.correo ?? "");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviada, setEnviada] = useState(false);

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!motivo) err["den-motivo-estafa"] = "Elige el motivo.";
    if (detalle.trim().length < 15) err["den-detalle"] = "Cuéntanos qué pasó en al menos una frase.";
    if (!CORREO.test(correo.trim())) err["den-correo"] = "Escribe un correo para poder responderte.";
    setErrores(err);
    const primero = Object.keys(err)[0];
    if (primero) return document.getElementById(primero)?.focus();
    denunciar({ empresa: empresa.slug, motivo: motivo as Denuncia["motivo"], detalle: detalle.trim(), autor: correo.trim() });
    setEnviada(true);
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <Link to={`/c/${empresa.slug}`} className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-sm font-semibold hover:bg-hundido">
        <ChevronLeft size={18} aria-hidden />
        Volver al catálogo
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Reportar este catálogo</h1>
      <p className="mt-1 text-tenue">El reporte llega al equipo de Vitrina, no a {empresa.nombre}. Lo revisamos y, si hace falta, suspendemos el catálogo.</p>

      {enviada ? (
        <div className="mt-6">
          <Aviso titulo="Recibimos tu reporte">Te escribimos a {correo} si necesitamos más datos. Gracias por ayudar a que Vitrina sea segura.</Aviso>
        </div>
      ) : (
        <form onSubmit={enviar} noValidate className="mt-6 space-y-5">
          <fieldset>
            <legend className="text-sm font-semibold">Motivo</legend>
            {errores["den-motivo-estafa"] && <p className="mt-1 text-sm font-medium text-peligro">{errores["den-motivo-estafa"]}</p>}
            <div className="mt-2 space-y-2">
              {MOTIVOS.map((m) => (
                <label key={m.valor} className="flex cursor-pointer gap-3 rounded-control border border-control bg-superficie p-3 has-[:checked]:border-accion has-[:checked]:ring-1 has-[:checked]:ring-accion">
                  <input id={`den-motivo-${m.valor}`} type="radio" name="motivo" checked={motivo === m.valor} onChange={() => setMotivo(m.valor)} className="mt-0.5 size-5 shrink-0 accent-[var(--color-accion)]" />
                  {m.texto}
                </label>
              ))}
            </div>
          </fieldset>
          <Area id="den-detalle" etiqueta="Qué pasó" value={detalle} onChange={(e) => setDetalle(e.target.value)} error={errores["den-detalle"]} rows={4} ayuda="Si tienes un número de pedido, inclúyelo." />
          <Campo id="den-correo" etiqueta="Tu correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} error={errores["den-correo"]} autoComplete="email" />
          <Boton type="submit" variante="accion">
            Enviar reporte
          </Boton>
        </form>
      )}
    </div>
  );
}
