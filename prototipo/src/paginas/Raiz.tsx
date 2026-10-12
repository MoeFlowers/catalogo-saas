import { useEffect } from "react";
import { Outlet, ScrollRestoration } from "react-router";
import { useTasas } from "../estado/tasas";
import { BarraBoceto } from "../ui/piezas";

export function Raiz() {
  const cargar = useTasas((s) => s.cargar);
  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <>
      {/* Con rutas de hash, un enlace a #contenido cambiaría de página: se mueve el foco a mano */}
      <a
        href="#contenido"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("contenido")?.focus();
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-control focus:bg-superficie focus:px-4 focus:py-2">
        Saltar al contenido
      </a>
      <BarraBoceto />
      <Outlet />
      <ScrollRestoration />
    </>
  );
}
