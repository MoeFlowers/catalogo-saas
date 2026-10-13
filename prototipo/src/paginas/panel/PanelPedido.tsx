import { ChevronLeft, Printer } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import type { EstadoPedido } from "../../datos/tipos";
import { SIGUIENTES, useDatos, usePedido } from "../../estado/datos";
import { NOMBRE_ESTADO } from "../../estado/pedidos";
import { mensajeEstado } from "../../lib/avisos";
import { formatear, formatearFecha, formatearTasa, refUsd } from "../../lib/dinero";
import { disponible } from "../../lib/inventario";
import { NOMBRE_ENTREGA, numeroPedido } from "../../lib/pedido";
import { Boton, clasesBoton } from "../../ui/Boton";
import { Campo } from "../../ui/Campo";
import { Dialogo } from "../../ui/Dialogo";
import { Aviso } from "../../ui/piezas";
import { IconoWhatsApp } from "../catalogo/PedidoEnviado";
import { NoEncontrado } from "../NoEncontrado";
import { Encabezado, Estado, hace } from "./comun";
import { usePanel } from "./PanelLayout";

const ACCION: Partial<Record<EstadoPedido, string>> = {
  confirmado: "Confirmar y apartar mercancía",
  preparacion: "Pasar a preparación",
  listo: "Marcar listo para retiro",
  despachado: "Marcar despachado",
  entregado: "Marcar entregado",
};

const EFECTO: Partial<Record<EstadoPedido, string>> = {
  confirmado: "Aparta la mercancía: deja de estar disponible en el catálogo.",
  listo: "Descuenta la mercancía del inventario.",
  despachado: "Descuenta la mercancía del inventario.",
};

/** 0414 1234567 a 584141234567 para wa.me */
export function telefonoWa(t: string): string {
  const d = t.replace(/\D/g, "");
  if (d.startsWith("0")) return `58${d.slice(1)}`;
  return d;
}

