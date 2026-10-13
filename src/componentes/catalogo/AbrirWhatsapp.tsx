"use client";

import { IconoWhatsApp } from "@/componentes/comun/IconoWhatsApp";
import { marcarWhatsappAbierto } from "@/modulos/compras/acciones";
import { clasesBoton } from "@/ui/Boton";

/** Abre WhatsApp con el pedido escrito y registra la señal para la empresa (ADR-0005) */
export function AbrirWhatsapp({ pedidoId, enlace, texto = "Abrir WhatsApp", variante = "marca" }: { pedidoId: string; enlace: string; texto?: string; variante?: "marca" | "secundario" }) {
  return (
    <a href={enlace} target="_blank" rel="noopener noreferrer" onClick={() => void marcarWhatsappAbierto(pedidoId)} className={clasesBoton(variante, "sm:px-6")}>
      <IconoWhatsApp />
      {texto}
    </a>
  );
}
