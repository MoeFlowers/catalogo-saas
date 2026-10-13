import { Check, Copy } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useDatos, usePedidosDe, useProductosDe } from "../../estado/datos";
import { formatear, formatearFecha } from "../../lib/dinero";
import { filasInventario } from "../../lib/inventario";
import { numeroPedido } from "../../lib/pedido";
import { Boton, clasesBoton } from "../../ui/Boton";
import { Aviso, TasaDelDia } from "../../ui/piezas";
import { IconoWhatsApp } from "../catalogo/PedidoEnviado";
import { Estado, hace } from "./comun";
import { usePanel } from "./PanelLayout";

export function enlaceCatalogo(slug: string): string {
  return `${window.location.origin}${window.location.pathname}#/c/${slug}`;
}

export function PanelInicio() {
  const { empresa } = usePanel();
  const pedidos = usePedidosDe(empresa.slug);
  const productos = useProductosDe(empresa.slug);
  const pagos = useDatos((s) => s.pagos.filter((p) => p.empresa === empresa.slug && p.estado === "en-revision").length);
  const [qr, setQr] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const enlace = enlaceCatalogo(empresa.slug);
  useEffect(() => {
    QRCode.toString(enlace, { type: "svg", margin: 1, color: { dark: "#1e293b", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [enlace]);

  const porConfirmar = pedidos.filter((p) => p.estado === "pendiente").sort((a, b) => a.fecha.localeCompare(b.fecha));
  const enCurso = pedidos.filter((p) => ["confirmado", "preparacion", "listo", "despachado"].includes(p.estado));
  const bajos = useMemo(() => filasInventario(productos.filter((p) => p.activo)).filter((f) => f.bajo), [productos]);
  const diasPrueba = Math.ceil((new Date(empresa.vence).getTime() - Date.now()) / 86_400_000);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Inicio</h1>

      <div className="mb-6 space-y-3">
        {!empresa.whatsapp && (
          <Aviso tipo="alerta" titulo="Falta tu número de WhatsApp">
            Los pedidos llegan a ese número.{" "}
            <Link to="/panel/catalogo" className="font-semibold underline underline-offset-2">
              Configurarlo en Catálogo
            </Link>
          </Aviso>
        )}
        {!empresa.publicado && (
          <Aviso tipo="alerta" titulo="Tu catálogo está pausado">
            Nadie puede verlo ni pedir.{" "}
            <Link to="/panel/catalogo" className="font-semibold underline underline-offset-2">
              Publicarlo en Catálogo
            </Link>
          </Aviso>
        )}
        {diasPrueba <= 7 && (
          <Aviso tipo={diasPrueba <= 0 ? "error" : "info"} titulo={diasPrueba <= 0 ? "Tu suscripción venció" : `Tu suscripción vence en ${diasPrueba} ${diasPrueba === 1 ? "día" : "días"}`}>
            {pagos > 0 ? "Tu pago está en revisión." : "Reporta tu pago para seguir recibiendo pedidos."}{" "}
            <Link to="/panel/suscripcion" className="font-semibold underline underline-offset-2">
              Ir a Suscripción
            </Link>
          </Aviso>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-8">
          <section aria-labelledby="por-confirmar">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="por-confirmar" className="text-lg font-bold">
                Por confirmar <span className="cifras text-tenue">({porConfirmar.length})</span>
              </h2>
              <Link to="/panel/pedidos" className="text-sm font-semibold text-accion underline underline-offset-2">
                Todos los pedidos
              </Link>
            </div>
            <p className="text-sm text-tenue">Confirmar aparta la mercancía. Los más viejos van primero.</p>
            {porConfirmar.length === 0 ? (
              <p className="mt-3 rounded-tarjeta border border-dashed border-control p-4 text-tenue">No tienes pedidos por confirmar.</p>
            ) : (
              <ul className="mt-3 divide-y divide-linea rounded-tarjeta border border-linea bg-superficie">
                {porConfirmar.map((p) => (
                  <li key={p.id}>
                    <Link to={`/panel/pedidos/${p.id}`} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 px-4 py-3 hover:bg-hundido">
                      <span className="font-semibold">
                        <span className="cifras">{numeroPedido(p.numero)}</span> {p.comprador.nombre}
                      </span>
                      <span className="cifras text-right font-semibold">{formatear(p.totalBsCent, "VES")}</span>
                      <span className="text-sm text-tenue">
                        {hace(p.fecha)}, {p.items.length} {p.items.length === 1 ? "producto" : "productos"}
                        {p.whatsappAbierto ? ", abrió WhatsApp" : <span className="font-semibold text-alerta">, no abrió WhatsApp</span>}
                      </span>
                      <span className="text-right">
                        <Estado estado={p.estado} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {enCurso.length > 0 && (
              <p className="mt-3 text-sm">
                Además tienes{" "}
                <Link to="/panel/pedidos?vista=curso" className="font-semibold text-accion underline underline-offset-2">
                  {enCurso.length} {enCurso.length === 1 ? "pedido en curso" : "pedidos en curso"}
                </Link>{" "}
                por preparar, despachar o entregar.
              </p>
            )}
          </section>

          <section aria-labelledby="stock-bajo">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="stock-bajo" className="text-lg font-bold">
                Stock bajo <span className="cifras text-tenue">({bajos.length})</span>
              </h2>
              <Link to="/panel/inventario?bajo=1" className="text-sm font-semibold text-accion underline underline-offset-2">
                Ver inventario
              </Link>
            </div>
            {bajos.length === 0 ? (
              <p className="mt-3 rounded-tarjeta border border-dashed border-control p-4 text-tenue">Ningún producto está por debajo de su mínimo.</p>
            ) : (
              <ul className="mt-3 divide-y divide-linea rounded-tarjeta border border-linea bg-superficie">
                {bajos.slice(0, 6).map((f) => (
                  <li key={`${f.clave.productoId}-${f.clave.varianteId ?? ""}`} className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{f.nombre}</span>
                      <span className="cifras block text-sm text-tenue">{f.sku}</span>
                    </span>
                    <span className={`cifras shrink-0 text-right text-sm font-semibold ${f.disponible === 0 ? "text-peligro" : "text-alerta"}`}>
                      {f.disponible === 0 ? "Agotado" : `${f.disponible} disponibles`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section aria-labelledby="compartir" className="rounded-tarjeta border border-linea bg-superficie p-4">
            <h2 id="compartir" className="font-bold">
              Comparte tu catálogo
            </h2>
            <p className="mt-1 break-all text-sm text-tenue">{enlace}</p>
            {qr ? (
              <div
                className="mx-auto mt-3 w-40 [&_svg]:h-auto [&_svg]:w-full"
                role="img"
                aria-label={`Código QR del enlace del catálogo de ${empresa.nombre}`}
                dangerouslySetInnerHTML={{ __html: qr }}
              />
            ) : (
              <p className="mt-3 text-sm text-tenue">Generando el código QR.</p>
            )}
            <div className="mt-3 grid gap-2">
              <Boton onClick={copiar}>
                {copiado ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
                <span aria-live="polite">{copiado ? "Enlace copiado" : "Copiar enlace"}</span>
              </Boton>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Mira nuestro catálogo y haz tu pedido: ${enlace}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={clasesBoton("secundario")}
              >
                <IconoWhatsApp />
                Compartir por WhatsApp
              </a>
            </div>
          </section>

          <section aria-labelledby="tasa" className="rounded-tarjeta border border-linea bg-superficie p-4 text-sm">
            <h2 id="tasa" className="font-bold">
              Precios de hoy
            </h2>
            <p className="mt-1">
              <TasaDelDia />
            </p>
            <p className="mt-1 text-tenue">Tus precios en USD se muestran en bolívares con esta tasa. Cada pedido guarda la tasa del día en que se hizo.</p>
          </section>

          <p className="text-sm text-tenue">
            Tu plan vence el {formatearFecha(empresa.vence)}.{" "}
            <Link to="/panel/suscripcion" className="font-semibold text-tinta underline underline-offset-2">
              Ver plan
            </Link>
          </p>
        </aside>
      </div>
    </>
  );
}
