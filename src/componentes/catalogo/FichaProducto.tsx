"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { aBs, formatear } from "@/dominio/dinero";
import { cantidadInicial, nivelStock, paso, precioUnitario, presentacion, textoStock, validarCantidad } from "@/dominio/precio";
import type { Empresa, Producto, Tasas } from "@/dominio/tipos";
import { Boton } from "@/ui/Boton";
import { Cantidad } from "@/ui/Cantidad";
import { Aviso } from "@/ui/piezas";
import { BarraPedido } from "./BarraPedido";
import { useCarrito } from "./carrito";
import { Etiqueta } from "./Etiqueta";
import { FotoProducto } from "./piezas";
import { textoCantidad } from "./TarjetaProducto";

/** Ficha de un producto. Recibe todos los productos para el total de la barra del pedido. */
export function FichaProducto({ producto: p, empresa, productos, tasas }: { producto: Producto; empresa: Empresa; productos: Producto[]; tasas: Tasas | null }) {
  const agregar = useCarrito((s) => s.agregar);

  const [presId, setPresId] = useState(p.presentaciones[0]!.id);
  const pres = presentacion(p, presId);
  const [cantidad, setCantidad] = useState(() => cantidadInicial(p, pres));
  const [varianteId, setVarianteId] = useState<string | undefined>(undefined);
  const [intento, setIntento] = useState(false);
  const [agregado, setAgregado] = useState<string | null>(null);

  const unidades = cantidad * pres.factor;
  const precioUnit = precioUnitario(p, unidades);
  const totalCent = precioUnit * unidades;
  const faltaVariante = Boolean(p.variantes) && !varianteId;
  const error = faltaVariante ? `Elige ${p.atributo?.toLowerCase() ?? "una opción"}.` : validarCantidad(p, pres, cantidad, varianteId);
  const nivel = nivelStock(p, varianteId);
  const stock = textoStock(p, empresa, varianteId);
  const categoria = empresa.categorias.find((c) => c.id === p.categoria);

  const cambiarPresentacion = (nuevo: string) => {
    setPresId(nuevo);
    setCantidad(cantidadInicial(p, presentacion(p, nuevo)));
    setAgregado(null);
  };

  const enviar = () => {
    setIntento(true);
    if (error) return;
    agregar(empresa.slug, { productoId: p.id, varianteId, presentacionId: pres.id, cantidad });
    setAgregado(textoCantidad(p, pres.nombre, pres.factor, cantidad));
    setIntento(false);
  };

  const reglas = [
    p.minimo > 1 && `Mínimo ${p.minimo} ${p.unidadPlural}.`,
    p.multiplo > 1 && `Se vende de ${p.multiplo} en ${p.multiplo}.`,
  ].filter(Boolean);

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pb-12 pt-4">
        <Link
          href={`/c/${empresa.slug}${categoria ? `?cat=${categoria.id}` : ""}`}
          className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-sm font-semibold hover:bg-hundido"
        >
          <ChevronLeft size={18} aria-hidden />
          {categoria?.nombre ?? "Catálogo"}
        </Link>

        <div className="mt-2 grid gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className="mx-auto w-full max-w-[260px] md:sticky md:top-4 md:max-w-none md:self-start">
            <FotoProducto sku={p.sku} url={p.imagenes[0]?.url} nombre={p.nombre} grande />
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{p.nombre}</h1>
              <p className="cifras mt-1 text-sm text-tenue">
                {p.marca}. Código {p.sku}
              </p>
            </div>

            <Etiqueta cent={precioUnit * pres.factor} moneda={empresa.monedaBase} tasas={tasas} por={`por ${pres.nombre.toLowerCase()}`} tamano="lg" />

            {p.escalas.length > 0 && (
              <section aria-labelledby="escalas">
                <h2 id="escalas" className="text-sm font-semibold">
                  Precio por cantidad, por {p.unidad}
                </h2>
                <table className="cifras mt-2 w-full max-w-sm text-sm">
                  <tbody>
                    {[{ desde: p.minimo, precioCent: p.precioCent }, ...p.escalas].map((e, i, todas) => {
                      const hasta = todas[i + 1] ? todas[i + 1]!.desde - 1 : null;
                      const activa = unidades >= e.desde && (hasta == null || unidades <= hasta);
                      const bs = tasas ? aBs(e.precioCent, empresa.monedaBase, tasas) : null;
                      return (
                        <tr key={e.desde} className={`border-b border-linea ${activa ? "font-bold" : ""}`}>
                          <th scope="row" className="py-2 text-left font-normal">
                            {hasta ? `${e.desde.toLocaleString("es-VE")} a ${hasta.toLocaleString("es-VE")}` : `${e.desde.toLocaleString("es-VE")} o más`}
                            {activa && <span className="font-semibold"> (tu cantidad)</span>}
                          </th>
                          <td className="py-2 text-right">{bs != null ? formatear(bs, "VES") : formatear(e.precioCent, empresa.monedaBase)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            )}

            {p.presentaciones.length > 1 && (
              <fieldset>
                <legend className="text-sm font-semibold">Presentación</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.presentaciones.map((x) => (
                    <label
                      key={x.id}
                      className="flex min-h-11 cursor-pointer items-center gap-2 rounded-control border border-control px-4 text-sm font-semibold has-[:checked]:border-marca has-[:checked]:bg-marca has-[:checked]:text-marca-texto has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-marca"
                    >
                      <input type="radio" name="presentacion" value={x.id} checked={presId === x.id} onChange={() => cambiarPresentacion(x.id)} className="sr-only" />
                      {x.nombre}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {p.variantes && (
              <fieldset aria-describedby={intento && faltaVariante ? "error-ficha" : undefined}>
                <legend className="text-sm font-semibold">{p.atributo}</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.variantes.map((v) => {
                    const sinStock = v.stock <= 0 && !p.bajoPedido;
                    return (
                      <label
                        key={v.id}
                        className={`flex min-h-11 min-w-14 items-center justify-center rounded-control border px-3 text-sm font-semibold has-[:checked]:border-marca has-[:checked]:bg-marca has-[:checked]:text-marca-texto has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-marca ${
                          sinStock ? "cursor-not-allowed border-linea text-tenue line-through" : "cursor-pointer border-control"
                        }`}
                      >
                        <input
                          type="radio"
                          name="variante"
                          value={v.id}
                          disabled={sinStock}
                          checked={varianteId === v.id}
                          onChange={() => {
                            setVarianteId(v.id);
                            setAgregado(null);
                          }}
                          className="sr-only"
                        />
                        {v.nombre}
                        {sinStock && <span className="sr-only"> (agotada)</span>}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <div className="space-y-2">
              <p className="text-sm font-semibold">Cantidad</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Cantidad
                  valor={cantidad}
                  paso={paso(p, pres)}
                  minimo={cantidadInicial(p, pres)}
                  onCambio={(n) => {
                    setCantidad(n);
                    setAgregado(null);
                  }}
                  etiqueta="Cantidad"
                  unidad={pres.factor === 1 ? p.unidadPlural : pres.nombre.toLowerCase()}
                />
                <p className="cifras text-sm">
                  {pres.factor > 1 && (
                    <span className="block text-tenue">
                      {unidades.toLocaleString("es-VE")} {p.unidadPlural}
                    </span>
                  )}
                  <span className="font-semibold">
                    Total {tasas ? formatear(aBs(totalCent, empresa.monedaBase, tasas) ?? 0, "VES") : formatear(totalCent, empresa.monedaBase)}
                  </span>
                </p>
              </div>
              {reglas.length > 0 && <p className="text-sm text-tenue">{reglas.join(" ")}</p>}
              {stock && (
                <p className={`text-sm font-semibold ${nivel === "agotado" ? "text-peligro" : nivel === "pocas" ? "text-alerta" : nivel === "bajo-pedido" ? "text-tenue" : "text-exito"}`}>
                  {stock}
                  {nivel === "bajo-pedido" && <span className="font-normal">: la empresa te confirma el tiempo de entrega.</span>}
                </p>
              )}
            </div>

            <div className="space-y-3">
              {intento && error && (
                <p id="error-ficha" role="alert" className="text-sm font-semibold text-peligro">
                  {error}
                </p>
              )}
              <Boton variante="marca" className="w-full sm:w-auto sm:px-8" onClick={enviar} disabled={nivel === "agotado"}>
                {nivel === "agotado" ? "Agotado" : "Agregar al pedido"}
              </Boton>
              {agregado && (
                <Aviso>
                  Agregaste {agregado} a tu pedido.{" "}
                  <Link href={`/c/${empresa.slug}/pedido`} className="font-semibold underline underline-offset-2">
                    Ver pedido
                  </Link>
                </Aviso>
              )}
            </div>

            {p.descripcion && (
              <section aria-labelledby="descripcion" className="border-t border-linea pt-5">
                <h2 id="descripcion" className="text-sm font-semibold">
                  Descripción
                </h2>
                <p className="mt-1 max-w-prose text-tenue">{p.descripcion}</p>
              </section>
            )}
          </div>
        </div>
      </div>
      <BarraPedido empresa={empresa} productos={productos} tasas={tasas} />
    </>
  );
}
