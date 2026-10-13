import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import type { Producto } from "../../datos/tipos";
import { useDatos, useProducto } from "../../estado/datos";
import { useTasas } from "../../estado/tasas";
import { aBs, formatear } from "../../lib/dinero";
import { fisico, reservado } from "../../lib/inventario";
import { Boton } from "../../ui/Boton";
import { Area, Campo } from "../../ui/Campo";
import { Aviso } from "../../ui/piezas";
import { Casilla, Selector } from "../../ui/Selector";
import { NoEncontrado } from "../NoEncontrado";
import { aCentimos, deCentimos, Encabezado, enteroPositivo } from "./comun";
import { usePanel } from "./PanelLayout";

interface Fila {
  id: string;
  a: string;
  b: string;
}

interface Formulario {
  nombre: string;
  sku: string;
  marca: string;
  categoria: string;
  descripcion: string;
  unidad: string;
  unidadPlural: string;
  precio: string;
  escalas: Fila[];
  presentaciones: Fila[];
  minimo: string;
  multiplo: string;
  stockMinimo: string;
  bajoPedido: boolean;
  activo: boolean;
  conVariantes: boolean;
  atributo: string;
  variantes: Fila[];
  stockInicial: Record<string, string>;
}

let semilla = 0;
const idFila = () => `nuevo-${Date.now().toString(36)}${(semilla++).toString(36)}`;

const slug = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

function aFormulario(p: Producto | undefined, categoria: string): Formulario {
  if (!p) {
    return {
      nombre: "", sku: "", marca: "", categoria, descripcion: "", unidad: "unidad", unidadPlural: "unidades", precio: "",
      escalas: [], presentaciones: [{ id: "unidad", a: "Unidad", b: "1" }], minimo: "1", multiplo: "1", stockMinimo: "5",
      bajoPedido: false, activo: true, conVariantes: false, atributo: "Talla", variantes: [], stockInicial: {},
    };
  }
  return {
    nombre: p.nombre, sku: p.sku, marca: p.marca, categoria: p.categoria, descripcion: p.descripcion, unidad: p.unidad, unidadPlural: p.unidadPlural,
    precio: deCentimos(p.precioCent),
    escalas: p.escalas.map((e) => ({ id: idFila(), a: String(e.desde), b: deCentimos(e.precioCent) })),
    presentaciones: p.presentaciones.map((x) => ({ id: x.id, a: x.nombre, b: String(x.factor) })),
    minimo: String(p.minimo), multiplo: String(p.multiplo), stockMinimo: String(p.stockMinimo),
    bajoPedido: p.bajoPedido, activo: p.activo, conVariantes: Boolean(p.variantes), atributo: p.atributo ?? "Talla",
    variantes: (p.variantes ?? []).map((v) => ({ id: v.id, a: v.nombre, b: v.sku })), stockInicial: {},
  };
}

function Seccion({ titulo, children, descripcion }: { titulo: string; descripcion?: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-tarjeta border border-linea bg-superficie p-4 sm:p-5">
      <legend className="float-left mb-1 w-full text-lg font-bold">{titulo}</legend>
      {descripcion && <p className="clear-both -mt-2 text-sm text-tenue">{descripcion}</p>}
      <div className="clear-both space-y-4">{children}</div>
    </fieldset>
  );
}

