import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useShallow } from "zustand/react/shallow";
import { PLANES } from "../../datos/planes";
import type { Denuncia } from "../../datos/tipos";
import { useDatos } from "../../estado/datos";
import { useTasas } from "../../estado/tasas";
import { formatear, formatearFecha, formatearTasa } from "../../lib/dinero";
import { Boton } from "../../ui/Boton";
import { Area, Campo } from "../../ui/Campo";
import { Dialogo } from "../../ui/Dialogo";
import { Aviso, EstadoVacio } from "../../ui/piezas";
import { Tabla } from "../../ui/Tabla";
import { Encabezado } from "../panel/comun";
import { useAdmin } from "./AdminLayout";
import { DialogoMotivo } from "./AdminOperacion";

const ORIGEN = { "en-vivo": "BCV y paralelo, en vivo", manual: "Fijada a mano", demostracion: "Demostración (fuente caída)" } as const;

/** "36,40" o "36.40" a número; null si no es una tasa válida */
function aTasa(t: string): number | null {
  const n = Number(t.trim().replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function AdminTasas() {
  const admin = useAdmin();
  const { tasas, enVivo, manual, historial, cargando, error, cargar, fijarManual, quitarManual } = useTasas();
  const auditar = useDatos((s) => s.auditar);
  const [f, setF] = useState({ bcv: "", usdt: "", eur: "" });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [hecho, setHecho] = useState<string | null>(null);

  const fijar = (e: FormEvent) => {
    e.preventDefault();
    const bcv = aTasa(f.bcv);
    const usdt = aTasa(f.usdt);
    const eur = f.eur.trim() ? aTasa(f.eur) : null;
    const err: Record<string, string> = {};
    if (bcv == null) err["t-bcv"] = "Escribe la tasa BCV, por ejemplo 36,40.";
    if (usdt == null) err["t-usdt"] = "Escribe la tasa USDT.";
    if (f.eur.trim() && eur == null) err["t-eur"] = "La tasa EUR no es válida; déjala vacía si no la tienes.";
    setErrores(err);
    const primero = Object.keys(err)[0];
    if (primero) return document.getElementById(primero)?.focus();
    fijarManual({ bcv: bcv!, usdt: usdt!, eur });
    auditar(admin.correo, "Fijó la tasa a mano", "tasas", `BCV ${formatearTasa(bcv!)}, USDT ${formatearTasa(usdt!)}`);
    setHecho("Tasa fijada. Todos los catálogos la usan desde ahora.");
    setF({ bcv: "", usdt: "", eur: "" });
  };

  return (
    <>
      <Encabezado titulo="Tasas">
        Fuente: ve.dolarapi.com (oficial y paralelo) y la paridad EUR/USD del BCE, como en Control de Deudas. En la app real se consultan desde el servidor varias veces al día.
      </Encabezado>

      <section aria-labelledby="vigente" className="max-w-3xl rounded-tarjeta border border-linea bg-superficie p-4">
        <h2 id="vigente" className="font-bold">
          Tasa vigente
        </h2>
        {tasas ? (
          <dl className="cifras mt-2 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
            <dt className="text-tenue">USD (BCV)</dt>
            <dd className="font-bold">Bs {formatearTasa(tasas.bcv)}</dd>
            <dt className="text-tenue">USDT (paralelo)</dt>
            <dd>Bs {formatearTasa(tasas.usdt)}</dd>
            <dt className="text-tenue">EUR</dt>
            <dd>{tasas.eur ? `Bs ${formatearTasa(tasas.eur)}` : "Sin paridad"}</dd>
            <dt className="text-tenue">Origen</dt>
            <dd>
              {ORIGEN[tasas.origen]}, {formatearFecha(tasas.fecha, true)}
            </dd>
          </dl>
        ) : (
          <p className="mt-2 text-tenue">{cargando ? "Consultando las fuentes." : "Sin tasa."}</p>
        )}
        {error && (
          <div className="mt-3">
            <Aviso tipo="alerta">La última consulta a las fuentes falló. Se usa la última tasa válida{manual ? " (la manual)" : ""}.</Aviso>
          </div>
        )}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Boton onClick={() => cargar(true)} cargando={cargando} textoCargando="Consultando">
            Consultar ahora
          </Boton>
          {manual && (
            <Boton
              variante="peligro"
              onClick={() => {
                quitarManual();
                auditar(admin.correo, "Quitó la tasa manual", "tasas");
                setHecho(`Se vuelve a la tasa en vivo${enVivo ? ` (BCV ${formatearTasa(enVivo.bcv)})` : ""}.`);
              }}
            >
              Volver a la tasa en vivo
            </Boton>
          )}
        </div>
      </section>

      {hecho && (
        <p role="status" className="mt-4 text-sm font-semibold text-exito">
          {hecho}
        </p>
      )}

      <form onSubmit={fijar} noValidate className="mt-6 max-w-3xl space-y-4 rounded-tarjeta border border-linea bg-superficie p-4">
        <h2 className="font-bold">Fijar la tasa a mano</h2>
        <p className="text-sm text-tenue">Solo si las fuentes fallan o publican un valor equivocado. Queda en la auditoría y manda sobre la consulta en vivo hasta que la quites.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo id="t-bcv" etiqueta="USD BCV (Bs)" inputMode="decimal" value={f.bcv} onChange={(e) => setF({ ...f, bcv: e.target.value })} error={errores["t-bcv"]} />
          <Campo id="t-usdt" etiqueta="USDT (Bs)" inputMode="decimal" value={f.usdt} onChange={(e) => setF({ ...f, usdt: e.target.value })} error={errores["t-usdt"]} />
          <Campo id="t-eur" etiqueta="EUR (Bs)" opcional inputMode="decimal" value={f.eur} onChange={(e) => setF({ ...f, eur: e.target.value })} error={errores["t-eur"]} />
        </div>
        <Boton type="submit" variante="accion">
          Fijar tasa
        </Boton>
      </form>

      <section aria-labelledby="historial" className="mt-8 max-w-3xl">
        <h2 id="historial" className="text-lg font-bold">
          Historial
        </h2>
        {historial.length === 0 ? (
          <p className="mt-2 text-tenue">Se llena con cada consulta.</p>
        ) : (
          <ul className="cifras mt-2 divide-y divide-linea rounded-tarjeta border border-linea bg-superficie text-sm">
            {historial.slice(0, 20).map((t, i) => (
              <li key={`${t.fecha}-${i}`} className="flex flex-wrap justify-between gap-2 px-4 py-2.5">
                <span>{formatearFecha(t.fecha, true)}</span>
                <span>
                  BCV {formatearTasa(t.bcv)}, USDT {formatearTasa(t.usdt)}
                </span>
                <span className="text-tenue">{ORIGEN[t.origen]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

const MOTIVO_DENUNCIA: Record<Denuncia["motivo"], string> = {
  estafa: "Posible estafa o suplantación",
  ilegal: "Productos ilegales",
  precios: "Precios o productos que no coinciden",
  otro: "Otro",
};

export function AdminDenuncias() {
  const admin = useAdmin();
  const denuncias = useDatos((s) => s.denuncias);
  const empresas = useDatos((s) => s.empresas);
  const resolver = useDatos((s) => s.resolverDenuncia);
  const [accion, setAccion] = useState<{ d: Denuncia; tipo: "resuelta" | "desestimada" } | null>(null);
  const abiertas = denuncias.filter((d) => d.estado === "abierta");
  const cerradas = denuncias.filter((d) => d.estado !== "abierta");
  const nombre = (slug: string) => empresas.find((e) => e.slug === slug)?.nombre ?? slug;

  const Tarjeta = ({ d }: { d: Denuncia }) => (
    <li className="rounded-tarjeta border border-linea bg-superficie p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Link to={`/admin/empresas/${d.empresa}`} className="font-bold text-accion underline-offset-2 hover:underline">
          {nombre(d.empresa)}
        </Link>
        <span className="text-sm text-tenue">{formatearFecha(d.fecha, true)}</span>
      </div>
      <p className="mt-1 text-sm font-semibold">{MOTIVO_DENUNCIA[d.motivo]}</p>
      <p className="mt-1">{d.detalle}</p>
      <p className="mt-1 break-all text-sm text-tenue">Reportó: {d.autor}</p>
      {d.resolucion && (
        <p className="mt-2 text-sm">
          <span className="font-semibold">{d.estado === "resuelta" ? "Resuelta" : "Desestimada"}:</span> {d.resolucion}
        </p>
      )}
      {d.estado === "abierta" && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Boton variante="accion" onClick={() => setAccion({ d, tipo: "resuelta" })}>
            Marcar resuelta
          </Boton>
          <Boton onClick={() => setAccion({ d, tipo: "desestimada" })}>Desestimar</Boton>
        </div>
      )}
    </li>
  );

  return (
    <>
      <Encabezado titulo="Denuncias">
        Reportes de compradores desde el pie de cada catálogo. Si hay riesgo para los compradores, suspende la empresa desde su ficha.
      </Encabezado>
      <h2 className="text-lg font-bold">Abiertas</h2>
      {abiertas.length === 0 ? <p className="mt-2 text-tenue">No hay denuncias abiertas.</p> : <ul className="mt-2 space-y-3">{abiertas.map((d) => <Tarjeta key={d.id} d={d} />)}</ul>}
      <h2 className="mt-8 text-lg font-bold">Cerradas</h2>
      {cerradas.length === 0 ? <p className="mt-2 text-tenue">Ninguna todavía.</p> : <ul className="mt-2 space-y-3">{cerradas.map((d) => <Tarjeta key={d.id} d={d} />)}</ul>}
      <DialogoMotivo
        abierto={accion != null}
        titulo={accion?.tipo === "resuelta" ? "Marcar la denuncia como resuelta" : "Desestimar la denuncia"}
        explicacion="Escribe qué revisaste y qué decidiste. Queda en la auditoría de la empresa."
        boton={accion?.tipo === "resuelta" ? "Marcar resuelta" : "Desestimar"}
        onCerrar={() => setAccion(null)}
        onConfirmar={(texto) => {
          resolver(accion!.d.id, accion!.tipo, texto, admin.correo);
          setAccion(null);
        }}
      />
    </>
  );
}

interface FilaComprador {
  correo: string;
  nombre: string;
  pedidos: number;
  empresas: number;
  totalBs: number;
}

export function AdminCompradores() {
  const admin = useAdmin();
  const { pedidos, bloqueados, bloquear } = useDatos(useShallow((s) => ({ pedidos: s.pedidos, bloqueados: s.bloqueados, bloquear: s.bloquearComprador })));
  const [q, setQ] = useState("");
  const [motivo, setMotivo] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filas = Object.values(
    pedidos.reduce<Record<string, FilaComprador & { slugs: Set<string> }>>((acc, p) => {
      const c = (acc[p.compradorCorreo] ??= { correo: p.compradorCorreo, nombre: p.comprador.nombre, pedidos: 0, empresas: 0, totalBs: 0, slugs: new Set() });
      c.pedidos += 1;
      c.slugs.add(p.empresa);
      c.empresas = c.slugs.size;
      if (p.estado !== "cancelado") c.totalBs += p.totalBsCent;
      return acc;
    }, {}),
  )
    .filter((c) => !q || `${c.nombre} ${c.correo}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.pedidos - a.pedidos);

  const confirmarBloqueo = (e: FormEvent) => {
    e.preventDefault();
    if (texto.trim().length < 10) {
      setError("Escribe el motivo en al menos una frase.");
      return;
    }
    bloquear(motivo!, true, texto.trim(), admin.correo);
    setMotivo(null);
    setTexto("");
    setError(null);
  };

  return (
    <>
      <Encabezado titulo="Compradores">Quienes han hecho pedidos. Bloquear impide enviar pedidos nuevos; su historial se conserva.</Encabezado>
      <div className="mb-4 max-w-sm">
        <Campo id="buscar-comprador" etiqueta="Buscar" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nombre o correo" />
      </div>
      {filas.length === 0 ? (
        <EstadoVacio titulo="Ningún comprador coincide" />
      ) : (
        <Tabla<FilaComprador>
          titulo="Compradores"
          filas={filas}
          clave={(c) => c.correo}
          resaltar={(c) => bloqueados.includes(c.correo)}
          columnas={[
            {
              titulo: "Comprador",
              principal: true,
              celda: (c) => (
                <span>
                  <span className="font-semibold">{c.nombre}</span>
                  <span className="block break-all text-sm font-normal text-tenue">{c.correo}</span>
                </span>
              ),
            },
            { titulo: "Pedidos", derecha: true, celda: (c) => c.pedidos },
            { titulo: "Empresas", derecha: true, celda: (c) => c.empresas },
            { titulo: "Total", derecha: true, celda: (c) => formatear(c.totalBs, "VES") },
            {
              titulo: "Estado",
              celda: (c) =>
                bloqueados.includes(c.correo) ? (
                  <button type="button" onClick={() => bloquear(c.correo, false, "", admin.correo)} className="min-h-11 text-sm font-semibold text-accion underline underline-offset-2">
                    Bloqueado: desbloquear<span className="sr-only"> a {c.correo}</span>
                  </button>
                ) : (
                  <button type="button" onClick={() => setMotivo(c.correo)} className="min-h-11 text-sm font-semibold text-peligro underline underline-offset-2">
                    Bloquear<span className="sr-only"> a {c.correo}</span>
                  </button>
                ),
            },
          ]}
        />
      )}
      <Dialogo abierto={motivo != null} titulo="Bloquear comprador" onCerrar={() => setMotivo(null)}>
        <form onSubmit={confirmarBloqueo} noValidate className="space-y-4">
          <p className="break-all text-tenue">{motivo} no podrá enviar pedidos nuevos en ningún catálogo.</p>
          <Area id="motivo-bloqueo" etiqueta="Motivo" value={texto} onChange={(e) => setTexto(e.target.value)} error={error} rows={3} autoFocus />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Boton onClick={() => setMotivo(null)}>Volver</Boton>
            <Boton type="submit" variante="peligro">
              Bloquear
            </Boton>
          </div>
        </form>
      </Dialogo>
    </>
  );
}

export function AdminPlanes() {
  const empresas = useDatos((s) => s.empresas);
  return (
    <>
      <Encabezado titulo="Planes">
        Precios propuestos en el plan maestro, sin validar con empresas reales. Cambiarlos es una decisión de negocio: se ajustan en el código antes del lanzamiento.
      </Encabezado>
      <div tabIndex={0} role="region" aria-label="Planes, tabla desplazable" className="max-w-4xl overflow-x-auto rounded-tarjeta border border-linea bg-superficie">
        <table className="w-full min-w-[36rem] text-sm">
          <caption className="sr-only">Planes y empresas en cada uno</caption>
          <thead>
            <tr className="border-b border-linea text-left text-tenue">
              <th scope="col" className="px-4 py-3 font-semibold">
                Plan
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Usuarios
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Productos
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Almacenes
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Al mes
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Empresas activas
              </th>
            </tr>
          </thead>
          <tbody className="cifras">
            {PLANES.map((p) => (
              <tr key={p.id} className="border-b border-linea last:border-0">
                <th scope="row" className="px-4 py-3 text-left font-semibold">
                  {p.nombre}
                </th>
                <td className="px-4 py-3 text-right">{p.usuarios}</td>
                <td className="px-4 py-3 text-right">{p.productos?.toLocaleString("es-VE") ?? "Sin límite"}</td>
                <td className="px-4 py-3 text-right">{p.almacenes}</td>
                <td className="px-4 py-3 text-right">USD {p.precioUsdCent / 100}</td>
                <td className="px-4 py-3 text-right">{empresas.filter((e) => e.plan === p.id && e.estado === "activa").length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function AdminAuditoria() {
  const auditoria = useDatos((s) => s.auditoria);
  return (
    <>
      <Encabezado titulo="Auditoría">Cada decisión del equipo de Vitrina: aprobaciones, suspensiones, pagos, tasas, bloqueos y visitas de soporte.</Encabezado>
      {auditoria.length === 0 ? (
        <EstadoVacio titulo="Sin eventos todavía">Aparecen aquí al aprobar, suspender, validar pagos o fijar tasas.</EstadoVacio>
      ) : (
        <ul className="max-w-4xl divide-y divide-linea rounded-tarjeta border border-linea bg-superficie text-sm">
          {auditoria.map((a) => (
            <li key={a.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr]">
              <span className="cifras text-tenue">{formatearFecha(a.fecha, true)}</span>
              <span>
                <span className="font-semibold">{a.actor}</span> {a.accion.toLowerCase()} <span className="font-semibold">{a.objetivo}</span>
                {a.detalle && <span className="block text-tenue">{a.detalle}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
