import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { Copiar } from "@/componentes/comun/Copiar";
import { IconoWhatsApp } from "@/componentes/comun/IconoWhatsApp";
import { TasaDelDia } from "@/componentes/comun/Tasa";
import { Estado, hace } from "@/componentes/panel/comun";
import { conContexto } from "@/lib/db";
import { env } from "@/lib/env";
import { formatear, formatearFecha } from "@/dominio/dinero";
import { filasInventario } from "@/dominio/inventario";
import { diasHasta } from "@/dominio/permisos";
import { numeroPedido } from "@/dominio/pedido";
import { productosDe } from "@/modulos/catalogo/consultas";
import { contextoPanel } from "@/modulos/cuentas/panel";
import { tasasActuales } from "@/modulos/monedas/tasas";
import { cargarPedidos } from "@/modulos/pedidos/servicio";
import { clasesBoton } from "@/ui/Boton";
import { Aviso } from "@/ui/piezas";

export const metadata: Metadata = { title: "Inicio del panel" };

export default async function Inicio() {
  const { ctx, empresa } = await contextoPanel();
  const [pedidos, productos, tasas] = await Promise.all([
    conContexto(ctx, (tx) => cargarPedidos(tx, { estados: ["pendiente", "confirmado", "preparacion", "listo", "despachado"] })),
    conContexto(ctx, (tx) => productosDe(tx, empresa.id, { soloActivos: true })),
    tasasActuales(),
  ]);
  const porConfirmar = pedidos.filter((p) => p.estado === "pendiente").sort((a, b) => a.fecha.localeCompare(b.fecha));
  const enCurso = pedidos.length - porConfirmar.length;
  const bajos = filasInventario(productos).filter((f) => f.bajo);
  const enlace = `${env.APP_URL}/c/${empresa.slug}`;
  const qr = await QRCode.toString(enlace, { type: "svg", margin: 1, color: { dark: "#1e293b", light: "#ffffff" } });
  const diasPlan = diasHasta(empresa.vence);

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Inicio</h1>

      <div className="mb-6 space-y-3 empty:hidden">
        {!empresa.whatsapp && (
          <Aviso tipo="alerta" titulo="Falta tu número de WhatsApp">
            Los pedidos llegan a ese número.{" "}
            <Link href="/panel/catalogo" className="font-semibold underline underline-offset-2">
              Configurarlo en Catálogo
            </Link>
          </Aviso>
        )}
        {empresa.estado === "activa" && !empresa.publicado && (
          <Aviso tipo="alerta" titulo="Tu catálogo no está publicado">
            Nadie puede verlo ni pedir.{" "}
            <Link href="/panel/catalogo" className="font-semibold underline underline-offset-2">
              Publicarlo en Catálogo
            </Link>
          </Aviso>
        )}
        {empresa.estado === "activa" && diasPlan > 0 && diasPlan <= 7 && (
          <Aviso titulo={`Tu suscripción vence en ${diasPlan} ${diasPlan === 1 ? "día" : "días"}`}>
            Reporta tu pago para seguir recibiendo pedidos.{" "}
            <Link href="/panel/suscripcion" className="font-semibold underline underline-offset-2">
              Ir a Suscripción
            </Link>
          </Aviso>
        )}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-8">
          <section aria-labelledby="por-confirmar">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="por-confirmar" className="text-lg font-bold">
                Por confirmar <span className="cifras text-tenue">({porConfirmar.length})</span>
              </h2>
              <Link href="/panel/pedidos" className="text-sm font-semibold text-accion underline underline-offset-2">
                Todos los pedidos
              </Link>
            </div>
            <p className="text-sm text-tenue">Confirmar aparta la mercancía. Los más viejos van primero.</p>
            {porConfirmar.length === 0 ? (
              <p className="mt-3 rounded-tarjeta border border-dashed border-control p-4 text-tenue">No tienes pedidos por confirmar.</p>
            ) : (
              <ul className="mt-3 divide-y divide-linea rounded-tarjeta border border-linea bg-superficie">
                {porConfirmar.map((p) => (
                  <li key={p.id}>
                    <Link href={`/panel/pedidos/${p.id}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-0.5 px-4 py-3 hover:bg-hundido">
                      <span className="font-semibold">
                        <span className="cifras">{numeroPedido(p.numero)}</span> {p.comprador.nombre}
                      </span>
                      <span className="cifras text-right font-semibold">{formatear(p.totalBsCent, "VES")}</span>
                      <span className="text-sm text-tenue">
                        {hace(p.fecha)}, {p.items.length} {p.items.length === 1 ? "producto" : "productos"}
                        {p.whatsappAbierto ? ", abrió WhatsApp" : <span className="font-semibold text-alerta">, no abrió WhatsApp</span>}
                      </span>
                      <span className="text-right">
                        <Estado estado={p.estado} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {enCurso > 0 && (
              <p className="mt-3 text-sm">
                Además tienes{" "}
                <Link href="/panel/pedidos?vista=curso" className="font-semibold text-accion underline underline-offset-2">
                  {enCurso} {enCurso === 1 ? "pedido en curso" : "pedidos en curso"}
                </Link>{" "}
                por preparar, despachar o entregar.
              </p>
            )}
          </section>

          <section aria-labelledby="stock-bajo">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="stock-bajo" className="text-lg font-bold">
                Stock bajo <span className="cifras text-tenue">({bajos.length})</span>
              </h2>
              <Link href="/panel/inventario?bajo=1" className="text-sm font-semibold text-accion underline underline-offset-2">
                Ver inventario
              </Link>
            </div>
            {bajos.length === 0 ? (
              <p className="mt-3 rounded-tarjeta border border-dashed border-control p-4 text-tenue">
                {productos.length === 0 ? "Todavía no tienes productos." : "Ningún producto está por debajo de su mínimo."}
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-linea rounded-tarjeta border border-linea bg-superficie">
                {bajos.slice(0, 6).map((f) => (
                  <li key={`${f.clave.productoId}-${f.clave.varianteId ?? ""}`} className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{f.nombre}</span>
                      <span className="cifras block text-sm text-tenue">{f.sku}</span>
                    </span>
                    <span className={`cifras shrink-0 text-right text-sm font-semibold ${f.disponible === 0 ? "text-peligro" : "text-alerta"}`}>
                      {f.disponible === 0 ? "Agotado" : `${f.disponible} disponibles`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section aria-labelledby="compartir" className="rounded-tarjeta border border-linea bg-superficie p-4">
            <h2 id="compartir" className="font-bold">
              Comparte tu catálogo
            </h2>
            <p className="mt-1 break-all text-sm text-tenue">{enlace}</p>
            {empresa.estado === "activa" && empresa.publicado ? (
              <>
                <div
                  className="mx-auto mt-3 w-40 [&_svg]:h-auto [&_svg]:w-full"
                  role="img"
                  aria-label={`Código QR del enlace del catálogo de ${empresa.nombre}`}
                  dangerouslySetInnerHTML={{ __html: qr }}
                />
                <div className="mt-3 grid gap-2">
                  <Copiar texto={enlace} etiqueta="Copiar enlace" hecho="Enlace copiado" />
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Mira nuestro catálogo y haz tu pedido: ${enlace}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={clasesBoton("secundario")}
                  >
                    <IconoWhatsApp />
                    Compartir por WhatsApp
                  </a>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm">Podrás compartirlo cuando esté aprobado y publicado.</p>
            )}
          </section>

          <section aria-labelledby="tasa" className="rounded-tarjeta border border-linea bg-superficie p-4 text-sm">
            <h2 id="tasa" className="font-bold">
              Precios de hoy
            </h2>
            <p className="mt-1">
              <TasaDelDia tasas={tasas} />
            </p>
            <p className="mt-1 text-tenue">Tus precios en {empresa.monedaBase} se muestran en bolívares con esta tasa. Cada pedido guarda la tasa del día en que se hizo.</p>
          </section>

          <p className="text-sm text-tenue">
            Tu plan vence el {formatearFecha(empresa.vence)}.{" "}
            <Link href="/panel/suscripcion" className="font-semibold text-tinta underline underline-offset-2">
              Ver plan
            </Link>
          </p>
        </aside>
      </div>
    </>
  );
}