export function PanelPedido() {
  const { empresa, sesion } = usePanel();
  const { id } = useParams();
  const pedido = usePedido(id);
  const productos = useDatos((s) => s.productos);
  const cambiarEstado = useDatos((s) => s.cambiarEstado);
  const ajustarCantidad = useDatos((s) => s.ajustarCantidad);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<string | null>(null);
  const [cancelar, setCancelar] = useState(false);
  const [ajuste, setAjuste] = useState<{ indice: number; valor: string; error?: string } | null>(null);

  if (!pedido || pedido.empresa !== empresa.slug) return <NoEncontrado />;

  const usuario = sesion.nombre || sesion.correo;
  // Despachar o listo según la entrega: solo el que corresponde
  const siguientes = SIGUIENTES[pedido.estado].filter(
    (e) => e !== "cancelado" && !(e === "listo" && pedido.entrega !== "retiro") && !(e === "despachado" && pedido.entrega === "retiro"),
  );
  const puedeCancelar = SIGUIENTES[pedido.estado].includes("cancelado");
  const tasas = { bcv: pedido.tasa, usdt: pedido.tasa, eur: null, fecha: pedido.fechaTasa, origen: "en-vivo" as const };

  const avanzar = (destino: EstadoPedido) => {
    const e = cambiarEstado(pedido.id, destino, usuario);
    setError(e);
    setHecho(e ? null : `Pedido ${NOMBRE_ESTADO[destino].toLowerCase()}.`);
  };

  const guardarAjuste = (e: FormEvent) => {
    e.preventDefault();
    if (!ajuste) return;
    const item = pedido.items[ajuste.indice]!;
    const factor = item.unidadesBase / item.cantidad;
    const n = Number(ajuste.valor);
    if (!/^\d+$/.test(ajuste.valor.trim()) || n % factor !== 0) {
      setAjuste({ ...ajuste, error: factor > 1 ? `Escribe un múltiplo de ${factor} (se vende en presentaciones de ${factor}).` : "Escribe un número entero. 0 quita el producto." });
      return;
    }
    ajustarCantidad(pedido.id, ajuste.indice, n);
    setAjuste(null);
    setHecho("Cantidad ajustada. El cliente ve el cambio en su pedido.");
  };

  const mensajeCliente = `Hola ${pedido.comprador.nombre}, te escribimos de ${empresa.nombre} por tu pedido ${numeroPedido(pedido.numero)}.`;
  const aviso = mensajeEstado(pedido, empresa);

  return (
    <>
      <Link to="/panel/pedidos" className="-ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-sm font-semibold hover:bg-hundido print:hidden">
        <ChevronLeft size={18} aria-hidden />
        Pedidos
      </Link>

      <Encabezado
        titulo={`Pedido ${numeroPedido(pedido.numero)}`}
        acciones={
          <Boton onClick={() => window.print()}>
            <Printer size={18} aria-hidden />
            Imprimir nota
          </Boton>
        }
      >
        <span className="flex flex-wrap items-center gap-2">
          <Estado estado={pedido.estado} />
          <span>
            {formatearFecha(pedido.fecha, true)}, {hace(pedido.fecha)}
          </span>
        </span>
      </Encabezado>

      {/* Encabezado de la nota impresa */}
      <div className="mb-4 hidden print:block">
        <p className="text-xl font-bold">{empresa.razonSocial}</p>
        <p>RIF {empresa.rif}</p>
        <p className="mt-2 text-lg font-bold">
          Nota de pedido {numeroPedido(pedido.numero)}, {formatearFecha(pedido.fecha, true)}
        </p>
      </div>

      {pedido.demostracion && (
        <div className="mb-5 print:hidden">
          <Aviso>Pedido de demostración con una tasa redonda de prueba.</Aviso>
        </div>
      )}

      {pedido.estado === "pendiente" && (
        <div className="mb-5 print:hidden">
          {pedido.whatsappAbierto ? (
            <Aviso titulo={`El cliente abrió WhatsApp con este pedido ${hace(pedido.whatsappAbierto)}`}>
              Búscalo en tu chat para confirmar disponibilidad y costo de envío. Vitrina no puede saber si tocó Enviar.
            </Aviso>
          ) : (
            <Aviso tipo="alerta" titulo="El cliente no llegó a abrir WhatsApp con este pedido">
              Puede que el mensaje no te llegue.{" "}
              {pedido.comprador.telefono ? "Escríbele tú para no perder la venta." : "No dejó teléfono: si no aparece, el pedido se cancela solo."}
            </Aviso>
          )}
        </div>
      )}

      {(siguientes.length > 0 || puedeCancelar) && (
        <section aria-label="Acciones del pedido" className="mb-6 rounded-tarjeta border border-linea bg-superficie p-4 print:hidden">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {siguientes.map((s, i) => (
              <Boton key={s} variante={i === 0 ? "accion" : "secundario"} onClick={() => avanzar(s)}>
                {ACCION[s]}
              </Boton>
            ))}
            {puedeCancelar && (
              <Boton variante="peligro" onClick={() => setCancelar(true)} className="sm:ml-auto">
                Cancelar pedido
              </Boton>
            )}
          </div>
          {siguientes[0] && EFECTO[siguientes[0]] && <p className="mt-2 text-sm text-tenue">{EFECTO[siguientes[0]]}</p>}
          {error && (
            <div className="mt-3">
              <Aviso tipo="error">{error}</Aviso>
            </div>
          )}
          {hecho && !error && <p role="status" className="mt-3 text-sm font-semibold text-exito">{hecho}</p>}
        </section>
      )}

      {aviso && pedido.estado !== "pendiente" && (
        <section aria-labelledby="titulo-aviso" className="mb-6 rounded-tarjeta border border-linea bg-superficie p-4 print:hidden">
          <h2 id="titulo-aviso" className="font-bold">
            Avisa al cliente: {NOMBRE_ESTADO[pedido.estado].toLowerCase()}
          </h2>
          <p className="mt-1 whitespace-pre-line text-sm text-tenue">{aviso}</p>
          {pedido.comprador.telefono ? (
            <a
              href={`https://wa.me/${telefonoWa(pedido.comprador.telefono)}?text=${encodeURIComponent(aviso)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={clasesBoton("secundario", "mt-3")}
            >
              <IconoWhatsApp />
              Enviar aviso por WhatsApp
            </a>
          ) : (
            <p className="mt-2 text-sm">El cliente no dejó teléfono: ve el estado nuevo en su cuenta de Vitrina.</p>
          )}
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section aria-labelledby="titulo-productos">
          <h2 id="titulo-productos" className="text-lg font-bold">
            Productos
          </h2>
          {pedido.ajustado && <p className="text-sm text-tenue">La empresa ajustó cantidades antes de confirmar.</p>}
          <ul className="mt-2 divide-y divide-linea border-y border-linea">
            {pedido.items.map((it, i) => {
              const p = productos.find((x) => x.id === it.productoId);
              const disp = p ? disponible(p, it.varianteId) : 0;
              const falta = pedido.estado === "pendiente" && p && !p.bajoPedido && disp < it.unidadesBase;
              return (
                <li key={`${it.productoId}-${it.varianteId}-${it.presentacionId}`} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 py-3">
                  <p className="font-semibold leading-snug">
                    <span className="cifras">{it.cantidad} x </span>
                    {it.nombre}
                  </p>
                  <p className="cifras text-right font-semibold">{formatear(it.totalBsCent, "VES")}</p>
                  <p className="cifras text-sm text-tenue">
                    {it.detalle}. {it.unidadesBase.toLocaleString("es-VE")} unidades. Código {it.sku}
                  </p>
                  {pedido.estado === "pendiente" && (
                    <p className="text-right print:hidden">
                      <button
                        type="button"
                        onClick={() => setAjuste({ indice: i, valor: String(it.unidadesBase) })}
                        className="min-h-11 text-sm font-semibold text-accion underline underline-offset-2"
                      >
                        Ajustar<span className="sr-only"> cantidad de {it.nombre}</span>
                      </button>
                    </p>
                  )}
                  {pedido.estado === "pendiente" && p && (
                    <p className={`col-span-full text-sm print:hidden ${falta ? "font-semibold text-peligro" : "text-tenue"}`}>
                      {falta ? `Solo hay ${disp} disponibles: ajusta la cantidad o registra una entrada.` : p.bajoPedido && disp < it.unidadesBase ? "Producto bajo pedido: confirma el tiempo de entrega con el cliente." : `${disp.toLocaleString("es-VE")} disponibles.`}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-3 text-right">
            <p className="cifras text-xl font-bold">Total {formatear(pedido.totalBsCent, "VES")}</p>
            <p className="cifras text-sm text-tenue">
              Ref. {formatear(refUsd(pedido.totalBsCent, tasas), "USD")}. Tasa BCV {formatearTasa(pedido.tasa)} del {formatearFecha(pedido.fechaTasa)}.
            </p>
          </div>
        </section>

        <div className="space-y-6">
          <section aria-labelledby="titulo-cliente">
            <h2 id="titulo-cliente" className="text-lg font-bold">
              Cliente
            </h2>
            <dl className="mt-2 space-y-1 text-sm">
              <dt className="sr-only">Nombre</dt>
              <dd className="font-semibold">{pedido.comprador.nombre}</dd>
              {pedido.comprador.documento && (
                <>
                  <dt className="sr-only">Cédula o RIF</dt>
                  <dd>{pedido.comprador.documento}</dd>
                </>
              )}
              <dt className="sr-only">Teléfono</dt>
              <dd>{pedido.comprador.telefono || <span className="text-tenue">Sin teléfono</span>}</dd>
              <dt className="sr-only">Correo</dt>
              <dd className="break-all text-tenue">{pedido.compradorCorreo}</dd>
            </dl>
            {pedido.comprador.telefono && (
              <a
                href={`https://wa.me/${telefonoWa(pedido.comprador.telefono)}?text=${encodeURIComponent(mensajeCliente)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={clasesBoton("secundario", "mt-3 w-full print:hidden")}
              >
                <IconoWhatsApp />
                Escribir al cliente
              </a>
            )}
          </section>

          <section aria-labelledby="titulo-entrega">
            <h2 id="titulo-entrega" className="text-lg font-bold">
              Entrega
            </h2>
            <p className="mt-1 text-sm">{NOMBRE_ENTREGA[pedido.entrega]}</p>
            {pedido.destino && <p className="text-sm text-tenue">{pedido.destino}</p>}
            {pedido.nota && <p className="mt-2 text-sm">Nota del cliente: {pedido.nota}</p>}
          </section>

          <section aria-labelledby="titulo-historial">
            <h2 id="titulo-historial" className="text-lg font-bold">
              Historial
            </h2>
            <ol className="mt-2 space-y-2 border-l border-control pl-4">
              {pedido.historial.map((h, i) => (
                <li key={`${h.estado}-${i}`} className="text-sm">
                  <span className="font-semibold">{NOMBRE_ESTADO[h.estado]}</span>
                  <span className="cifras block text-tenue">{formatearFecha(h.fecha, true)}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      <Dialogo abierto={cancelar} titulo={`¿Cancelar el pedido ${numeroPedido(pedido.numero)}?`} onCerrar={() => setCancelar(false)}>
        <p className="text-tenue">
          {pedido.estado === "pendiente" ? "El pedido no había apartado mercancía." : "La mercancía apartada vuelve a estar disponible."} Avísale al cliente por WhatsApp. Esta acción no se puede deshacer.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Boton onClick={() => setCancelar(false)}>Volver</Boton>
          <Boton
            variante="peligro"
            onClick={() => {
              avanzar("cancelado");
              setCancelar(false);
            }}
          >
            Sí, cancelar pedido
          </Boton>
        </div>
      </Dialogo>

      <Dialogo abierto={ajuste != null} titulo="Ajustar cantidad" onCerrar={() => setAjuste(null)}>
        {ajuste && (
          <form onSubmit={guardarAjuste} noValidate className="space-y-4">
            <p className="text-tenue">
              {pedido.items[ajuste.indice]!.nombre}. Escribe las unidades que sí puedes entregar; 0 quita el producto del pedido. El precio unitario se mantiene.
            </p>
            <Campo
              id="ajuste"
              etiqueta="Unidades"
              inputMode="numeric"
              value={ajuste.valor}
              onChange={(e) => setAjuste({ ...ajuste, valor: e.target.value, error: undefined })}
              error={ajuste.error}
              autoFocus
            />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Boton onClick={() => setAjuste(null)}>Volver</Boton>
              <Boton type="submit" variante="accion">
                Guardar cantidad
              </Boton>
            </div>
          </form>
        )}
      </Dialogo>
    </>
  );
}
