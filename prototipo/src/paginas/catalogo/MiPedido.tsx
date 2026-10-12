import { ChevronLeft, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import type { TipoEntrega } from "../../datos/tipos";
import { useCarrito } from "../../estado/carrito";
import { usePedidos } from "../../estado/pedidos";
import { useSesion } from "../../estado/sesion";
import { useTasas } from "../../estado/tasas";
import { aBs, formatear, formatearTasa, refUsd } from "../../lib/dinero";
import { aItem, calcularLinea, detalleLinea, NOMBRE_ENTREGA } from "../../lib/pedido";
import { cantidadInicial, paso, presentacion, validarCantidad } from "../../lib/precio";
import { Boton, BotonEnlace } from "../../ui/Boton";
import { Area, Campo } from "../../ui/Campo";
import { Cantidad } from "../../ui/Cantidad";
import { Aviso, EstadoVacio, FotoProducto } from "../../ui/piezas";
import { useEmpresa } from "./CatalogoLayout";

interface ErrorCampo {
  id: string;
  texto: string;
}

export function MiPedido() {
  const empresa = useEmpresa();
  const navegar = useNavigate();
  const tasas = useTasas((s) => s.tasas);
  const lineas = useCarrito((s) => s.porEmpresa[empresa.slug]) ?? [];
  const { cambiar, quitar, vaciar } = useCarrito();
  const { comprador, actualizar } = useSesion();
  const crearPedido = usePedidos((s) => s.crear);

  const [entrega, setEntrega] = useState<TipoEntrega>(empresa.entregas[0]!.tipo);
  const [destino, setDestino] = useState("");
  const [nota, setNota] = useState("");
  const [nombre, setNombre] = useState(comprador?.nombre ?? "");
  const [telefono, setTelefono] = useState(comprador?.telefono ?? "");
  const [documento, setDocumento] = useState(comprador?.documento ?? "");
  const [errores, setErrores] = useState<ErrorCampo[]>([]);
  const [enviando, setEnviando] = useState(false);

  const volver = `/c/${empresa.slug}`;

  if (lineas.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold">Tu pedido</h1>
        <div className="mt-6">
          <EstadoVacio
            titulo="Tu pedido está vacío"
            accion={
              <BotonEnlace to={volver} variante="marca">
                Ver el catálogo de {empresa.nombre}
              </BotonEnlace>
            }
          >
            Agrega productos desde el catálogo. Se guardan en este teléfono hasta que envíes el pedido.
          </EstadoVacio>
        </div>
      </div>
    );
  }

  if (!tasas) {
    return (
      <p role="status" className="mx-auto max-w-3xl px-4 py-10 text-tenue">
        Consultando la tasa BCV para calcular tu pedido.
      </p>
    );
  }

  const calculadas = lineas.map((l) => calcularLinea(l, empresa, tasas)).filter((c) => c != null);
  const totalBs = calculadas.reduce((s, c) => s + c.totalBsCent, 0);
  const totalCent = calculadas.reduce((s, c) => s + c.totalCent, 0);
  const minimoBs = aBs(empresa.pedidoMinimoCent, empresa.monedaBase, tasas) ?? 0;
  const faltaMinimo = totalBs < minimoBs;
  const metodo = empresa.entregas.find((e) => e.tipo === entrega)!;
  const errorDe = (id: string) => errores.find((e) => e.id === id)?.texto;

  const validar = (): ErrorCampo[] => {
    const lista: ErrorCampo[] = [];
    calculadas.forEach((c, i) => {
      const e = validarCantidad(c.producto, presentacion(c.producto, c.linea.presentacionId), c.linea.cantidad, c.linea.varianteId);
      if (e) lista.push({ id: `linea-${i}`, texto: `${c.producto.nombre}: ${e}` });
    });
    if (faltaMinimo) lista.push({ id: "resumen", texto: `El pedido mínimo de ${empresa.nombre} es ${formatear(minimoBs, "VES")}.` });
    if (metodo.pideDireccion && destino.trim().length < 4) lista.push({ id: "destino", texto: "Escribe la dirección o la ciudad de destino." });
    if (nombre.trim().length < 3) lista.push({ id: "nombre", texto: "Escribe tu nombre o el de tu empresa." });
    if (telefono.replace(/\D/g, "").length < 10) lista.push({ id: "telefono", texto: "Escribe un teléfono con código de área, por ejemplo 0414 1234567." });
    return lista;
  };

  const enviar = (ev: FormEvent) => {
    ev.preventDefault();
    const lista = validar();
    setErrores(lista);
    if (lista.length > 0) {
      requestAnimationFrame(() => document.getElementById("resumen-errores")?.focus());
      return;
    }
    setEnviando(true);
    // Pausa breve para que el estado de envío sea visible, como lo será con el servidor
    setTimeout(() => {
      const ahora = new Date().toISOString();
      const pedido = crearPedido({
        empresa: empresa.slug,
        fecha: ahora,
        estado: "pendiente",
        historial: [{ estado: "pendiente", fecha: ahora }],
        items: calculadas.map(aItem),
        moneda: empresa.monedaBase,
        tasa: tasas.bcv,
        fechaTasa: tasas.fecha,
        totalCent,
        totalBsCent: totalBs,
        entrega,
        destino: metodo.pideDireccion ? destino.trim() : "",
        nota: nota.trim(),
        comprador: { nombre: nombre.trim(), telefono: telefono.trim(), documento: documento.trim() },
      });
      actualizar({ nombre: nombre.trim(), telefono: telefono.trim(), documento: documento.trim() });
      vaciar(empresa.slug);
      navegar(`/c/${empresa.slug}/pedido/enviado/${pedido.id}`);
    }, 600);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-12 pt-4">
      <Link to={volver} className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-sm font-semibold hover:bg-hundido">
        <ChevronLeft size={18} aria-hidden />
        Seguir comprando
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Tu pedido en {empresa.nombre}</h1>

      <form onSubmit={enviar} noValidate className="mt-6 space-y-8">
        {errores.length > 0 && (
          <div id="resumen-errores" tabIndex={-1} role="alert" className="rounded-control border border-peligro/40 bg-[#fef2f2] p-4 outline-none focus-visible:outline-2">
            <p className="font-semibold">Antes de enviar, revisa {errores.length === 1 ? "esto" : `estas ${errores.length} cosas`}:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {errores.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => document.getElementById(e.id)?.focus()}
                    className="inline text-left font-medium text-peligro underline underline-offset-2"
                  >
                    {e.texto}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <section aria-labelledby="titulo-productos">
          <h2 id="titulo-productos" className="sr-only">
            Productos
          </h2>
          <ul className="divide-y divide-linea border-y border-linea">
            {calculadas.map((c, i) => {
              const pres = presentacion(c.producto, c.linea.presentacionId);
              const error = validarCantidad(c.producto, pres, c.linea.cantidad, c.linea.varianteId);
              return (
                <li key={`${c.producto.id}-${c.linea.varianteId}-${pres.id}`} className="grid grid-cols-[64px_1fr] gap-x-3 gap-y-3 py-4 sm:grid-cols-[72px_1fr_auto]">
                  <div className="row-span-2 sm:row-span-1">
                    <FotoProducto sku={c.producto.sku} />
                  </div>
                  <div className="min-w-0">
                    <Link to={`/c/${empresa.slug}/p/${c.producto.id}`} className="font-semibold leading-snug hover:underline">
                      {c.producto.nombre}
                    </Link>
                    <p className="text-sm text-tenue">{detalleLinea(c)}</p>
                    <p className="cifras text-sm text-tenue">
                      {c.unidadesBase.toLocaleString("es-VE")} {c.unidadesBase === 1 ? c.producto.unidad : c.producto.unidadPlural} a{" "}
                      {formatear(aBs(c.precioUnitCent, empresa.monedaBase, tasas) ?? 0, "VES")} c/u
                    </p>
                  </div>
                  <div className="col-start-2 flex flex-wrap items-center gap-3 sm:col-start-3 sm:row-start-1 sm:flex-col sm:items-end">
                    <p className="cifras text-right font-bold sm:order-first">{formatear(c.totalBsCent, "VES")}</p>
                    <div id={`linea-${i}`} tabIndex={-1} className="outline-none">
                      <Cantidad
                        valor={c.linea.cantidad}
                        paso={paso(c.producto, pres)}
                        minimo={cantidadInicial(c.producto, pres)}
                        onCambio={(n) => cambiar(empresa.slug, i, n)}
                        etiqueta={`Cantidad de ${c.producto.nombre}`}
                        unidad={pres.factor === 1 ? c.producto.unidadPlural : pres.nombre.toLowerCase()}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => quitar(empresa.slug, i)}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-control px-2 text-sm font-semibold text-peligro hover:bg-hundido"
                    >
                      <Trash2 size={16} aria-hidden />
                      Quitar<span className="sr-only"> {c.producto.nombre}</span>
                    </button>
                  </div>
                  {error && <p className="col-span-full text-sm font-semibold text-peligro">{error}</p>}
                </li>
              );
            })}
          </ul>

          <div id="resumen" tabIndex={-1} className="mt-4 space-y-1 text-right outline-none">
            <p className="cifras text-2xl font-bold">Total {formatear(totalBs, "VES")}</p>
            <p className="cifras text-tenue">
              Ref. {formatear(refUsd(totalBs, tasas), "USD")}. Tasa BCV {formatearTasa(tasas.bcv)}.
            </p>
            {tasas.origen === "demostracion" && (
              <p className="text-sm font-semibold text-alerta">No se pudo consultar la tasa real: el total usa una tasa de demostración.</p>
            )}
          </div>
          {faltaMinimo && (
            <div className="mt-4">
              <Aviso tipo="alerta" titulo={`Pedido mínimo: ${formatear(minimoBs, "VES")}`}>
                Te faltan {formatear(minimoBs - totalBs, "VES")} para poder enviar este pedido.
              </Aviso>
            </div>
          )}
        </section>

        <fieldset className="space-y-3">
          <legend className="text-lg font-bold">Entrega</legend>
          <div className="space-y-2">
            {empresa.entregas.map((e) => (
              <label
                key={e.tipo}
                className="flex cursor-pointer gap-3 rounded-control border border-control bg-superficie p-3 has-[:checked]:border-marca has-[:checked]:ring-1 has-[:checked]:ring-marca"
              >
                <input
                  type="radio"
                  name="entrega"
                  value={e.tipo}
                  checked={entrega === e.tipo}
                  onChange={() => setEntrega(e.tipo)}
                  className="mt-1 size-5 shrink-0 accent-[var(--color-marca)]"
                />
                <span>
                  <span className="block font-semibold">{NOMBRE_ENTREGA[e.tipo]}</span>
                  <span className="block text-sm text-tenue">{e.detalle}</span>
                </span>
              </label>
            ))}
          </div>
          {metodo.pideDireccion && (
            <Campo
              id="destino"
              etiqueta={entrega === "encomienda" ? "Ciudad y agencia de destino" : "Dirección de entrega"}
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              error={errorDe("destino")}
              autoComplete={entrega === "delivery" ? "street-address" : "off"}
            />
          )}
          <Area id="nota" etiqueta="Nota para la empresa" opcional value={nota} onChange={(e) => setNota(e.target.value)} ayuda="Por ejemplo, si necesitas factura o un horario de entrega." />
        </fieldset>

        {comprador ? (
          <fieldset className="space-y-4">
            <legend className="text-lg font-bold">Tus datos</legend>
            <p className="-mt-1 text-sm text-tenue">
              Entraste como {comprador.correo}. Estos datos se guardan en tu cuenta para el próximo pedido.
            </p>
            <Campo id="nombre" etiqueta="Nombre o razón social" value={nombre} onChange={(e) => setNombre(e.target.value)} error={errorDe("nombre")} autoComplete="name" />
            <Campo
              id="telefono"
              etiqueta="Teléfono"
              type="tel"
              inputMode="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              error={errorDe("telefono")}
              autoComplete="tel"
              ayuda="La empresa te escribe a este número."
            />
            <Campo id="documento" etiqueta="Cédula o RIF" opcional value={documento} onChange={(e) => setDocumento(e.target.value)} ayuda="Si necesitas factura a tu nombre o al de tu empresa." />
          </fieldset>
        ) : (
          <Aviso titulo="Para enviar el pedido necesitas una cuenta">
            Tu pedido queda guardado mientras entras. Con la cuenta verás el estado de tus pedidos y podrás repetirlos.
          </Aviso>
        )}

        <div className="border-t border-linea pt-6">
          {comprador ? (
            <Boton type="submit" variante="marca" className="w-full sm:w-auto sm:px-8" cargando={enviando} textoCargando="Guardando pedido">
              Enviar pedido por WhatsApp
            </Boton>
          ) : (
            <BotonEnlace to={`/entrar?volver=/c/${empresa.slug}/pedido`} variante="marca" className="w-full sm:w-auto sm:px-8">
              Entrar para enviar el pedido
            </BotonEnlace>
          )}
          <p className="mt-3 text-sm text-tenue">
            Se abre WhatsApp con el pedido escrito. {empresa.nombre} te confirma disponibilidad y costo de envío.
          </p>
        </div>
      </form>
    </div>
  );
}