export function EditorProducto() {
  const { empresa, sesion } = usePanel();
  const { id } = useParams();
  const nuevo = id === "nuevo";
  const existente = useProducto(nuevo ? undefined : id);
  const todos = useDatos((s) => s.productos);
  const guardarProducto = useDatos((s) => s.guardarProducto);
  const tasas = useTasas((s) => s.tasas);
  const navegar = useNavigate();
  const [f, setF] = useState<Formulario>(() => aFormulario(existente, empresa.categorias[0]?.id ?? ""));
  const [errores, setErrores] = useState<{ id: string; texto: string }[]>([]);

  if (!nuevo && (!existente || existente.empresa !== empresa.slug)) return <NoEncontrado />;

  const poner = <K extends keyof Formulario>(k: K, v: Formulario[K]) => setF((x) => ({ ...x, [k]: v }));
  const ponerFila = (lista: "escalas" | "presentaciones" | "variantes", i: number, campo: "a" | "b", v: string) =>
    setF((x) => ({ ...x, [lista]: x[lista].map((r, j) => (j === i ? { ...r, [campo]: v } : r)) }));
  const err = (campo: string) => errores.find((e) => e.id === campo)?.texto;
  const precioCent = aCentimos(f.precio);

  const validar = (): { lista: { id: string; texto: string }[]; producto?: Producto } => {
    const lista: { id: string; texto: string }[] = [];
    const add = (id: string, texto: string) => lista.push({ id, texto });
    if (f.nombre.trim().length < 3) add("nombre", "Escribe el nombre del producto.");
    const sku = f.sku.trim().toUpperCase();
    if (!sku) add("sku", "Escribe el código del producto.");
    else if (todos.some((p) => p.empresa === empresa.slug && p.sku.toUpperCase() === sku && p.id !== existente?.id)) add("sku", `Ya tienes un producto con el código ${sku}.`);
    if (!f.categoria) add("categoria", "Elige una categoría. Puedes crearlas en Categorías.");
    if (!f.unidad.trim() || !f.unidadPlural.trim()) add("unidad", "Escribe la unidad en singular y en plural.");
    if (precioCent == null || precioCent <= 0) add("precio", "Escribe el precio, por ejemplo 12,50.");
    for (const k of ["minimo", "multiplo", "stockMinimo"] as const) {
      if (!enteroPositivo(f[k]) && !(k === "stockMinimo" && f[k].trim() === "0")) add(k, "Escribe un número entero mayor que cero.");
    }
    const minimo = Number(f.minimo);
    let anterior = minimo;
    f.escalas.forEach((e, i) => {
      const p = aCentimos(e.b);
      if (!enteroPositivo(e.a) || Number(e.a) <= anterior) add(`escala-${i}`, `Escala ${i + 1}: la cantidad debe ser mayor que ${anterior.toLocaleString("es-VE")}.`);
      else if (p == null || p <= 0) add(`escala-${i}`, `Escala ${i + 1}: escribe el precio por ${f.unidad || "unidad"}.`);
      anterior = Number(e.a) || anterior;
    });
    if (f.presentaciones.length === 0) add("presentaciones", "Agrega al menos una presentación.");
    f.presentaciones.forEach((x, i) => {
      if (!x.a.trim() || !enteroPositivo(x.b)) add(`pres-${i}`, `Presentación ${i + 1}: escribe el nombre y cuántas unidades trae.`);
    });
    if (f.conVariantes) {
      if (!f.atributo.trim()) add("atributo", "Escribe qué cambia entre variantes, por ejemplo Talla o Color.");
      if (f.variantes.length === 0) add("variantes", "Agrega al menos una variante.");
      f.variantes.forEach((v, i) => {
        if (!v.a.trim() || !v.b.trim()) add(`var-${i}`, `Variante ${i + 1}: escribe el nombre y el código.`);
      });
    }
    if (nuevo) {
      for (const [k, v] of Object.entries(f.stockInicial)) if (v.trim() && !/^\d+$/.test(v.trim())) add(`stock-${k}`, "El stock inicial es un número entero.");
    }
    if (lista.length) return { lista };

    const idProducto = existente?.id ?? `${slug(f.nombre)}-${Date.now().toString(36)}`;
    const producto: Producto = {
      id: idProducto,
      empresa: empresa.slug,
      categoria: f.categoria,
      nombre: f.nombre.trim(),
      marca: f.marca.trim() || "Sin marca",
      sku,
      descripcion: f.descripcion.trim(),
      unidad: f.unidad.trim(),
      unidadPlural: f.unidadPlural.trim(),
      precioCent: precioCent!,
      escalas: f.escalas.map((e) => ({ desde: Number(e.a), precioCent: aCentimos(e.b)! })),
      presentaciones: f.presentaciones.map((x, i) => ({ id: x.id.startsWith("nuevo-") ? slug(x.a) || `pres-${i}` : x.id, nombre: x.a.trim(), factor: Number(x.b) })),
      atributo: f.conVariantes ? f.atributo.trim() : undefined,
      variantes: f.conVariantes ? f.variantes.map((v) => ({ id: v.id.startsWith("nuevo-") ? slug(v.a) || v.id : v.id, nombre: v.a.trim(), sku: v.b.trim().toUpperCase(), stock: 0, reservado: 0 })) : undefined,
      stock: 0,
      reservado: 0,
      activo: f.activo,
      stockMinimo: Number(f.stockMinimo),
      minimo,
      multiplo: Number(f.multiplo),
      bajoPedido: f.bajoPedido,
    };
    return { lista, producto };
  };

  const guardar = (e: FormEvent) => {
    e.preventDefault();
    const { lista, producto } = validar();
    setErrores(lista);
    if (!producto) {
      requestAnimationFrame(() => document.getElementById("errores-producto")?.focus());
      return;
    }
    const stockInicial: Record<string, number> = {};
    if (nuevo) {
      if (producto.variantes) {
        f.variantes.forEach((v, i) => (stockInicial[producto.variantes![i]!.id] = Number(f.stockInicial[v.id] || 0)));
      } else stockInicial[""] = Number(f.stockInicial[""] || 0);
    }
    guardarProducto(producto, sesion.nombre || sesion.correo, stockInicial);
    navegar("/panel/productos", { state: { guardado: `${nuevo ? "Creaste" : "Guardaste"} ${producto.nombre}.` } });
  };

  const bloqueada = (varId: string) => {
    if (!existente?.variantes?.some((v) => v.id === varId)) return false;
    return fisico(existente, varId) > 0 || reservado(existente, varId) > 0;
  };

  return (
    <>
      <Link to="/panel/productos" className="-ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-sm font-semibold hover:bg-hundido">
        <ChevronLeft size={18} aria-hidden />
        Productos
      </Link>
      <Encabezado titulo={nuevo ? "Nuevo producto" : f.nombre || "Producto"}>
        {nuevo ? "El stock se carga aquí solo la primera vez; después cambia con movimientos de inventario." : "El stock no se edita aquí: se mueve desde Inventario para que quede registrado."}
      </Encabezado>

      <form onSubmit={guardar} noValidate className="max-w-3xl space-y-6">
        {errores.length > 0 && (
          <div id="errores-producto" tabIndex={-1} role="alert" className="rounded-control border border-peligro/40 bg-[#fef2f2] p-4 outline-none focus-visible:outline-2">
            <p className="font-semibold">Revisa {errores.length === 1 ? "este dato" : `estos ${errores.length} datos`} antes de guardar:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {errores.map((e) => (
                <li key={e.id}>
                  <button type="button" onClick={() => document.getElementById(e.id)?.focus()} className="inline text-left font-medium text-peligro underline underline-offset-2">
                    {e.texto}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Seccion titulo="Datos del producto">
          <Campo id="nombre" etiqueta="Nombre" value={f.nombre} onChange={(e) => poner("nombre", e.target.value)} error={err("nombre")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="sku" etiqueta="Código" value={f.sku} onChange={(e) => poner("sku", e.target.value)} error={err("sku")} ayuda="Único en tu catálogo. Sirve para buscar y para emparejar fotos." />
            <Campo id="marca" etiqueta="Marca" opcional value={f.marca} onChange={(e) => poner("marca", e.target.value)} />
          </div>
          <Selector
            id="categoria"
            etiqueta="Categoría"
            value={f.categoria}
            onChange={(e) => poner("categoria", e.target.value)}
            error={err("categoria")}
            opciones={[{ valor: "", texto: "Elige una categoría" }, ...empresa.categorias.map((c) => ({ valor: c.id, texto: c.nombre }))]}
          />
          <Area id="descripcion" etiqueta="Descripción" opcional value={f.descripcion} onChange={(e) => poner("descripcion", e.target.value)} />
          <p className="text-sm text-tenue">Fotos: en el boceto no se suben. En la versión final van hasta 5 por producto, comprimidas a WebP.</p>
        </Seccion>

        <Seccion titulo="Precio" descripcion={`Precio en ${empresa.monedaBase} por unidad base. El catálogo lo muestra en bolívares a tasa BCV.`}>
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo id="unidad" etiqueta="Unidad (singular)" value={f.unidad} onChange={(e) => poner("unidad", e.target.value)} error={err("unidad")} ayuda="unidad, metro, galón" />
            <Campo id="unidadPlural" etiqueta="Unidad (plural)" value={f.unidadPlural} onChange={(e) => poner("unidadPlural", e.target.value)} />
            <Campo
              id="precio"
              etiqueta={`Precio por ${f.unidad || "unidad"} (${empresa.monedaBase})`}
              inputMode="decimal"
              value={f.precio}
              onChange={(e) => poner("precio", e.target.value)}
              error={err("precio")}
              ayuda={precioCent && tasas ? `Hoy: ${formatear(aBs(precioCent, empresa.monedaBase, tasas) ?? 0, "VES")}` : "Por ejemplo 12,50"}
            />
          </div>

          <div>
            <p className="font-semibold">Precio por cantidad</p>
            <p className="text-sm text-tenue">Desde cierta cantidad de {f.unidadPlural || "unidades"}, cada una cuesta menos.</p>
            <ul className="mt-2 space-y-2">
              {f.escalas.map((e, i) => (
                <li key={e.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                  <Campo id={`escala-${i}`} etiqueta={`Desde (${f.unidadPlural || "unidades"})`} inputMode="numeric" value={e.a} onChange={(ev) => ponerFila("escalas", i, "a", ev.target.value)} />
                  <Campo id={`escala-${i}-precio`} etiqueta={`Precio (${empresa.monedaBase})`} inputMode="decimal" value={e.b} onChange={(ev) => ponerFila("escalas", i, "b", ev.target.value)} />
                  <button type="button" onClick={() => poner("escalas", f.escalas.filter((_, j) => j !== i))} aria-label={`Quitar escala ${i + 1}`} className="grid size-11 place-items-center rounded-control text-peligro hover:bg-hundido">
                    <Trash2 size={18} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <Boton className="mt-2" onClick={() => poner("escalas", [...f.escalas, { id: idFila(), a: "", b: "" }])}>
              <Plus size={18} aria-hidden />
              Agregar escala
            </Boton>
          </div>
        </Seccion>

        <Seccion titulo="Cómo se vende">
          <div>
            <p className="font-semibold" id="presentaciones" tabIndex={-1}>
              Presentaciones
            </p>
            <p className="text-sm text-tenue">Unidad, caja de 100, bulto de 12. El comprador elige una.</p>
            <ul className="mt-2 space-y-2">
              {f.presentaciones.map((x, i) => (
                <li key={x.id} className="grid grid-cols-[1fr_8rem_auto] items-end gap-2">
                  <Campo id={`pres-${i}`} etiqueta="Nombre" value={x.a} onChange={(ev) => ponerFila("presentaciones", i, "a", ev.target.value)} />
                  <Campo id={`pres-${i}-factor`} etiqueta={`Trae (${f.unidadPlural || "unid."})`} inputMode="numeric" value={x.b} onChange={(ev) => ponerFila("presentaciones", i, "b", ev.target.value)} />
                  <button
                    type="button"
                    disabled={f.presentaciones.length === 1}
                    onClick={() => poner("presentaciones", f.presentaciones.filter((_, j) => j !== i))}
                    aria-label={`Quitar presentación ${x.a || i + 1}`}
                    className="grid size-11 place-items-center rounded-control text-peligro hover:bg-hundido disabled:opacity-40"
                  >
                    <Trash2 size={18} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <Boton className="mt-2" onClick={() => poner("presentaciones", [...f.presentaciones, { id: idFila(), a: "", b: "" }])}>
              <Plus size={18} aria-hidden />
              Agregar presentación
            </Boton>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo id="minimo" etiqueta="Pedido mínimo" inputMode="numeric" value={f.minimo} onChange={(e) => poner("minimo", e.target.value)} error={err("minimo")} ayuda={f.unidadPlural} />
            <Campo id="multiplo" etiqueta="Se vende de" inputMode="numeric" value={f.multiplo} onChange={(e) => poner("multiplo", e.target.value)} error={err("multiplo")} ayuda={`en ${f.multiplo || "1"} ${f.unidadPlural}`} />
            <Campo id="stockMinimo" etiqueta="Avisar si quedan" inputMode="numeric" value={f.stockMinimo} onChange={(e) => poner("stockMinimo", e.target.value)} error={err("stockMinimo")} ayuda={`${f.unidadPlural} o menos`} />
          </div>
          <Casilla etiqueta="Aceptar pedidos sin stock (bajo pedido)" descripcion="El catálogo lo muestra como Bajo pedido y tú confirmas el tiempo de entrega." checked={f.bajoPedido} onChange={(e) => poner("bajoPedido", e.target.checked)} />
        </Seccion>

        <Seccion titulo="Variantes">
          <Casilla
            etiqueta="Este producto tiene variantes"
            descripcion="Por ejemplo tallas o colores, cada una con su código y su stock."
            checked={f.conVariantes}
            disabled={!nuevo && Boolean(existente?.variantes) && fisico(existente!) > 0}
            onChange={(e) => poner("conVariantes", e.target.checked)}
          />
          {f.conVariantes && (
            <>
              <Campo id="atributo" etiqueta="Qué cambia" value={f.atributo} onChange={(e) => poner("atributo", e.target.value)} error={err("atributo")} ayuda="Talla, Color, Medida" />
              <ul id="variantes" tabIndex={-1} className="space-y-2 outline-none">
                {f.variantes.map((v, i) => (
                  <li key={v.id} className={`grid items-end gap-2 ${nuevo ? "grid-cols-[1fr_1fr_6rem_auto]" : "grid-cols-[1fr_1fr_auto]"}`}>
                    <Campo id={`var-${i}`} etiqueta={f.atributo || "Variante"} value={v.a} onChange={(ev) => ponerFila("variantes", i, "a", ev.target.value)} />
                    <Campo id={`var-${i}-sku`} etiqueta="Código" value={v.b} onChange={(ev) => ponerFila("variantes", i, "b", ev.target.value)} />
                    {nuevo && (
                      <Campo
                        id={`stock-${v.id}`}
                        etiqueta="Stock"
                        inputMode="numeric"
                        value={f.stockInicial[v.id] ?? ""}
                        onChange={(ev) => poner("stockInicial", { ...f.stockInicial, [v.id]: ev.target.value })}
                      />
                    )}
                    <button
                      type="button"
                      disabled={bloqueada(v.id)}
                      title={bloqueada(v.id) ? "Tiene stock o reservas: no se puede quitar" : undefined}
                      onClick={() => poner("variantes", f.variantes.filter((_, j) => j !== i))}
                      aria-label={bloqueada(v.id) ? `${v.a} tiene stock, no se puede quitar` : `Quitar variante ${v.a || i + 1}`}
                      className="grid size-11 place-items-center rounded-control text-peligro hover:bg-hundido disabled:opacity-40"
                    >
                      <Trash2 size={18} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
              <Boton onClick={() => poner("variantes", [...f.variantes, { id: idFila(), a: "", b: f.sku ? `${f.sku.toUpperCase()}-` : "" }])}>
                <Plus size={18} aria-hidden />
                Agregar variante
              </Boton>
            </>
          )}
          {nuevo && !f.conVariantes && (
            <Campo
              id="stock-"
              etiqueta={`Stock inicial (${f.unidadPlural || "unidades"})`}
              inputMode="numeric"
              value={f.stockInicial[""] ?? ""}
              onChange={(e) => poner("stockInicial", { ...f.stockInicial, "": e.target.value })}
              error={err("stock-")}
              opcional
            />
          )}
        </Seccion>

        <Seccion titulo="Publicación">
          <Casilla etiqueta="Visible en el catálogo" descripcion="Si lo pausas, deja de verse, pero los pedidos viejos lo conservan." checked={f.activo} onChange={(e) => poner("activo", e.target.checked)} />
        </Seccion>

        <div className="flex flex-col-reverse gap-2 border-t border-linea pt-6 sm:flex-row sm:justify-end">
          <Link to="/panel/productos" className="inline-flex min-h-11 items-center justify-center rounded-control px-4 font-semibold hover:bg-hundido">
            Descartar cambios
          </Link>
          <Boton type="submit" variante="accion">
            {nuevo ? "Crear producto" : "Guardar cambios"}
          </Boton>
        </div>
      </form>
      {!nuevo && (
        <div className="mt-6 max-w-3xl">
          <Aviso>
            Para cambiar el stock de este producto usa{" "}
            <Link to={`/panel/inventario?q=${encodeURIComponent(existente!.sku)}`} className="font-semibold underline underline-offset-2">
              Inventario
            </Link>
            .
          </Aviso>
        </div>
      )}
    </>
  );
}
