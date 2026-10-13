import Link from "next/link";
import type { ReactNode } from "react";
import { PLANES } from "@/modulos/planes";
import { BotonEnlace } from "@/ui/Boton";

/** Cabecera del sitio, compartida con términos, privacidad y registro */
export function CabeceraSitio() {
  return (
    <header className="border-b border-linea bg-superficie">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-1 px-4 py-3">
        <Link href="/" className="mr-auto text-lg font-bold">
          Vitrina
        </Link>
        <nav aria-label="Sitio" className="flex flex-wrap items-center gap-1 text-sm font-semibold">
          <Link href="/#planes" className="flex min-h-11 items-center rounded-control px-3 hover:bg-hundido">
            Planes
          </Link>
          <Link href="/panel/entrar" className="flex min-h-11 items-center rounded-control px-3 hover:bg-hundido">
            Entrar
          </Link>
          <BotonEnlace href="/registro" variante="accion" className="text-sm">
            Registrar mi empresa
          </BotonEnlace>
        </nav>
      </div>
    </header>
  );
}

export function PieSitio() {
  return (
    <footer className="border-t border-linea bg-superficie">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm sm:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p className="font-bold">Vitrina</p>
          <p className="mt-1 max-w-sm text-tenue">Catálogos en línea con pedidos por WhatsApp para empresas en Venezuela.</p>
        </div>
        <nav aria-label="Pie de página" className="flex flex-wrap gap-x-5 gap-y-1">
          <Link href="/registro" className="flex min-h-11 items-center underline-offset-2 hover:underline">
            Registrar mi empresa
          </Link>
          <Link href="/panel/entrar" className="flex min-h-11 items-center underline-offset-2 hover:underline">
            Entrar como empresa
          </Link>
          <Link href="/entrar" className="flex min-h-11 items-center underline-offset-2 hover:underline">
            Entrar como comprador
          </Link>
          <Link href="/terminos" className="flex min-h-11 items-center underline-offset-2 hover:underline">
            Términos
          </Link>
          <Link href="/privacidad" className="flex min-h-11 items-center underline-offset-2 hover:underline">
            Privacidad
          </Link>
          <Link href="https://moeflowers.github.io/catalogo-saas/#/recorrido" className="flex min-h-11 items-center underline-offset-2 hover:underline">
            Boceto navegable
          </Link>
        </nav>
      </div>
    </footer>
  );
}

const PASOS: [string, string][] = [
  ["Registras tu empresa", "Con correo, contraseña y verificación en dos pasos. Revisamos los datos para que nadie use Vitrina para estafar."],
  ["Cargas tu catálogo", "Productos con fotos, presentaciones (unidad, caja, bulto), precios por cantidad y existencias. En USD: el catálogo los muestra en bolívares."],
  ["Compartes el enlace", "Por WhatsApp, Instagram o con el código QR en el mostrador. Tus clientes no instalan nada."],
  ["Recibes el pedido en WhatsApp", "Ordenado, con totales en Bs y referencia en USD. Lo confirmas en el panel y la mercancía queda apartada."],
];

const RESUELVE: [string, ReactNode][] = [
  ["Precios en bolívares al día", "Cargas en dólares y el catálogo muestra bolívares a tasa BCV con la referencia en USD. Cada pedido guarda la tasa del día en que se hizo."],
  ["Venta al mayor de verdad", "Cajas y bultos, precios que bajan por cantidad, mínimos de venta y múltiplos. El pedido no deja enviar cantidades que no vendes."],
  ["Inventario que no se descuadra", "Confirmar un pedido aparta la mercancía; despacharlo la descuenta; cancelarlo la libera. Cada movimiento queda registrado."],
  ["Clientes que vuelven", "Tus compradores ven el historial de sus pedidos y repiten uno con los precios de hoy en dos toques."],
  ["Tu equipo con permisos", "Vendedores que confirman pedidos, almacén que despacha, y nadie más toca los precios."],
];

const PREGUNTAS: [string, string][] = [
  ["¿Necesito pagar con tarjeta?", "No. La suscripción se paga por pago móvil, transferencia, Zelle o USDT; reportas el pago en el panel y lo validamos."],
  ["¿Mis clientes tienen que instalar algo?", "No. Abren el enlace en el navegador del teléfono. Para enviar el pedido crean una cuenta, con Google o con su correo."],
  ["¿Vitrina cobra comisión por pedido?", "No. Pagas la suscripción del plan y los pedidos son tuyos; llegan a tu propio número de WhatsApp."],
  ["¿Qué pasa si se vence mi suscripción?", "El catálogo se sigue viendo pero no recibe pedidos, y no se borra nada. Al validar tu pago vuelve a funcionar."],
  ["¿De dónde sale la tasa?", "De la tasa oficial del BCV, consultada varias veces al día. Si la fuente falla se usa la última válida."],
];

