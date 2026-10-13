import { CircleAlert, Info, PackageOpen, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { formatearFecha, formatearTasa } from "../lib/dinero";
import { useTasas } from "../estado/tasas";

type TipoAviso = "info" | "alerta" | "error";

const AVISO: Record<TipoAviso, { clase: string; Icono: typeof Info }> = {
  info: { clase: "border-linea bg-hundido text-tinta", Icono: Info },
  alerta: { clase: "border-alerta/40 bg-[#fffbeb] text-tinta", Icono: TriangleAlert },
  error: { clase: "border-peligro/40 bg-[#fef2f2] text-tinta", Icono: CircleAlert },
};

const COLOR_ICONO: Record<TipoAviso, string> = { info: "text-tenue", alerta: "text-alerta", error: "text-peligro" };

export function Aviso({ tipo = "info", titulo, children }: { tipo?: TipoAviso; titulo?: string; children: ReactNode }) {
  const { clase, Icono } = AVISO[tipo];
  return (
    <div role={tipo === "error" ? "alert" : "status"} className={`flex gap-3 rounded-control border p-3 text-sm ${clase}`}>
      <Icono size={18} className={`mt-0.5 shrink-0 ${COLOR_ICONO[tipo]}`} aria-hidden />
      <div className="space-y-1">
        {titulo && <p className="font-semibold">{titulo}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}

export function EstadoVacio({ titulo, children, accion }: { titulo: string; children?: ReactNode; accion?: ReactNode }) {
  return (
    <div className="rounded-tarjeta border border-dashed border-control px-6 py-10 text-center">
      <PackageOpen size={28} className="mx-auto text-tenue" aria-hidden />
      <p className="mt-3 font-semibold">{titulo}</p>
      {children && <div className="mx-auto mt-1 max-w-sm text-sm text-tenue">{children}</div>}
      {accion && <div className="mt-5 flex justify-center">{accion}</div>}
    </div>
  );
}

/** Espacio de la foto. En el boceto no hay fotos: se muestra el código para no inventar imágenes. */
export function FotoProducto({ sku, grande = false }: { sku: string; grande?: boolean }) {
  return (
    <div
      className={`grid aspect-square w-full place-items-center rounded-control bg-hundido text-center ${grande ? "p-6" : "p-3"}`}
      role="img"
      aria-label="Producto sin foto en el boceto"
    >
      <div>
        <p className={`cifras font-semibold text-tenue ${grande ? "text-lg" : "text-sm"}`}>{sku}</p>
        <p className="text-xs text-tenue">Foto del producto</p>
      </div>
    </div>
  );
}

/** Iniciales de la empresa en su color: el logo real lo sube cada empresa */
export function MarcaEmpresa({ nombre, tamano = 40 }: { nombre: string; tamano?: number }) {
  const iniciales = nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
  return (
    <span
      aria-hidden
      style={{ width: tamano, height: tamano, fontSize: tamano * 0.38 }}
      className="grid shrink-0 place-items-center rounded-control bg-marca font-bold text-marca-texto"
    >
      {iniciales}
    </span>
  );
}

export function BarraBoceto() {
  return (
    <aside aria-label="Aviso del boceto" className="bg-tinta px-4 py-2 text-center text-sm text-white print:hidden">
      Boceto navegable. Empresas, productos y pedidos son de demostración.{" "}
      <Link to="/" className="font-semibold underline underline-offset-2">
        Ver recorrido
      </Link>
    </aside>
  );
}

export function TasaDelDia() {
  const { tasas, cargando } = useTasas();
  if (!tasas) return <span className="text-tenue">{cargando ? "Consultando tasa BCV" : "Sin tasa"}</span>;
  return (
    <span className="cifras">
      Tasa BCV {formatearTasa(tasas.bcv)}
      {tasas.origen === "demostracion" ? (
        <span className="font-semibold text-alerta"> (de demostración, no se pudo consultar la real)</span>
      ) : (
        <span className="text-tenue"> del {formatearFecha(tasas.fecha)}</span>
      )}
    </span>
  );
}
