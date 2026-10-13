import "server-only";
import { cache } from "react";
import { conContexto } from "@/lib/db";
import type { Empresa } from "@/dominio/tipos";
import { empresaPorSlug, productosDe } from "../catalogo/consultas";

/**
 * Catálogo tal como lo ve un visitante: solo empresas activas que lo publicaron. Corre con el rol
 * "publico", así que aunque una consulta olvide filtrar, la base no entrega catálogos ajenos.
 */
export const catalogoPublico = cache(async (slug: string) => {
  return conContexto({ rol: "publico" }, async (tx) => {
    const empresa = await empresaPorSlug(tx, slug);
    if (!empresa) return { estado: "no-existe" as const };
    if (empresa.estado !== "activa" || !empresa.publicado) return { estado: "no-disponible" as const, empresa: resumen(empresa) };
    const productos = await productosDe(tx, empresa.id, { soloActivos: true });
    return { estado: "ok" as const, empresa, productos };
  });
});

function resumen(e: Empresa) {
  return { nombre: e.nombre, slug: e.slug, activa: e.estado === "activa" };
}

/** Lo que un visitante puede ver de la empresa: sin RIF completo ni datos internos */
export function empresaPublica(e: Empresa): Empresa {
  return { ...e, motivoEstado: null };
}
