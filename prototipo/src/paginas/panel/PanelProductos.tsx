import { Plus, Search } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router";
import { planDe } from "../../datos/planes";
import type { Producto } from "../../datos/tipos";
import { useProductosDe } from "../../estado/datos";
import { formatear } from "../../lib/dinero";
import { disponible } from "../../lib/inventario";
import { BotonEnlace } from "../../ui/Boton";
import { Aviso, EstadoVacio } from "../../ui/piezas";
import { Tabla } from "../../ui/Tabla";
import { Encabezado } from "./comun";
import { usePanel } from "./PanelLayout";

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export function PanelProductos() {
  const { empresa, puede } = usePanel();
  const productos = useProductosDe(empresa.slug);
  const [params, setParams] = useSearchParams();
  const { state } = useLocation() as { state: { guardado?: string } | null };
  const q = params.get("q") ?? "";
  const cat = params.get("cat") ?? "";
  const estado = params.get("estado") ?? "";
  const plan = planDe(empresa.plan);

  const cambiar = (clave: string, valor: string) => {
    const p = new URLSearchParams(params);
    if (valor) p.set(clave, valor);
    else p.delete(clave);
    setParams(p, { replace: true, state: null });
  };

  const termino = normalizar(q.trim());
  const visibles = productos
    .filter((p) => !cat || p.categoria === cat)
    .filter((p) => !estado || (estado === "activos" ? p.activo : !p.activo))
    .filter((p) => !termino || normalizar(`${p.nombre} ${p.sku} ${p.marca}`).includes(termino))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const lleno = plan.productos != null && productos.length >= plan.productos;

  return (
    <>
      <Encabezado
        titulo="Productos"
        acciones={
          lleno || !puede("productos") ? undefined : (
            <BotonEnlace to="/panel/productos/nuevo" variante="accion">
              <Plus size={18} aria-hidden />
              Nuevo producto
            </BotonEnlace>
          )
        }
      >
        <span className="cifras">
          {productos.length.toLocaleString("es-VE")} {plan.productos ? `de ${plan.productos.toLocaleString("es-VE")} productos del plan ${plan.nombre}` : `productos, plan ${plan.nombre} sin límite`}.
        </span>{" "}
        La carga desde Excel llega en la fase E.
      </Encabezado>

      {state?.guardado && (
        <div className="mb-4">
          <Aviso>{state.guardado}</Aviso>
        </div>
      )}
      {lleno && (
        <div className="mb-4">
          <Aviso tipo="alerta" titulo="Llegaste al límite de productos de tu plan">
            <Link to="/panel/suscripcion" className="font-semibold underline underline-offset-2">
              Cambia de plan
            </Link>{" "}
            para agregar más.
          </Aviso>
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div>
          <label htmlFor="buscar-producto" className="mb-1.5 block text-sm font-semibold">
            Buscar
          </label>
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tenue" aria-hidden />
            <input
              id="buscar-producto"
              type="search"
              value={q}
              onChange={(e) => cambiar("q", e.target.value)}
              placeholder="Nombre, código o marca"
              className="block min-h-11 w-full rounded-control border border-control bg-superficie py-2 pl-10 pr-3 text-base"
            />
          </div>
        </div>
        <label className="block text-sm font-semibold">
          Categoría
          <select value={cat} onChange={(e) => cambiar("cat", e.target.value)} className="mt-1.5 block min-h-11 w-full rounded-control border border-control bg-superficie px-2 text-base font-normal">
            <option value="">Todas</option>
            {empresa.categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Estado
          <select value={estado} onChange={(e) => cambiar("estado", e.target.value)} className="mt-1.5 block min-h-11 w-full rounded-control border border-control bg-superficie px-2 text-base font-normal">
            <option value="">Todos</option>
            <option value="activos">Visibles en el catálogo</option>
            <option value="pausados">Pausados</option>
          </select>
        </label>
      </div>

      {visibles.length === 0 ? (
        <EstadoVacio
          titulo={productos.length === 0 ? "Aún no tienes productos" : "Ningún producto coincide"}
          accion={
            productos.length === 0 ? (
              <BotonEnlace to="/panel/productos/nuevo" variante="accion">
                Crear el primero
              </BotonEnlace>
            ) : undefined
          }
        >
          {productos.length === 0 ? "Crea tu primer producto para publicar el catálogo." : "Prueba con otra búsqueda, categoría o estado."}
        </EstadoVacio>
      ) : (
        <Tabla<Producto>
          titulo="Productos"
          filas={visibles}
          clave={(p) => p.id}
          columnas={[
            {
              titulo: "Producto",
              principal: true,
              celda: (p) => (
                <Link to={`/panel/productos/${p.id}`} className="block hover:underline">
                  <span className="font-semibold text-accion">{p.nombre}</span>
                  <span className="cifras block text-sm font-normal text-tenue">{p.sku}</span>
                </Link>
              ),
            },
            { titulo: "Categoría", celda: (p) => empresa.categorias.find((c) => c.id === p.categoria)?.nombre ?? "Sin categoría" },
            { titulo: "Precio base", derecha: true, celda: (p) => `${formatear(p.precioCent, empresa.monedaBase)} / ${p.unidad}` },
            {
              titulo: "Disponible",
              derecha: true,
              celda: (p) => {
                const d = disponible(p);
                return <span className={d === 0 ? "font-semibold text-peligro" : ""}>{d === 0 ? (p.bajoPedido ? "Bajo pedido" : "Agotado") : `${d.toLocaleString("es-VE")} ${p.unidadPlural}`}</span>;
              },
            },
            { titulo: "Estado", celda: (p) => (p.activo ? "Visible" : <span className="font-semibold text-alerta">Pausado</span>) },
          ]}
        />
      )}
    </>
  );
}
