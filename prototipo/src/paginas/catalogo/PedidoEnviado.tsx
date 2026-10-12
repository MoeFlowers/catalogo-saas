import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router";
import { usePedidos } from "../../estado/pedidos";
import { mensajeWhatsApp, numeroPedido } from "../../lib/pedido";
import { Boton, BotonEnlace, clasesBoton } from "../../ui/Boton";
import { Aviso } from "../../ui/piezas";
import { NoEncontrado } from "../NoEncontrado";
import { useEmpresa } from "./CatalogoLayout";

/** Enlace público del pedido. En la app real será vitrina.app/p/{token}. */
export function enlacePedido(id: string): string {
  return `${window.location.origin}${window.location.pathname}#/cuenta/pedidos/${id}`;
}

export function IconoWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="currentColor">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.8h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88zm8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.9 0-3.18-1.24-6.17-3.48-8.4z" />
    </svg>
  );
}

export function PedidoEnviado() {
  const empresa = useEmpresa();
  const { pedidoId } = useParams();
  const pedido = usePedidos((s) => s.lista.find((p) => p.id === pedidoId));
  const [copiado, setCopiado] = useState<"si" | "error" | null>(null);

  if (!pedido || pedido.empresa !== empresa.slug) return <NoEncontrado />;

  const mensaje = mensajeWhatsApp(pedido, empresa, enlacePedido(pedido.id));
  // En el boceto no hay número real: WhatsApp se abre sin destinatario para no escribirle a nadie
  const enlaceWa = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(mensaje);
      setCopiado("si");
    } catch {
      setCopiado("error");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <p className="cifras text-sm font-semibold text-tenue">Pedido {numeroPedido(pedido.numero)}</p>
      <h1 className="mt-1 text-2xl font-bold">Falta un paso: envíalo por WhatsApp</h1>
      <p className="mt-2 text-tenue">
        Tu pedido quedó guardado en tu cuenta. Abre WhatsApp y toca Enviar para que {empresa.nombre} lo reciba y te confirme.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <a href={enlaceWa} target="_blank" rel="noopener noreferrer" className={clasesBoton("marca", "sm:px-6")}>
          <IconoWhatsApp />
          Abrir WhatsApp
        </a>
        <Boton onClick={copiar}>
          {copiado === "si" ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
          <span aria-live="polite">{copiado === "si" ? "Mensaje copiado" : "Copiar mensaje"}</span>
        </Boton>
      </div>
      {copiado === "error" && (
        <p role="alert" className="mt-2 text-sm font-semibold text-peligro">
          Este navegador no dejó copiar. Selecciona el texto de abajo y cópialo a mano.
        </p>
      )}

      <section aria-labelledby="titulo-mensaje" className="mt-8">
        <h2 id="titulo-mensaje" className="text-sm font-semibold">
          Mensaje que se envía
        </h2>
        <pre className="mt-2 whitespace-pre-wrap break-words rounded-control border border-linea bg-superficie p-4 font-sans text-sm leading-relaxed">
          {mensaje}
        </pre>
      </section>

      <div className="mt-6">
        <Aviso titulo="En el boceto">
          WhatsApp se abre sin destinatario para no escribirle a nadie real. En la versión final va directo al número de la empresa.
        </Aviso>
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-linea pt-6 sm:flex-row">
        <BotonEnlace to={`/cuenta/pedidos/${pedido.id}`}>Ver el pedido en mi cuenta</BotonEnlace>
        <BotonEnlace to={`/c/${empresa.slug}`} variante="fantasma">
          Volver al catálogo
        </BotonEnlace>
      </div>
    </div>
  );
}
