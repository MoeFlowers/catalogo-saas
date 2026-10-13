import { Search } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { useShallow } from "zustand/react/shallow";
import type { Movimiento, TipoMovimiento } from "../../datos/tipos";
import { useDatos, useProductosDe } from "../../estado/datos";
import { formatearFecha } from "../../lib/dinero";
import { filasInventario, type FilaInventario } from "../../lib/inventario";
import { numeroPedido } from "../../lib/pedido";
import { Boton } from "../../ui/Boton";
import { Campo } from "../../ui/Campo";
import { Dialogo } from "../../ui/Dialogo";
import { Aviso, EstadoVacio } from "../../ui/piezas";
import { Casilla } from "../../ui/Selector";
import { Tabla } from "../../ui/Tabla";
import { Encabezado } from "./comun";
import { usePanel } from "./PanelLayout";

const NOMBRE_MOV: Record<TipoMovimiento, string> = {
  entrada: "Entrada",
  salida: "Salida",
  ajuste: "Ajuste por conteo",
  reserva: "Reserva",
  liberacion: "Liberación",
};

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

type Tipo = "entrada" | "salida" | "ajuste";

interface FormMov {
  fila: FilaInventario;
  tipo: Tipo;
  cantidad: string;
  motivo: string;
  error?: string;
}

