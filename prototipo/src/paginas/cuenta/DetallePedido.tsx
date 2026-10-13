import { ChevronLeft } from "lucide-react";
import type { CSSProperties } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useCarrito } from "../../estado/carrito";
import { useDatos, useEmpresaPorSlug, usePedido } from "../../estado/datos";
import { EXPLICACION_ESTADO, NOMBRE_ESTADO } from "../../estado/pedidos";
import { useSesion } from "../../estado/sesion";
import { marcaSegura } from "../../lib/color";
import { formatear, formatearFecha, formatearTasa, refUsd } from "../../lib/dinero";
import { mensajeWhatsApp, NOMBRE_ENTREGA, numeroPedido } from "../../lib/pedido";
import { Boton, clasesBoton } from "../../ui/Boton";
import { Aviso } from "../../ui/piezas";
import { enlacePedido, IconoWhatsApp } from "../catalogo/PedidoEnviado";
import { NoEncontrado } from "../NoEncontrado";
import { InsigniaEstado } from "./MisPedidos";

export function DetallePedido() {
  const { id } = useParams();
  const navegar = useNavigate();
  const pedido = usePedido(id);
  const correo = useSesion((s) => s.comprador?.correo);
  const productos = useDatos((s) => s.productos);
  const marcarAbierto = useDatos((s) => s.marcarWhatsappAbierto);
  const reemplazar = useCarrito((s) => s.reemplazar);
  const empresa = useEmpresaPorSlug(pedido?.empresa);
  if (!pedido || !empresa || pedido.compradorCorreo !== correo) return <NoEncontrado />;

  const tasasPedido = { bcv: pedido.tasa, usdt: pedido.tasa, eur: null, fecha: pedido.fechaTasa, origen: "en-vivo" as const };
  const { marca, texto } = marcaSegura(empresa.color);
  const disponibles = pedido.items.filter((i) => productos.some((p) => p.id === i.productoId && p.activo));

  const repetir = () => {
    reemplazar(
      empresa.slug,
      disponibles.map((i) => ({ productoId: i.productoId, varianteId: i.varianteId, presentacionId: i.presentacionId, cantidad: i.cantidad })),
    );
    navegar(`/c/${empresa.slug}/pedido`);
  };

  return (
    <div style={{ "--marca": marca, "--marca-texto": texto } as CSSProperties}>
      <Link to="/cuenta" className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-sm font-semibold hover:bg-hundido">
        <ChevronLeft size={18} aria-hidden />
        Mis pedidos
      </Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="cifras text-sm font-semibold text-tenue">
            {numeroPedido(pedido.numero)}, {formatearFecha(pedido.fecha, true)}
          </p>
          <h1 className="text-2xl font-bold">{empresa.nombre}</h1>
        </div>
        <InsigniaEstado estado={pedido.estado} />
      </div>
      <p className="mt-2 text-tenue">{EXPLICACION_ESTADO[pedido.estado]}</p>
      {pedido.demostracion && (
        <div className="mt-4">
          <Aviso>Pedido de demostración, creado para que el historial no arranque vacío. Usa una tasa redonda de prueba.</Aviso>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Boton variante="marca" onClick={repetir} disabled={disponibles.length === 0}>
          Repetir pedido con precios de hoy
        </Boton>
        {pedido.estado === "pendiente" && (
          <a
            href={`https://wa.me/?text=${encodeURIComponent(mensajeWhatsApp(pedido, empresa, enlacePedido(pedido.id)))}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => marcarAbierto(pedido.id)}
            className={clasesBoton("secundario")}
          >
            <IconoWhatsApp />
            Enviar de nuevo por WhatsApp
          </a>
        )}
      </div>

      <section aria-labelledby="titulo-productos" className="mt-8">
        <h2 id="titulo-productos" className="text-lg font-bold">
          Productos
        </h2>
        <ul className="mt-2 divide-y divide-linea border-y border-linea">
          {pedido.items.map((i) => (
            <li key={`${i.productoId}-${i.varianteId}-${i.presentacionId}`} className="flex justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="font-semibold leading-snug">
                  <span className="cifras">{i.cantidad} x </span>
                  {i.nombre}
                </p>
                <p className="cifras text-sm text-tenue">
                  {i.detalle}. Código {i.sku}
                </p>
              </div>
              <p className="cifras shrink-0 text-right font-semibold">{formatear(i.totalBsCent, "VES")}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3 text-right">
          <p className="cifras text-xl font-bold">Total {formatear(pedido.totalBsCent, "VES")}</p>
          <p className="cifras text-sm text-tenue">
            Ref. {formatear(refUsd(pedido.totalBsCent, tasasPedido), "USD")}. Tasa BCV {formatearTasa(pedido.tasa)} del {formatearFecha(pedido.fechaTasa)}.
          </p>
        </div>
      </section>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <section aria-labelledby="titulo-entrega">
          <h2 id="titulo-entrega" className="text-lg font-bold">
            Entrega
          </h2>
          <p className="mt-1">{NOMBRE_ENTREGA[pedido.entrega]}</p>
          {pedido.destino && <p className="text-tenue">{pedido.destino}</p>}
          {pedido.nota && <p className="mt-2 text-sm text-tenue">Nota: {pedido.nota}</p>}
        </section>
        <section aria-labelledby="titulo-historial">
          <h2 id="titulo-historial" className="text-lg font-bold">
            Historial
          </h2>
          <ol className="mt-2 space-y-2 border-l border-control pl-4">
            {pedido.historial.map((h) => (
              <li key={h.estado} className="text-sm">
                <span className="font-semibold">{NOMBRE_ESTADO[h.estado]}</span>
                <span className="cifras block text-tenue">{formatearFecha(h.fecha, true)}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
