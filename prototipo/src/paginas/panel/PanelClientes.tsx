import { ArrowDown, ArrowUp, ChevronRight, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import type { Categoria } from "../../datos/tipos";
import { useDatos, usePedidosDe, useProductosDe } from "../../estado/datos";
import { formatear, formatearFecha } from "../../lib/dinero";
import { Boton } from "../../ui/Boton";
import { Campo } from "../../ui/Campo";
import { Dialogo } from "../../ui/Dialogo";
import { Aviso, EstadoVacio } from "../../ui/piezas";
import { Tabla } from "../../ui/Tabla";
import { IconoWhatsApp } from "../catalogo/PedidoEnviado";
import { Encabezado } from "./comun";
import { SECCIONES, usePanel } from "./PanelLayout";
import { telefonoWa } from "./PanelPedido";

interface Cliente {
  correo: string;
  nombre: string;
  telefono: string;
  documento: string;
  pedidos: number;
  totalBs: number;
  ultimo: string;
}

export function PanelClientes() {
  const { empresa } = usePanel();
  const pedidos = usePedidosDe(empresa.slug);

  const clientes = Object.values(
    pedidos.reduce<Record<string, Cliente>>((acc, p) => {
      const c = acc[p.compradorCorreo];
      const reciente = !c || p.fecha > c.ultimo;
      acc[p.compradorCorreo] = {
        correo: p.compradorCorreo,
        nombre: reciente ? p.comprador.nombre : c!.nombre,
        telefono: (reciente && p.comprador.telefono) || c?.telefono || "",
        documento: (reciente && p.comprador.documento) || c?.documento || "",
        pedidos: (c?.pedidos ?? 0) + 1,
        totalBs: (c?.totalBs ?? 0) + (p.estado === "cancelado" ? 0 : p.totalBsCent),
        ultimo: reciente ? p.fecha : c!.ultimo,
      };
      return acc;
    }, {}),
  ).sort((a, b) => b.ultimo.localeCompare(a.ultimo));

  return (
    <>
      <Encabezado titulo="Clientes">Quienes te han hecho pedidos. Los totales no cuentan pedidos cancelados y suman los bolívares de cada día.</Encabezado>
      {clientes.length === 0 ? (
        <EstadoVacio titulo="Todavía no tienes clientes">Aparecen aquí con su primer pedido.</EstadoVacio>
      ) : (
        <Tabla<Cliente>
          titulo="Clientes"
          filas={clientes}
          clave={(c) => c.correo}
          columnas={[
            {
              titulo: "Cliente",
              principal: true,
              celda: (c) => (
                <span>
                  <span className="font-semibold">{c.nombre}</span>
                  <span className="block break-all text-sm font-normal text-tenue">{c.correo}</span>
                </span>
              ),
            },
            { titulo: "Cédula o RIF", celda: (c) => c.documento || <span className="text-tenue">Sin dato</span> },
            { titulo: "Pedidos", derecha: true, celda: (c) => c.pedidos },
            { titulo: "Total comprado", derecha: true, celda: (c) => formatear(c.totalBs, "VES") },
            { titulo: "Último pedido", celda: (c) => formatearFecha(c.ultimo) },
            {
              titulo: "Contacto",
              celda: (c) =>
                c.telefono ? (
                  <a href={`https://wa.me/${telefonoWa(c.telefono)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-accion underline underline-offset-2">
                    <IconoWhatsApp />
                    {c.telefono}
                  </a>
                ) : (
                  <span className="text-tenue">Sin teléfono</span>
                ),
            },
          ]}
        />
      )}
    </>
  );
}

const slug = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function PanelCategorias() {
  const { empresa } = usePanel();
  const productos = useProductosDe(empresa.slug);
  const actualizar = useDatos((s) => s.actualizarEmpresa);
  const [edicion, setEdicion] = useState<{ id: string | null; nombre: string; error?: string } | null>(null);
  const [hecho, setHecho] = useState<string | null>(null);
  const cats = empresa.categorias;
  const cuantos = (c: Categoria) => productos.filter((p) => p.categoria === c.id).length;

  const mover = (i: number, d: -1 | 1) => {
    const lista = [...cats];
    [lista[i], lista[i + d]] = [lista[i + d]!, lista[i]!];
    actualizar(empresa.slug, { categorias: lista });
    setHecho(`${cats[i]!.nombre} ${d < 0 ? "subió" : "bajó"} un lugar.`);
  };

  const guardar = (e: FormEvent) => {
    e.preventDefault();
    if (!edicion) return;
    const nombre = edicion.nombre.trim();
    if (nombre.length < 2) return setEdicion({ ...edicion, error: "Escribe el nombre de la categoría." });
    if (cats.some((c) => c.nombre.toLowerCase() === nombre.toLowerCase() && c.id !== edicion.id)) return setEdicion({ ...edicion, error: "Ya tienes una categoría con ese nombre." });
    if (edicion.id) {
      actualizar(empresa.slug, { categorias: cats.map((c) => (c.id === edicion.id ? { ...c, nombre } : c)) });
      setHecho(`Categoría renombrada a ${nombre}.`);
    } else {
      const id = cats.some((c) => c.id === slug(nombre)) ? `${slug(nombre)}-${cats.length}` : slug(nombre);
      actualizar(empresa.slug, { categorias: [...cats, { id, nombre }] });
      setHecho(`Creaste la categoría ${nombre}.`);
    }
    setEdicion(null);
  };

  return (
    <>
      <Encabezado
        titulo="Categorías"
        acciones={
          <Boton variante="accion" onClick={() => setEdicion({ id: null, nombre: "" })}>
            <Plus size={18} aria-hidden />
            Nueva categoría
          </Boton>
        }
      >
        El orden de esta lista es el orden de las categorías en tu catálogo.
      </Encabezado>
      {hecho && (
        <p role="status" className="mb-3 text-sm font-semibold text-exito">
          {hecho}
        </p>
      )}
      {cats.length === 0 ? (
        <EstadoVacio titulo="Sin categorías">Crea categorías para ordenar tus productos en el catálogo.</EstadoVacio>
      ) : (
        <ol className="max-w-2xl divide-y divide-linea rounded-tarjeta border border-linea bg-superficie">
          {cats.map((c, i) => {
            const n = cuantos(c);
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2">
                <span className="cifras w-6 text-tenue">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{c.nombre}</span>
                  <span className="block text-sm text-tenue">
                    {n} {n === 1 ? "producto" : "productos"}
                  </span>
                </span>
                <span className="flex items-center">
                  <button type="button" disabled={i === 0} onClick={() => mover(i, -1)} aria-label={`Subir ${c.nombre}`} className="grid size-11 place-items-center rounded-control hover:bg-hundido disabled:opacity-30">
                    <ArrowUp size={18} aria-hidden />
                  </button>
                  <button type="button" disabled={i === cats.length - 1} onClick={() => mover(i, 1)} aria-label={`Bajar ${c.nombre}`} className="grid size-11 place-items-center rounded-control hover:bg-hundido disabled:opacity-30">
                    <ArrowDown size={18} aria-hidden />
                  </button>
                  <button type="button" onClick={() => setEdicion({ id: c.id, nombre: c.nombre })} className="min-h-11 px-2 text-sm font-semibold text-accion underline underline-offset-2">
                    Renombrar<span className="sr-only"> {c.nombre}</span>
                  </button>
                  <button
                    type="button"
                    disabled={n > 0}
                    onClick={() => {
                      actualizar(empresa.slug, { categorias: cats.filter((x) => x.id !== c.id) });
                      setHecho(`Eliminaste la categoría ${c.nombre}.`);
                    }}
                    className="min-h-11 px-2 text-sm font-semibold text-peligro underline underline-offset-2 disabled:no-underline disabled:opacity-40"
                  >
                    Eliminar<span className="sr-only"> {c.nombre}</span>
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
      )}
      {cats.some((c) => cuantos(c) > 0) && <p className="mt-3 max-w-2xl text-sm text-tenue">Una categoría con productos no se puede eliminar: primero mueve sus productos a otra.</p>}

      <Dialogo abierto={edicion != null} titulo={edicion?.id ? "Renombrar categoría" : "Nueva categoría"} onCerrar={() => setEdicion(null)}>
        {edicion && (
          <form onSubmit={guardar} noValidate className="space-y-4">
            <Campo id="cat-nombre" etiqueta="Nombre" value={edicion.nombre} onChange={(e) => setEdicion({ ...edicion, nombre: e.target.value, error: undefined })} error={edicion.error} autoFocus />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Boton onClick={() => setEdicion(null)}>Volver</Boton>
              <Boton type="submit" variante="accion">
                {edicion.id ? "Guardar nombre" : "Crear categoría"}
              </Boton>
            </div>
          </form>
        )}
      </Dialogo>
    </>
  );
}

export function PanelMas() {
  return (
    <>
      <Encabezado titulo="Más" />
      <ul className="divide-y divide-linea rounded-tarjeta border border-linea bg-superficie">
        {SECCIONES.filter((s) => !s.principal).map((s) => (
          <li key={s.ruta}>
            <Link to={s.ruta} className="flex min-h-14 items-center gap-3 px-4 hover:bg-hundido">
              <s.Icono size={20} className="text-tenue" aria-hidden />
              <span className="flex-1 font-semibold">{s.texto}</span>
              <ChevronRight size={18} className="text-tenue" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <Aviso>Estas secciones también están en el menú lateral cuando abres el panel en una pantalla grande.</Aviso>
      </div>
    </>
  );
}
