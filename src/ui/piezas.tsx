import { CircleAlert, Info, PackageOpen, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

type TipoAviso = "info" | "alerta" | "error";

const AVISO: Record<TipoAviso, { clase: string; Icono: typeof Info; color: string }> = {
  info: { clase: "border-linea bg-hundido", Icono: Info, color: "text-tenue" },
  alerta: { clase: "border-alerta/40 bg-[#fffbeb]", Icono: TriangleAlert, color: "text-alerta" },
  error: { clase: "border-peligro/40 bg-[#fef2f2]", Icono: CircleAlert, color: "text-peligro" },
};

export function Aviso({ tipo = "info", titulo, children }: { tipo?: TipoAviso; titulo?: string; children?: ReactNode }) {
  const { clase, Icono, color } = AVISO[tipo];
  return (
    <div role={tipo === "error" ? "alert" : "status"} className={`flex gap-3 rounded-control border p-3 text-sm text-tinta ${clase}`}>
      <Icono size={18} className={`mt-0.5 shrink-0 ${color}`} aria-hidden />
      <div className="space-y-1">
        {titulo && <p className="font-semibold">{titulo}</p>}
        {children && <div>{children}</div>}
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

/** Lista de errores de un formulario con enlaces a cada campo. Se enfoca al aparecer. */
export function ResumenErrores({ id = "errores", errores, titulo = "Revisa antes de seguir:" }: { id?: string; errores: Record<string, string>; titulo?: string }) {
  const lista = Object.entries(errores);
  if (!lista.length) return null;
  return (
    <div id={id} tabIndex={-1} role="alert" className="rounded-control border border-peligro/40 bg-[#fef2f2] p-4 outline-none">
      <p className="font-semibold">{titulo}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {lista.map(([campo, texto]) => (
          <li key={campo}>
            <a href={`#${campo}`} className="font-medium text-peligro underline underline-offset-2">
              {texto}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
