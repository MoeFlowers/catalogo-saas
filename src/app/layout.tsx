import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Vitrina", template: "%s | Vitrina" },
  description: "Catálogos en línea con pedidos por WhatsApp para empresas en Venezuela.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f8fafc" };

export default function RaizLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