export function PanelInventario() {
  const { empresa, sesion } = usePanel();
  const productos = useProductosDe(empresa.slug);
  const movimientos = useDatos(useShallow((s) => s.movimientos.filter((m) => m.empresa === empresa.slug)));
  const registrar = useDatos((s) => s.registrarMovimiento);
  const [params, setParams] = useSearchParams();
  const vista = params.get("vista") === "movimientos" ? "movimientos" : "existencias";
  const q = params.get("q") ?? "";
  const soloBajo = params.get("bajo") === "1";
  const [form, setForm] = useState<FormMov | null>(null);
  const [hecho, setHecho] = useState<string | null>(null);

  const cambiar = (clave: string, valor: string) => {
    const p = new URLSearchParams(params);
    if (valor) p.set(clave, valor);
    else p.delete(clave);
    setParams(p, { replace: true });
  };

  const termino = normalizar(q.trim());
  const filas = useMemo(
    () =>
      filasInventario(productos)
        .filter((f) => !termino || normalizar(`${f.nombre} ${f.sku}`).includes(termino))
        .filter((f) => !soloBajo || f.bajo)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    [productos, termino, soloBajo],
  );
  const nombreDe = (m: Movimiento) => {
    const p = productos.find((x) => x.id === m.productoId);
    const v = p?.variantes?.find((x) => x.id === m.varianteId);
    return p ? `${p.nombre}${v ? `, ${p.atributo} ${v.nombre}` : ""}` : "Producto eliminado";
  };
  const movs = movimientos.filter((m) => !termino || normalizar(nombreDe(m)).includes(termino)).sort((a, b) => b.fecha.localeCompare(a.fecha));

  const guardar = (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const n = Number(form.cantidad);
    if (!/^\d+$/.test(form.cantidad.trim())) {
      setForm({ ...form, error: "Escribe un número entero." });
      return;
    }
    // En el ajuste se escribe lo que se contó; el sistema calcula la diferencia
    const cantidad = form.tipo === "ajuste" ? n - form.fila.fisico : n;
    if (form.tipo === "ajuste" && cantidad === 0) {
      setForm({ ...form, error: "El conteo coincide con el sistema: no hay nada que ajustar." });
      return;
    }
    if (form.tipo === "ajuste" && n < form.fila.reservado) {
      setForm({ ...form, error: `Hay ${form.fila.reservado} reservadas para pedidos confirmados. Si el conteo es menor, cancela o ajusta esos pedidos primero.` });
      return;
    }
    const error = registrar({ empresa: empresa.slug, clave: form.fila.clave, tipo: form.tipo, cantidad, motivo: form.motivo, usuario: sesion.nombre || sesion.correo });
    if (error) {
      setForm({ ...form, error });
      return;
    }
    setHecho(`${NOMBRE_MOV[form.tipo]} registrada en ${form.fila.nombre}.`);
    setForm(null);
  };

  return (
    <>
      <Encabezado titulo="Inventario">
        Almacén principal. Disponible es lo que el catálogo ofrece: físico menos lo apartado por pedidos confirmados. Varios almacenes llegan en la fase E.
      </Encabezado>

      <div role="group" aria-label="Vista del inventario" className="mb-4 flex gap-2">
        {(["existencias", "movimientos"] as const).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={vista === v}
            onClick={() => cambiar("vista", v === "existencias" ? "" : v)}
            className={`min-h-11 rounded-control border px-4 text-sm font-semibold ${vista === v ? "border-tinta bg-tinta text-white" : "border-control bg-superficie hover:bg-hundido"}`}
          >
            {v === "existencias" ? "Existencias" : "Movimientos"}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div className="w-full sm:w-80">
          <label htmlFor="buscar-inv" className="mb-1.5 block text-sm font-semibold">
            Buscar producto
          </label>
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tenue" aria-hidden />
            <input
              id="buscar-inv"
              type="search"
              value={q}
              onChange={(e) => cambiar("q", e.target.value)}
              placeholder="Nombre o código"
              className="block min-h-11 w-full rounded-control border border-control bg-superficie py-2 pl-10 pr-3 text-base"
            />
          </div>
        </div>
        {vista === "existencias" && (
          <div className="pb-2.5">
            <Casilla etiqueta="Solo stock bajo" checked={soloBajo} onChange={(e) => cambiar("bajo", e.target.checked ? "1" : "")} />
          </div>
        )}
      </div>

      {hecho && (
        <div className="mb-4">
          <Aviso>{hecho}</Aviso>
        </div>
      )}

      {vista === "existencias" ? (
        filas.length === 0 ? (
          <EstadoVacio titulo={soloBajo ? "Nada con stock bajo" : "Ningún producto coincide"}>
            {soloBajo ? "Todos los productos están por encima de su mínimo." : "Prueba con otro nombre o código."}
          </EstadoVacio>
        ) : (
          <Tabla<FilaInventario>
            titulo="Existencias"
            filas={filas}
            clave={(f) => `${f.clave.productoId}/${f.clave.varianteId ?? ""}`}
            resaltar={(f) => f.bajo}
            columnas={[
              {
                titulo: "Producto",
                principal: true,
                celda: (f) => (
                  <span>
                    <Link to={`/panel/productos/${f.clave.productoId}`} className="font-semibold hover:underline">
                      {f.nombre}
                    </Link>
                    <span className="cifras block text-sm font-normal text-tenue">
                      {f.sku}
                      {f.bajo && <span className="font-semibold text-alerta">. Stock bajo</span>}
                      {!f.producto.activo && ". Pausado"}
                    </span>
                  </span>
                ),
              },
              { titulo: "Físico", derecha: true, celda: (f) => f.fisico.toLocaleString("es-VE") },
              { titulo: "Reservado", derecha: true, celda: (f) => f.reservado.toLocaleString("es-VE") },
              { titulo: "Disponible", derecha: true, celda: (f) => <span className="font-semibold">{f.disponible.toLocaleString("es-VE")}</span> },
              {
                titulo: "Acción",
                derecha: true,
                celda: (f) => (
                  <button
                    type="button"
                    onClick={() => {
                      setHecho(null);
                      setForm({ fila: f, tipo: "entrada", cantidad: "", motivo: "" });
                    }}
                    className="min-h-11 text-sm font-semibold text-accion underline underline-offset-2"
                  >
                    Registrar movimiento<span className="sr-only"> de {f.nombre}</span>
                  </button>
                ),
              },
            ]}
          />
        )
      ) : movs.length === 0 ? (
        <EstadoVacio titulo="Sin movimientos">Cada entrada, salida, ajuste y reserva queda registrada aquí.</EstadoVacio>
      ) : (
        <Tabla<Movimiento>
          titulo="Movimientos de inventario"
          filas={movs.slice(0, 150)}
          clave={(m) => m.id}
          columnas={[
            {
              titulo: "Producto",
              principal: true,
              celda: (m) => (
                <span>
                  <span className="font-semibold">{nombreDe(m)}</span>
                  <span className="block text-sm font-normal text-tenue">{formatearFecha(m.fecha, true)}</span>
                </span>
              ),
            },
            { titulo: "Tipo", celda: (m) => NOMBRE_MOV[m.tipo] },
            {
              titulo: "Cantidad",
              derecha: true,
              celda: (m) => (
                <span className={m.tipo === "reserva" || m.tipo === "liberacion" ? "text-tenue" : "font-semibold"}>
                  {m.cantidad > 0 ? "+" : ""}
                  {m.cantidad.toLocaleString("es-VE")}
                  {(m.tipo === "reserva" || m.tipo === "liberacion") && " reservadas"}
                </span>
              ),
            },
            {
              titulo: "Motivo",
              celda: (m) =>
                m.pedidoId ? (
                  <Link to={`/panel/pedidos/${m.pedidoId}`} className="text-accion underline underline-offset-2">
                    {m.motivo} {numeroPedido(Number(m.pedidoId.split("-").pop()))}
                  </Link>
                ) : (
                  m.motivo
                ),
            },
            { titulo: "Usuario", celda: (m) => m.usuario },
          ]}
        />
      )}
      {vista === "movimientos" && movs.length > 150 && <p className="mt-3 text-sm text-tenue">Se muestran los 150 más recientes. Busca un producto para ver los suyos.</p>}

      <Dialogo abierto={form != null} titulo="Registrar movimiento" onCerrar={() => setForm(null)}>
        {form && (
          <form onSubmit={guardar} noValidate className="space-y-4">
            <div>
              <p className="font-semibold">{form.fila.nombre}</p>
              <p className="cifras text-sm text-tenue">
                Físico {form.fila.fisico.toLocaleString("es-VE")}, reservado {form.fila.reservado.toLocaleString("es-VE")}, disponible {form.fila.disponible.toLocaleString("es-VE")} {form.fila.producto.unidadPlural}
              </p>
            </div>
            <fieldset>
              <legend className="text-sm font-semibold">Tipo</legend>
              <div className="mt-2 space-y-2">
                {(
                  [
                    ["entrada", "Entrada de mercancía", "Compra o devolución de un cliente."],
                    ["salida", "Salida", "Merma, daño o uso interno. Las ventas salen solas al despachar pedidos."],
                    ["ajuste", "Ajuste por conteo", "Escribe lo que contaste y el sistema corrige la diferencia."],
                  ] as const
                ).map(([valor, titulo, desc]) => (
                  <label key={valor} className="flex cursor-pointer gap-3 rounded-control border border-control p-3 has-[:checked]:border-accion has-[:checked]:ring-1 has-[:checked]:ring-accion">
                    <input type="radio" name="tipo" checked={form.tipo === valor} onChange={() => setForm({ ...form, tipo: valor, error: undefined })} className="mt-1 size-5 shrink-0 accent-[var(--color-accion)]" />
                    <span>
                      <span className="block font-semibold">{titulo}</span>
                      <span className="block text-sm text-tenue">{desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <Campo
              id="mov-cantidad"
              etiqueta={form.tipo === "ajuste" ? `Cantidad contada (${form.fila.producto.unidadPlural})` : `Cantidad (${form.fila.producto.unidadPlural})`}
              inputMode="numeric"
              value={form.cantidad}
              onChange={(e) => setForm({ ...form, cantidad: e.target.value, error: undefined })}
              autoFocus
            />
            <Campo
              id="mov-motivo"
              etiqueta="Motivo"
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value, error: undefined })}
              ayuda={form.tipo === "entrada" ? "Por ejemplo: factura 0123 del proveedor" : form.tipo === "salida" ? "Por ejemplo: cajas dañadas" : "Por ejemplo: conteo mensual"}
            />
            {form.error && <Aviso tipo="error">{form.error}</Aviso>}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Boton onClick={() => setForm(null)}>Volver</Boton>
              <Boton type="submit" variante="accion">
                Registrar
              </Boton>
            </div>
          </form>
        )}
      </Dialogo>
    </>
  );
}
