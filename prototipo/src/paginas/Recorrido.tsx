import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useDatos } from "../estado/datos";
import { marcaSegura } from "../lib/color";
import { Boton } from "../ui/Boton";

const QUE_PROBAR: Record<string, string> = {
  "ferreteria-ejemplo": "Mayorista: cajas y bultos, precios por cantidad, mínimos de venta, productos agotados y bajo pedido.",
  "textiles-ejemplo": "Tallas con existencia por talla, docenas, telas por metro y pedido mínimo más alto.",
};

const SIGUE = [
  "Panel de la plataforma: solicitudes de empresas, pagos y tasas",
  "Sitio de Vitrina y registro de empresas con doble factor",
];

export function Recorrido() {
  const EMPRESAS = useDatos((s) => s.empresas);
  const [confirmar, setConfirmar] = useState(false);
  const [reiniciado, setReiniciado] = useState(false);

  useEffect(() => {
    if (!confirmar) return;
    const t = setTimeout(() => setConfirmar(false), 5000);
    return () => clearTimeout(t);
  }, [confirmar]);

  const reiniciar = () => {
    if (!confirmar) {
      setConfirmar(true);
      return;
    }
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("vitrina."))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* sin almacenamiento no hay nada que borrar */
    }
    setReiniciado(true);
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <main id="contenido" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-10 outline-none">
      <p className="text-lg font-bold">Vitrina</p>
      <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-4xl">Catálogos con pedidos por WhatsApp</h1>
      <p className="mt-3 max-w-2xl text-lg text-tenue">
        Este boceto sirve para probar el diseño y los flujos antes de construir la aplicación. Todo funciona en tu navegador con datos de
        demostración; las tasas BCV sí son las del día.
      </p>

      <section aria-labelledby="titulo-catalogos" className="mt-10">
        <h2 id="titulo-catalogos" className="text-xl font-bold">
          Compra como cliente
        </h2>
        <ul className="mt-3 divide-y divide-linea border-y border-linea">
          {EMPRESAS.map((e) => {
            const { marca, texto } = marcaSegura(e.color);
            return (
              <li key={e.slug}>
                <Link to={`/c/${e.slug}`} className="flex items-center gap-4 rounded-control py-4 hover:bg-hundido sm:px-2">
                  <span
                    aria-hidden
                    style={{ background: marca, color: texto }}
                    className="grid size-11 shrink-0 place-items-center rounded-control text-sm font-bold"
                  >
                    {e.nombre
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">Catálogo de {e.nombre}</span>
                    <span className="block text-sm text-tenue">{QUE_PROBAR[e.slug]}</span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-tenue" aria-hidden />
                </Link>
              </li>
            );
          })}
          <li>
            <Link to="/cuenta" className="flex items-center gap-4 rounded-control py-4 hover:bg-hundido sm:px-2">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">Mi cuenta de comprador</span>
                <span className="block text-sm text-tenue">Historial de pedidos de todas las empresas, repetir pedido y datos para factura.</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-tenue" aria-hidden />
            </Link>
          </li>
        </ul>
      </section>

      <section aria-labelledby="titulo-empresa" className="mt-10">
        <h2 id="titulo-empresa" className="text-xl font-bold">
          Atiende como empresa
        </h2>
        <ul className="mt-3 divide-y divide-linea border-y border-linea">
          <li>
            <Link to="/panel" className="flex items-center gap-4 rounded-control py-4 hover:bg-hundido sm:px-2">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">Panel de la empresa</span>
                <span className="block text-sm text-tenue">
                  Confirma pedidos y mira cómo se aparta y descuenta el inventario. Productos, entrega, catálogo, equipo y suscripción. Entra con verificación en dos pasos.
                </span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-tenue" aria-hidden />
            </Link>
          </li>
        </ul>
        <p className="mt-2 text-sm text-tenue">Los pedidos que hagas como cliente le llegan al panel de esa empresa.</p>
      </section>

      <section aria-labelledby="titulo-sigue" className="mt-10">
        <h2 id="titulo-sigue" className="text-xl font-bold">
          En construcción esta semana
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-tenue">
          {SIGUE.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="titulo-reinicio" className="mt-10 border-t border-linea pt-6">
        <h2 id="titulo-reinicio" className="font-bold">
          Empezar de cero
        </h2>
        <p className="mt-1 text-sm text-tenue">Borra la sesión, los pedidos y el carrito de prueba guardados en este navegador.</p>
        <Boton variante="peligro" className="mt-3" onClick={reiniciar} disabled={reiniciado}>
          <span aria-live="polite">{reiniciado ? "Boceto reiniciado" : confirmar ? "Toca otra vez para confirmar" : "Reiniciar el boceto"}</span>
        </Boton>
      </section>
    </main>
  );
}
