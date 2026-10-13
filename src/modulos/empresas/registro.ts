"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { conContexto } from "@/lib/db";
import { auditLog, businesses, categories, deliveryMethods, memberships } from "@/lib/db/esquema";
import { fallo, ok, type Resultado } from "@/lib/errores";
import { registro } from "@/lib/registro";
import { COOKIE_EMPRESA, empresasDe, sesionActual } from "../cuentas/sesion";
import { datosEmpresa, erroresPorCampo, RUBROS, type DatosEmpresa } from "./validacion";

/** ¿Está libre este enlace de catálogo? Se consulta mientras la persona escribe. */
export async function enlaceDisponible(slug: string): Promise<boolean> {
  const fila = await conContexto({ rol: "sistema" }, (tx) => tx.select({ id: businesses.id }).from(businesses).where(eq(businesses.slug, slug)).limit(1));
  return fila.length === 0;
}

/**
 * Último paso del registro: crea la empresa en revisión con la persona como dueña. Exige sesión con
 * correo verificado y doble factor activo, que el registro activó en los pasos anteriores.
 */
export async function registrarEmpresa(datos: DatosEmpresa): Promise<Resultado<{ slug: string }>> {
  const s = await sesionActual();
  if (!s) return fallo("Tu sesión venció. Entra de nuevo para terminar el registro.");
  if (!s.user.emailVerified) return fallo("Verifica tu correo antes de registrar la empresa.");
  if (!s.user.twoFactorEnabled) return fallo("Activa la verificación en dos pasos antes de registrar la empresa.");

  const r = datosEmpresa.safeParse(datos);
  if (!r.success) return fallo("Revisa los datos de la empresa.", erroresPorCampo(r.error));
  const d = r.data;

  if ((await empresasDe(s.user.id)).some((m) => m.rol === "dueno")) {
    return fallo("Tu cuenta ya es dueña de una empresa. Para otra empresa, usa otra cuenta o pide que te inviten.");
  }
  if (!(await enlaceDisponible(d.slug))) return fallo("Ese enlace ya está en uso.", { slug: `El enlace /c/${d.slug} ya está en uso. Prueba con la ciudad al final.` });

  const rubro = RUBROS.find((x) => x.valor === d.rubro)!;
  try {
    const id = await conContexto({ rol: "sistema", userId: s.user.id }, async (tx) => {
      const [empresa] = await tx
        .insert(businesses)
        .values({
          slug: d.slug,
          nombre: d.nombre,
          razonSocial: d.razonSocial,
          rif: d.rif.toUpperCase(),
          rubro: rubro.texto,
          ciudad: d.ciudad,
          direccion: d.direccion,
          whatsapp: d.whatsapp,
          redes: d.redes,
          // La prueba de 30 días se reinicia al aprobar; esta fecha solo evita un valor vacío
          vence: new Date(Date.now() + 30 * 86_400_000),
          estado: "en_revision",
        })
        .returning({ id: businesses.id });
      const businessId = empresa!.id;
      await tx.insert(memberships).values({ businessId, userId: s.user.id, rol: "dueno" });
      if (rubro.categorias.length) await tx.insert(categories).values(rubro.categorias.map((nombre, orden) => ({ businessId, nombre, orden })));
      await tx.insert(deliveryMethods).values({ businessId, tipo: "coordinar", detalle: "Se coordina por WhatsApp." });
      await tx.insert(auditLog).values({ actor: s.user.email, accion: "Registró la empresa", objetivo: d.slug, businessId });
      return businessId;
    });
    (await cookies()).set(COOKIE_EMPRESA, id, { httpOnly: true, sameSite: "lax", secure: process.env.APP_URL?.startsWith("https://"), path: "/" });
    return ok({ slug: d.slug });
  } catch (e) {
    registro.error({ err: e }, "no se pudo registrar la empresa");
    return fallo("No se pudo registrar la empresa. Intenta de nuevo en un momento.");
  }
}
