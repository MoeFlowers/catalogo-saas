"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Boton } from "@/ui/Boton";

/** Copia un texto al portapapeles y lo confirma en el mismo botón */
export function Copiar({ texto, etiqueta, hecho = "Copiado" }: { texto: string; etiqueta: string; hecho?: string }) {
  const [estado, setEstado] = useState<"listo" | "copiado" | "error">("listo");
  return (
    <>
      <Boton
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(texto);
            setEstado("copiado");
            setTimeout(() => setEstado("listo"), 2000);
          } catch {
            setEstado("error");
          }
        }}
      >
        {estado === "copiado" ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
        <span aria-live="polite">{estado === "copiado" ? hecho : etiqueta}</span>
      </Boton>
      {estado === "error" && <p className="text-sm font-semibold text-peligro">Este navegador no dejó copiar. Selecciona el texto y cópialo a mano.</p>}
    </>
  );
}
