import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { Empresa, Producto } from "../../datos/tipos";
import { useCarrito } from "../../estado/carrito";
import { cantidadInicial, nivelStock, precioUnitario, textoStock } from "../../lib/precio";
import { Etiqueta } from "../../ui/Etiqueta";
import { FotoProducto } from "../../ui/piezas";

const COLOR_NIVEL = {
  disponible: "text-exito",
  pocas: "text-alerta",
  agotado: "text-peligro",
  "bajo-pedido": "text-tenue",
} as const;

/** "1 caja de 100", "10 unidades", "3 x caja de 6" */
export function textoCantidad(p: Producto, nombrePres: string, factor: number, n: number): string {
  if (n === 1) return `1 ${nombrePres.toLowerCase()}`;
  if (factor === 1) return `${n} ${p.unidadPlural}`;
  return `${n} x ${nombrePres.toLowerCase()}`;
}

export function TarjetaProducto({ producto: p, empresa }: { producto: Producto; empresa: Empresa }) {
  const agregar = useCarrito((s) => s.agregar);
  const [agregado, setAgregado] = useState(false);
  useEffect(() => {
    if (!agregado) return;
    const t = setTimeout(() => setAgregado(false), 1800);
    return () => clearTimeout(t);
  }, [agregado]);

  const pres = p.presentaciones[0]!;
  const n = cantidadInicial(p, pres);
  const nivel = nivelStock(p);
  const stock = textoStock(p, empresa);
  const precioPres = precioUnitario(p, pres.factor) * pres.factor;
  const enlace = `/c/${empresa.slug}/p/${p.id}`;
  const conOpciones = Boolean(p.variantes);

  return (
    <article className="flex w-full flex-col gap-3 rounded-tarjeta border border-linea bg-superficie p-3">
      <Link to={enlace} className="group space-y-2 rounded-control">
        <FotoProducto sku={p.sku} />
        <h3 className="line-clamp-2 min-h-[2.75rem] text-[15px] font-semibold leading-snug group-hover:underline">{p.nombre}</h3>
      </Link>
      <Etiqueta cent={precioPres} moneda={empresa.monedaBase} por={`por ${pres.nombre.toLowerCase()}`} />
      <div className="mt-auto space-y-2">
        <p className="text-sm">
          {stock && <span className={`font-semibold ${COLOR_NIVEL[nivel]}`}>{stock}</span>}
          {p.escalas.length > 0 && <span className="block text-tenue">Mejor precio por cantidad</span>}
        </p>
        {nivel === "agotado" ? null : conOpciones ? (
          <Link
            to={enlace}
            className="flex min-h-11 w-full items-center justify-center rounded-control border border-control text-sm font-semibold hover:bg-hundido"
          >
            Elegir {p.atributo?.toLowerCase() ?? "opción"}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              agregar(empresa.slug, { productoId: p.id, presentacionId: pres.id, cantidad: n });
              setAgregado(true);
            }}
            className="flex min-h-11 w-full items-center justify-center rounded-control border border-control text-sm font-semibold hover:bg-hundido"
          >
            <span aria-live="polite">{agregado ? "Agregado al pedido" : `Agregar ${textoCantidad(p, pres.nombre, pres.factor, n)}`}</span>
          </button>
        )}
      </div>
    </article>
  );
}