export default function PortadaSitio() {
  return (
    <>
      <CabeceraSitio />
      <main id="contenido" tabIndex={-1} className="outline-none">
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] md:py-20">
          <div>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Tu catálogo en línea. Tus pedidos por WhatsApp.</h1>
            <p className="mt-4 max-w-xl text-lg text-tenue">
              Sube tus productos, comparte un enlace y recibe pedidos ordenados en el WhatsApp de tu empresa, con precios en bolívares y referencia en dólares. Hecho para
              mayoristas y distribuidores en Venezuela.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <BotonEnlace href="/registro" variante="accion" className="px-6">
                Registrar mi empresa
              </BotonEnlace>
              <BotonEnlace href="https://moeflowers.github.io/catalogo-saas/#/c/ferreteria-ejemplo">Ver un catálogo de ejemplo</BotonEnlace>
            </div>
            <p className="mt-4 text-sm text-tenue">El primer mes es gratis desde que aprobamos tu empresa.</p>
          </div>

          <div className="space-y-4">
            <figure className="rounded-tarjeta border border-linea bg-[#f0fdf4] p-4">
              <figcaption className="text-sm font-semibold text-tenue">Así te llega el pedido</figcaption>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {"Hola, quiero hacer este pedido en Ferretería Ejemplo:\n\nPedido #0042\n5 x Tornillo autorroscante 3/8 (Caja de 100)\n1 x Martillo de uña 16 oz (Unidad)\n\nTotal en Bs con referencia en USD\nEntrega: envío por encomienda\n\nVer pedido: enlace al detalle"}
              </pre>
            </figure>
          </div>
        </section>

        <section aria-labelledby="como" className="border-y border-linea bg-superficie">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 id="como" className="text-2xl font-bold">
              Cómo funciona
            </h2>
            <ol className="mt-8 grid gap-8 md:grid-cols-4">
              {PASOS.map(([t, d], i) => (
                <li key={t} className="border-t-2 border-tinta pt-3">
                  <p className="cifras text-sm font-semibold text-tenue">Paso {i + 1}</p>
                  <p className="mt-1 font-bold">{t}</p>
                  <p className="mt-1 text-sm text-tenue">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="resuelve" className="mx-auto max-w-6xl px-4 py-14">
          <h2 id="resuelve" className="text-2xl font-bold">
            Lo que resuelve
          </h2>
          <dl className="mt-8 grid gap-x-12 gap-y-8 md:grid-cols-2">
            {RESUELVE.map(([t, d]) => (
              <div key={t}>
                <dt className="text-lg font-bold">{t}</dt>
                <dd className="mt-1 text-tenue">{d}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="planes" aria-labelledby="titulo-planes" className="scroll-mt-4 border-y border-linea bg-superficie">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 id="titulo-planes" className="text-2xl font-bold">
              Planes
            </h2>
            <p className="mt-2 max-w-2xl text-tenue">Mensuales, sin comisión por pedido. Los precios son una propuesta y se fijan antes del lanzamiento.</p>
            <div tabIndex={0} role="region" aria-label="Planes, tabla desplazable" className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left">
                <caption className="sr-only">Planes de Vitrina</caption>
                <thead>
                  <tr className="border-b border-tinta text-sm">
                    <th scope="col" className="py-3 pr-4">
                      Plan
                    </th>
                    <th scope="col" className="py-3 pr-4 text-right">
                      Usuarios
                    </th>
                    <th scope="col" className="py-3 pr-4 text-right">
                      Productos
                    </th>
                    <th scope="col" className="py-3 pr-4">
                      Incluye
                    </th>
                    <th scope="col" className="py-3 text-right">
                      Al mes
                    </th>
                  </tr>
                </thead>
                <tbody className="cifras">
                  {PLANES.map((p) => (
                    <tr key={p.id} className="border-b border-linea">
                      <th scope="row" className="py-4 pr-4 font-bold">
                        {p.nombre}
                      </th>
                      <td className="py-4 pr-4 text-right">{p.usuarios}</td>
                      <td className="py-4 pr-4 text-right">{p.productos?.toLocaleString("es-VE") ?? "Sin límite"}</td>
                      <td className="py-4 pr-4 text-tenue">{p.incluye}</td>
                      <td className="py-4 text-right font-bold">USD {p.precioUsdCent / 100}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-tenue">Usuario extra en Negocio y Mayorista: USD 3 al mes. Se paga en bolívares a tasa BCV o en divisas.</p>
          </div>
        </section>

        <section aria-labelledby="preguntas" className="mx-auto max-w-3xl px-4 py-14">
          <h2 id="preguntas" className="text-2xl font-bold">
            Preguntas frecuentes
          </h2>
          <div className="mt-6 divide-y divide-linea border-y border-linea">
            {PREGUNTAS.map(([q, r]) => (
              <details key={q} className="group py-1">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {q}
                  <span aria-hidden className="text-xl text-tenue group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pb-4 text-tenue">{r}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="flex flex-col items-start justify-between gap-4 rounded-tarjeta bg-tinta p-6 text-white sm:flex-row sm:items-center sm:p-8">
            <p className="text-xl font-bold">Arma tu catálogo hoy y compártelo esta misma semana.</p>
            <Link href="/registro" className="inline-flex min-h-11 shrink-0 items-center rounded-control bg-white px-5 font-semibold text-tinta hover:bg-hundido">
              Registrar mi empresa
            </Link>
          </div>
        </section>
      </main>
      <PieSitio />
    </>
  );
}
