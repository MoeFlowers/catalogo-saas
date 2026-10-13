import { Search, X } from "lucide-react";
import { useMemo } from "react";
import { useSearchParams } from "react-router";
import type { Producto } from "../../datos/tipos";
import { useProductosDe } from "../../estado/datos";
import { nivelStock, precioUnitario } from "../../lib/precio";
import { NOMBRE_ENTREGA } from "../../lib/pedido";
import { Boton } from "../../ui/Boton";
import { EstadoVacio, TasaDelDia } from "../../ui/piezas";
import { BarraPedido } from "./BarraPedido";
import { useEmpresa } from "./CatalogoLayout";
import { TarjetaProducto } from "./TarjetaProducto";

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const ORDENES = {
  relevancia: "Relevancia",
  "precio-asc": "Precio: menor a mayor",
  "precio-desc": "Precio: mayor a menor",
  nombre: "Nombre",
} as const;
type Orden = keyof typeof ORDENES;

const precioPorUnidad = (p: Producto) => precioUnitario(p, 1);

export function Portada() {
  const empresa = useEmpresa();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const cat = params.get("cat") ?? "";
  const orden = (params.get("orden") ?? "relevancia") as Orden;
  const soloDisponibles = params.get("disp") === "1";

  const cambiar = (clave: string, valor: string | null) => {
    const p = new URLSearchParams(params);
    if (valor) p.set(clave, valor);
    else p.delete(clave);
    setParams(p, { replace: true, preventScrollReset: true });
  };

  const todos = useProductosDe(empresa.slug, true);
  const visibles = useMemo(() => {
    const termino = normalizar(q.trim());
    let lista = todos.filter((p) => {
      if (cat && p.categoria !== cat) return false;
      if (soloDisponibles && nivelStock(p) === "agotado") return false;
      if (!termino) return true;
      const categoria = empresa.categorias.find((c) => c.id === p.categoria)?.nombre ?? "";
      return normalizar(`${p.nombre} ${p.sku} ${p.marca} ${categoria}`).includes(termino);
    });
    if (orden === "precio-asc") lista = [...lista].sort((a, b) => precioPorUnidad(a) - precioPorUnidad(b));
    if (orden === "precio-desc") lista = [...lista].sort((a, b) => precioPorUnidad(b) - precioPorUnidad(a));
    if (orden === "nombre") lista = [...lista].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    return lista;
  }, [todos, empresa.categorias, q, cat, orden, soloDisponibles]);

  const hayFiltros = Boolean(q || cat || soloDisponibles);

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-6">
        <section aria-labelledby="titulo-empresa" className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <h1 id="titulo-empresa" className="text-2xl font-bold sm:text-3xl">
              {empresa.nombre}
            </h1>
            <p className="mt-1 max-w-2xl text-tenue">{empresa.descripcion}</p>
          </div>
          <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr] md:text-right">
            <dt className="font-semibold sm:col-start-1">Entrega</dt>
            <dd className="text-tenue">{empresa.entregas.map((e) => NOMBRE_ENTREGA[e.tipo]).join(", ")}</dd>
            <dt className="font-semibold sm:col-start-1">Precios</dt>
            <dd>
              <TasaDelDia />
            </dd>
          </dl>
        </section>

        <div className="mt-6 space-y-3">
          <div>
            <label htmlFor="buscar" className="mb-1.5 block text-sm font-semibold">
              Buscar en el catálogo
            </label>
            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tenue" aria-hidden />
              <input
                id="buscar"
                type="search"
                value={q}
                onChange={(e) => cambiar("q", e.target.value || null)}
                placeholder="Nombre, código o marca"
                className="block min-h-11 w-full rounded-control border border-control bg-superficie py-2.5 pl-10 pr-3 text-base"
              />
            </div>
          </div>

          <div role="group" aria-label="Categorías" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {[{ id: "", nombre: "Todo" }, ...empresa.categorias].map((c) => {
              const activa = cat === c.id;
              return (
                <button
                  key={c.id || "todo"}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => cambiar("cat", c.id || null)}
                  className={`min-h-11 shrink-0 rounded-control border px-4 text-sm font-semibold ${
                    activa ? "border-marca bg-marca text-marca-texto" : "border-control bg-superficie hover:bg-hundido"
                  }`}
                >
                  {c.nombre}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-linea pb-3 text-sm">
            <p className="cifras font-semibold" aria-live="polite">
              {visibles.length} {visibles.length === 1 ? "producto" : "productos"}
            </p>
            <label className="flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                checked={soloDisponibles}
                onChange={(e) => cambiar("disp", e.target.checked ? "1" : null)}
                className="size-5 accent-[var(--color-marca)]"
              />
              Ocultar agotados
            </label>
            <label className="ml-auto flex items-center gap-2">
              <span>Ordenar por</span>
              <select
                value={orden}
                onChange={(e) => cambiar("orden", e.target.value === "relevancia" ? null : e.target.value)}
                className="min-h-11 rounded-control border border-control bg-superficie px-2"
              >
                {Object.entries(ORDENES).map(([v, t]) => (
                  <option key={v} value={v}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {visibles.length === 0 ? (
          <div className="mt-6">
            <EstadoVacio
              titulo={q ? `No encontramos "${q}"` : "No hay productos con estos filtros"}
              accion={
                hayFiltros && (
                  <Boton onClick={() => setParams({}, { replace: true })}>
                    <X size={16} aria-hidden />
                    Quitar filtros y ver todo
                  </Boton>
                )
              }
            >
              {q ? "Prueba con una palabra más corta o con el código del producto." : "Prueba con otra categoría."}
            </EstadoVacio>
          </div>
        ) : (
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visibles.map((p) => (
              <li key={p.id} className="flex">
                <TarjetaProducto producto={p} empresa={empresa} />
              </li>
            ))}
          </ul>
        )}
      </div>
      <BarraPedido empresa={empresa} />
    </>
  );
}
