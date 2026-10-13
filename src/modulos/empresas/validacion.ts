import { z } from "zod";

// Reglas compartidas por el formulario (mensajes inmediatos) y el servidor (la que vale)
export const RIF = /^[JGVEPC]-?\d{8}-?\d$/i;
export const WHATSAPP = /^\+\d{8,15}$/;
export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const RUBROS = [
  { valor: "ferreteria", texto: "Ferretería y construcción", categorias: ["Tornillería", "Herramientas", "Electricidad", "Plomería", "Pinturas"] },
  { valor: "ropa", texto: "Ropa y uniformes", categorias: ["Franelas", "Pantalones", "Uniformes", "Telas"] },
  { valor: "viveres", texto: "Víveres y limpieza", categorias: ["Víveres", "Bebidas", "Limpieza", "Cuidado personal"] },
  { valor: "repuestos", texto: "Repuestos automotrices", categorias: ["Motor", "Frenos", "Suspensión", "Eléctrico", "Lubricantes"] },
  { valor: "otro", texto: "Otro rubro", categorias: [] as string[] },
] as const;

export function aSlug(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
    .replace(/-$/, "");
}

export const datosEmpresa = z.object({
  razonSocial: z.string().trim().min(3, "Escribe la razón social como aparece en el RIF."),
  rif: z.string().trim().regex(RIF, "El RIF tiene el formato J-12345678-9."),
  nombre: z.string().trim().min(3, "Escribe el nombre comercial que verán tus clientes.").max(80),
  rubro: z.enum(RUBROS.map((r) => r.valor) as [string, ...string[]]),
  ciudad: z.string().trim().min(3, "Escribe la ciudad."),
  direccion: z.string().trim().min(8, "Escribe la dirección fiscal o del local."),
  whatsapp: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(WHATSAPP, "Escribe el WhatsApp con código de país, por ejemplo +58 414 1234567.")),
  redes: z.string().trim().max(200).default(""),
  slug: z
    .string()
    .transform(aSlug)
    .pipe(z.string().min(3, "El enlace necesita al menos 3 letras o números.").regex(SLUG)),
});

export type DatosEmpresa = z.input<typeof datosEmpresa>;

/** Errores de Zod como { campo: mensaje } para el resumen de errores del formulario */
export function erroresPorCampo(e: z.ZodError): Record<string, string> {
  const r: Record<string, string> = {};
  for (const i of e.issues) {
    const campo = String(i.path[0] ?? "general");
    r[campo] ??= i.message;
  }
  return r;
}
