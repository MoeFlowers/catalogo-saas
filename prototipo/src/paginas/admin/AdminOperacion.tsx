import { ChevronLeft, ExternalLink, Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { useShallow } from "zustand/react/shallow";
import { planDe } from "../../datos/planes";
import type { Empresa, EstadoEmpresa, Pago } from "../../datos/tipos";
import { useDatos, useEmpresaPorSlug } from "../../estado/datos";
import { useSesion } from "../../estado/sesion";
import { formatear, formatearFecha } from "../../lib/dinero";
import { suscripcionVencida } from "../../lib/permisos";
import { Boton } from "../../ui/Boton";
import { Area } from "../../ui/Campo";
import { Dialogo } from "../../ui/Dialogo";
import { Aviso, EstadoVacio } from "../../ui/piezas";
import { Tabla } from "../../ui/Tabla";
import { NoEncontrado } from "../NoEncontrado";
import { Encabezado, hace } from "../panel/comun";
import { useAdmin } from "./AdminLayout";

export const NOMBRE_ESTADO_EMPRESA: Record<EstadoEmpresa, string> = {
  "en-revision": "En revisión",
  activa: "Activa",
  rechazada: "Rechazada",
  suspendida: "Suspendida",
};

export function EstadoEmpresaInsignia({ e }: { e: Empresa }) {
  const vencida = e.estado === "activa" && suscripcionVencida(e);
  const clase =
    e.estado === "activa" && !vencida ? "border-exito/50 text-exito" : e.estado === "en-revision" ? "border-alerta/50 text-alerta" : "border-peligro/50 text-peligro";
  return (
    <span className={`inline-block whitespace-nowrap rounded-control border px-2 py-0.5 text-xs font-semibold ${clase}`}>
      {vencida ? "Suscripción vencida" : NOMBRE_ESTADO_EMPRESA[e.estado]}
    </span>
  );
}

/** Diálogo para las decisiones que necesitan un motivo escrito: lo ve la empresa y queda en la auditoría */
export function DialogoMotivo({
  abierto,
  titulo,
  explicacion,
  boton,
  onCerrar,
  onConfirmar,
}: {
  abierto: boolean;
  titulo: string;
  explicacion: string;
  boton: string;
  onCerrar: () => void;
  onConfirmar: (motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (motivo.trim().length < 10) {
      setError("Escribe el motivo en al menos una frase: la empresa lo va a leer.");
      document.getElementById("motivo-decision")?.focus();
      return;
    }
    onConfirmar(motivo.trim());
    setMotivo("");
    setError(null);
  };
  return (
    <Dialogo abierto={abierto} titulo={titulo} onCerrar={onCerrar}>
      <form onSubmit={enviar} noValidate className="space-y-4">
        <p className="text-tenue">{explicacion}</p>
        <Area id="motivo-decision" etiqueta="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} error={error} rows={3} autoFocus />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Boton onClick={onCerrar}>Volver</Boton>
          <Boton type="submit" variante="peligro">
            {boton}
          </Boton>
        </div>
      </form>
    </Dialogo>
  );
}

export function AdminResumen() {
  const { empresas, pedidos, pagos, denuncias } = useDatos(useShallow((s) => ({ empresas: s.empresas, pedidos: s.pedidos, pagos: s.pagos, denuncias: s.denuncias })));
  const semana = Date.now() - 7 * 86_400_000;
  const enSieteDias = Date.now() + 7 * 86_400_000;
  const solicitudes = empresas.filter((e) => e.estado === "en-revision");
  const porValidar = pagos.filter((p) => p.estado === "en-revision");
  const abiertas = denuncias.filter((d) => d.estado === "abierta");
  const activas = empresas.filter((e) => e.estado === "activa");
  const vencen = activas.filter((e) => new Date(e.vence).getTime() < enSieteDias).sort((a, b) => a.vence.localeCompare(b.vence));
  const pedidosSemana = pedidos.filter((p) => new Date(p.fecha).getTime() > semana);
  const compradores = new Set(pedidosSemana.map((p) => p.compradorCorreo)).size;

  const tareas: [string, number, string][] = [
    ["Solicitudes por revisar", solicitudes.length, "/admin/solicitudes"],
    ["Pagos por validar", porValidar.length, "/admin/pagos"],
    ["Denuncias abiertas", abiertas.length, "/admin/denuncias"],
  ];

  return (
    <>
      <Encabezado titulo="Resumen">Lo que necesita una decisión hoy, y cómo va la plataforma esta semana.</Encabezado>
      <section aria-labelledby="por-atender">
        <h2 id="por-atender" className="text-lg font-bold">
          Por atender
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {tareas.map(([t, n, ruta]) => (
            <li key={t}>
              <Link to={ruta} className={`block rounded-tarjeta border p-4 hover:bg-hundido ${n > 0 ? "border-alerta/50 bg-[#fffbeb]" : "border-linea bg-superficie"}`}>
                <span className="cifras block text-3xl font-bold">{n}</span>
                <span className="font-semibold">{t}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-2">
        <section aria-labelledby="vencen">
          <h2 id="vencen" className="text-lg font-bold">
            Suscripciones que vencen en 7 días o vencidas
          </h2>
          {vencen.length === 0 ? (
            <p className="mt-2 text-tenue">Ninguna.</p>
          ) : (
            <ul className="mt-2 divide-y divide-linea rounded-tarjeta border border-linea bg-superficie">
              {vencen.map((e) => (
                <li key={e.slug}>
                  <Link to={`/admin/empresas/${e.slug}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-hundido">
                    <span className="font-semibold">{e.nombre}</span>
                    <span className={`cifras text-sm ${suscripcionVencida(e) ? "font-semibold text-peligro" : "text-tenue"}`}>
                      {suscripcionVencida(e) ? "Venció" : "Vence"} el {formatearFecha(e.vence)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="semana">
          <h2 id="semana" className="text-lg font-bold">
            Últimos 7 días
          </h2>
          <dl className="cifras mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-2 rounded-tarjeta border border-linea bg-superficie p-4">
            <dt>Pedidos enviados</dt>
            <dd className="text-right font-bold">{pedidosSemana.length}</dd>
            <dt>Compradores distintos</dt>
            <dd className="text-right font-bold">{compradores}</dd>
            <dt>Empresas activas</dt>
            <dd className="text-right font-bold">{activas.length}</dd>
            <dt>Empresas registradas en total</dt>
            <dd className="text-right font-bold">{empresas.length}</dd>
          </dl>
          <p className="mt-2 text-sm text-tenue">Cifras de los datos de demostración del boceto.</p>
        </section>
      </div>
    </>
  );
}

function DatosEmpresa({ e }: { e: Empresa }) {
  return (
    <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
      <dt className="text-tenue">Razón social</dt>
      <dd>{e.razonSocial}</dd>
      <dt className="text-tenue">RIF</dt>
      <dd className="cifras">{e.rif}</dd>
      <dt className="text-tenue">Rubro</dt>
      <dd>{e.rubro}</dd>
      <dt className="text-tenue">Ciudad y dirección</dt>
      <dd>
        {e.ciudad}. {e.direccion}
      </dd>
      <dt className="text-tenue">WhatsApp</dt>
      <dd className="cifras">{e.whatsapp || "Sin número"}</dd>
      <dt className="text-tenue">Redes o web</dt>
      <dd className="break-all">{e.redes || "No indicó"}</dd>
      <dt className="text-tenue">Dueño</dt>
      <dd className="break-all">
        {e.equipo.find((m) => m.rol === "dueno")?.nombre}, {e.equipo.find((m) => m.rol === "dueno")?.correo}
      </dd>
      <dt className="text-tenue">Enlace</dt>
      <dd className="cifras">/c/{e.slug}</dd>
    </dl>
  );
}

const REVISION = [
  "El RIF tiene formato válido y la razón social coincide con el RIF.",
  "El WhatsApp responde y es de la empresa.",
  "Las redes o la web existen y corresponden a la empresa.",
  "El rubro no es ilegal ni de alto riesgo de estafa.",
];

export function AdminSolicitudes() {
  const admin = useAdmin();
  const solicitudes = useDatos(useShallow((s) => s.empresas.filter((e) => e.estado === "en-revision").sort((a, b) => a.creada.localeCompare(b.creada))));
  const { aprobarEmpresa, rechazarEmpresa } = useDatos(useShallow((s) => ({ aprobarEmpresa: s.aprobarEmpresa, rechazarEmpresa: s.rechazarEmpresa })));
  const [rechazar, setRechazar] = useState<Empresa | null>(null);
  const [hecho, setHecho] = useState<string | null>(null);

  return (
    <>
      <Encabezado titulo="Solicitudes">Empresas que se registraron y esperan aprobación. La más vieja va primero.</Encabezado>
      {hecho && (
        <p role="status" className="mb-4 text-sm font-semibold text-exito">
          {hecho}
        </p>
      )}
      {solicitudes.length === 0 ? (
        <EstadoVacio titulo="No hay solicitudes pendientes">Cuando una empresa se registre, aparece aquí para revisarla.</EstadoVacio>
      ) : (
        <>
          <details className="mb-5 rounded-tarjeta border border-linea bg-superficie p-4">
            <summary className="min-h-11 cursor-pointer content-center font-semibold">Lista de revisión</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {REVISION.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </details>
          <ul className="space-y-4">
            {solicitudes.map((e) => (
              <li key={e.slug} className="rounded-tarjeta border border-linea bg-superficie p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-bold">{e.nombre}</h2>
                  <span className="text-sm text-tenue">Se registró {hace(e.creada)}</span>
                </div>
                <div className="mt-3">
                  <DatosEmpresa e={e} />
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Boton
                    variante="accion"
                    onClick={() => {
                      aprobarEmpresa(e.slug, admin.correo);
                      setHecho(`Aprobaste ${e.nombre}. Empieza su mes gratis y ya puede publicar.`);
                    }}
                  >
                    Aprobar<span className="sr-only"> {e.nombre}</span>
                  </Boton>
                  <Boton variante="peligro" onClick={() => setRechazar(e)}>
                    Rechazar<span className="sr-only"> {e.nombre}</span>
                  </Boton>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      <DialogoMotivo
        abierto={rechazar != null}
        titulo={`Rechazar ${rechazar?.nombre ?? ""}`}
        explicacion="La empresa ve este motivo en su panel y en el correo. Di qué falta para que pueda corregirlo."
        boton="Rechazar solicitud"
        onCerrar={() => setRechazar(null)}
        onConfirmar={(motivo) => {
          rechazarEmpresa(rechazar!.slug, motivo, admin.correo);
          setHecho(`Rechazaste ${rechazar!.nombre}.`);
          setRechazar(null);
        }}
      />
    </>
  );
}

export function AdminEmpresas() {
  const empresas = useDatos((s) => s.empresas);
  const productos = useDatos((s) => s.productos);
  const pedidos = useDatos((s) => s.pedidos);
  const [params, setParams] = useSearchParams();
  const q = (params.get("q") ?? "").toLowerCase();
  const estado = params.get("estado") ?? "";
  const visibles = empresas
    .filter((e) => !estado || e.estado === estado)
    .filter((e) => !q || `${e.nombre} ${e.rif} ${e.ciudad}`.toLowerCase().includes(q))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const cambiar = (clave: string, valor: string) => {
    const p = new URLSearchParams(params);
    if (valor) p.set(clave, valor);
    else p.delete(clave);
    setParams(p, { replace: true });
  };

  return (
    <>
      <Encabezado titulo="Empresas" />
      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <label htmlFor="buscar-empresa" className="mb-1.5 block text-sm font-semibold">
            Buscar
          </label>
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tenue" aria-hidden />
            <input
              id="buscar-empresa"
              type="search"
              value={params.get("q") ?? ""}
              onChange={(e) => cambiar("q", e.target.value)}
              placeholder="Nombre, RIF o ciudad"
              className="block min-h-11 w-full rounded-control border border-control bg-superficie py-2 pl-10 pr-3 text-base"
            />
          </div>
        </div>
        <label className="block text-sm font-semibold">
          Estado
          <select value={estado} onChange={(e) => cambiar("estado", e.target.value)} className="mt-1.5 block min-h-11 w-full rounded-control border border-control bg-superficie px-2 text-base font-normal">
            <option value="">Todos</option>
            {Object.entries(NOMBRE_ESTADO_EMPRESA).map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>
      {visibles.length === 0 ? (
        <EstadoVacio titulo="Ninguna empresa coincide">Prueba con otra búsqueda o estado.</EstadoVacio>
      ) : (
        <Tabla<Empresa>
          titulo="Empresas"
          filas={visibles}
          clave={(e) => e.slug}
          columnas={[
            {
              titulo: "Empresa",
              principal: true,
              celda: (e) => (
                <Link to={`/admin/empresas/${e.slug}`} className="block hover:underline">
                  <span className="font-semibold text-accion">{e.nombre}</span>
                  <span className="cifras block text-sm font-normal text-tenue">
                    {e.rif}, {e.ciudad}
                  </span>
                </Link>
              ),
            },
            { titulo: "Estado", celda: (e) => <EstadoEmpresaInsignia e={e} /> },
            { titulo: "Plan", celda: (e) => planDe(e.plan).nombre },
            { titulo: "Vence", celda: (e) => formatearFecha(e.vence) },
            { titulo: "Productos", derecha: true, celda: (e) => productos.filter((p) => p.empresa === e.slug).length },
            { titulo: "Pedidos", derecha: true, celda: (e) => pedidos.filter((p) => p.empresa === e.slug).length },
          ]}
        />
      )}
    </>
  );
}

export function AdminEmpresa() {
  const admin = useAdmin();
  const { slug } = useParams();
  const empresa = useEmpresaPorSlug(slug);
  const { aprobarEmpresa, suspenderEmpresa, reactivarEmpresa, auditar } = useDatos(
    useShallow((s) => ({ aprobarEmpresa: s.aprobarEmpresa, suspenderEmpresa: s.suspenderEmpresa, reactivarEmpresa: s.reactivarEmpresa, auditar: s.auditar })),
  );
  const pagos = useDatos(useShallow((s) => s.pagos.filter((p) => p.empresa === slug)));
  const eventos = useDatos(useShallow((s) => s.auditoria.filter((a) => a.objetivo === slug)));
  const entrarPanel = useSesion((s) => s.entrarPanel);
  const navegar = useNavigate();
  const [suspender, setSuspender] = useState(false);
  if (!empresa) return <NoEncontrado />;

  const soporte = () => {
    auditar(admin.correo, "Entró en modo soporte", empresa.slug);
    entrarPanel({ empresa: empresa.slug, correo: admin.correo, nombre: "Soporte de Vitrina", rol: "lectura", desde: new Date().toISOString(), soporte: true });
    navegar("/panel");
  };

  return (
    <>
      <Link to="/admin/empresas" className="-ml-2 mb-2 inline-flex min-h-11 items-center gap-1 rounded-control px-2 text-sm font-semibold hover:bg-hundido">
        <ChevronLeft size={18} aria-hidden />
        Empresas
      </Link>
      <Encabezado
        titulo={empresa.nombre}
        acciones={
          empresa.estado === "activa" && empresa.publicado ? (
            <Link to={`/c/${empresa.slug}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-control border border-control bg-superficie px-4 font-semibold hover:bg-hundido">
              <ExternalLink size={16} aria-hidden />
              Ver catálogo
            </Link>
          ) : undefined
        }
      >
        <span className="flex flex-wrap items-center gap-2">
          <EstadoEmpresaInsignia e={empresa} />
          Plan {planDe(empresa.plan).nombre}, vence el {formatearFecha(empresa.vence)}
        </span>
      </Encabezado>

      {empresa.motivoEstado && (
        <div className="mb-5">
          <Aviso tipo="error" titulo={`Motivo: ${NOMBRE_ESTADO_EMPRESA[empresa.estado].toLowerCase()}`}>
            {empresa.motivoEstado}
          </Aviso>
        </div>
      )}

      <section aria-label="Acciones" className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {(empresa.estado === "en-revision" || empresa.estado === "rechazada") && (
          <Boton variante="accion" onClick={() => aprobarEmpresa(empresa.slug, admin.correo)}>
            Aprobar
          </Boton>
        )}
        {empresa.estado === "activa" && (
          <Boton variante="peligro" onClick={() => setSuspender(true)}>
            Suspender
          </Boton>
        )}
        {empresa.estado === "suspendida" && (
          <Boton variante="accion" onClick={() => reactivarEmpresa(empresa.slug, admin.correo)}>
            Reactivar
          </Boton>
        )}
        <Boton onClick={soporte}>Ver su panel en modo soporte</Boton>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-2">
        <section aria-labelledby="datos">
          <h2 id="datos" className="text-lg font-bold">
            Datos
          </h2>
          <div className="mt-2 rounded-tarjeta border border-linea bg-superficie p-4">
            <DatosEmpresa e={empresa} />
          </div>
        </section>
        <section aria-labelledby="pagos-emp">
          <h2 id="pagos-emp" className="text-lg font-bold">
            Pagos
          </h2>
          {pagos.length === 0 ? (
            <p className="mt-2 text-tenue">Sin pagos reportados.</p>
          ) : (
            <ul className="mt-2 divide-y divide-linea rounded-tarjeta border border-linea bg-superficie text-sm">
              {pagos.map((p) => (
                <li key={p.id} className="flex justify-between gap-3 px-4 py-3">
                  <span>
                    {formatearFecha(p.fecha)}, ref. {p.referencia}
                  </span>
                  <span className="font-semibold">{ESTADO_PAGO[p.estado]}</span>
                </li>
              ))}
            </ul>
          )}
          <h2 className="mt-6 text-lg font-bold">Historial con Vitrina</h2>
          {eventos.length === 0 ? (
            <p className="mt-2 text-tenue">Sin decisiones registradas.</p>
          ) : (
            <ul className="mt-2 space-y-2 border-l border-control pl-4 text-sm">
              {eventos.map((a) => (
                <li key={a.id}>
                  <span className="font-semibold">{a.accion}</span>
                  {a.detalle && <span>: {a.detalle}</span>}
                  <span className="cifras block text-tenue">
                    {formatearFecha(a.fecha, true)}, {a.actor}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <DialogoMotivo
        abierto={suspender}
        titulo={`Suspender ${empresa.nombre}`}
        explicacion="El catálogo deja de verse y el panel queda en solo lectura hasta que lo reactives. La empresa ve el motivo."
        boton="Suspender empresa"
        onCerrar={() => setSuspender(false)}
        onConfirmar={(motivo) => {
          suspenderEmpresa(empresa.slug, motivo, admin.correo);
          setSuspender(false);
        }}
      />
    </>
  );
}

const ESTADO_PAGO: Record<Pago["estado"], string> = { "en-revision": "En revisión", validado: "Validado", rechazado: "Rechazado" };
const METODO: Record<Pago["metodo"], string> = { "pago-movil": "Pago móvil", transferencia: "Transferencia", zelle: "Zelle", usdt: "USDT" };

export function AdminPagos() {
  const admin = useAdmin();
  const pagos = useDatos((s) => s.pagos);
  const empresas = useDatos((s) => s.empresas);
  const { validarPago, rechazarPago } = useDatos(useShallow((s) => ({ validarPago: s.validarPago, rechazarPago: s.rechazarPago })));
  const [rechazar, setRechazar] = useState<Pago | null>(null);
  const [hecho, setHecho] = useState<string | null>(null);
  const porValidar = pagos.filter((p) => p.estado === "en-revision").sort((a, b) => a.fecha.localeCompare(b.fecha));
  const resueltos = pagos.filter((p) => p.estado !== "en-revision").sort((a, b) => b.fecha.localeCompare(a.fecha));
  const nombre = (slug: string) => empresas.find((e) => e.slug === slug)?.nombre ?? slug;

  return (
    <>
      <Encabezado titulo="Pagos">
        Antes de validar, busca la referencia en el banco o en la billetera. Validar extiende 30 días la suscripción y activa el plan pagado.
      </Encabezado>
      {hecho && (
        <p role="status" className="mb-4 text-sm font-semibold text-exito">
          {hecho}
        </p>
      )}
      <h2 className="text-lg font-bold">Por validar</h2>
      {porValidar.length === 0 ? (
        <p className="mt-2 text-tenue">No hay pagos esperando.</p>
      ) : (
        <ul className="mt-2 space-y-3">
          {porValidar.map((p) => (
            <li key={p.id} className="rounded-tarjeta border border-linea bg-superficie p-4">
              <p className="font-bold">{nombre(p.empresa)}</p>
              <dl className="cifras mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
                <dt className="text-tenue">Plan</dt>
                <dd>{planDe(p.plan).nombre}</dd>
                <dt className="text-tenue">Método y referencia</dt>
                <dd>
                  {METODO[p.metodo]}, {p.referencia}
                </dd>
                <dt className="text-tenue">Monto</dt>
                <dd>{p.montoCent > 0 ? formatear(p.montoCent, p.moneda) : "Sin monto (pago de demostración)"}</dd>
                <dt className="text-tenue">Reportado</dt>
                <dd>{formatearFecha(p.fecha, true)}</dd>
                <dt className="text-tenue">Comprobante</dt>
                <dd className="break-all">{p.comprobante} (en el boceto no se sube el archivo)</dd>
              </dl>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Boton
                  variante="accion"
                  onClick={() => {
                    validarPago(p.id, admin.correo);
                    setHecho(`Validaste el pago de ${nombre(p.empresa)}.`);
                  }}
                >
                  Validar pago<span className="sr-only"> de {nombre(p.empresa)}</span>
                </Boton>
                <Boton variante="peligro" onClick={() => setRechazar(p)}>
                  Rechazar<span className="sr-only"> pago de {nombre(p.empresa)}</span>
                </Boton>
              </div>
            </li>
          ))}
        </ul>
      )}
      <h2 className="mt-8 text-lg font-bold">Resueltos</h2>
      {resueltos.length === 0 ? (
        <p className="mt-2 text-tenue">Todavía no hay pagos resueltos.</p>
      ) : (
        <ul className="mt-2 divide-y divide-linea rounded-tarjeta border border-linea bg-superficie text-sm">
          {resueltos.map((p) => (
            <li key={p.id} className="flex flex-wrap justify-between gap-2 px-4 py-3">
              <span>
                <span className="font-semibold">{nombre(p.empresa)}</span>, {METODO[p.metodo]} ref. {p.referencia}
                {p.motivo && <span className="block text-tenue">Motivo: {p.motivo}</span>}
              </span>
              <span className={`font-semibold ${p.estado === "validado" ? "text-exito" : "text-peligro"}`}>{ESTADO_PAGO[p.estado]}</span>
            </li>
          ))}
        </ul>
      )}
      <DialogoMotivo
        abierto={rechazar != null}
        titulo="Rechazar el pago"
        explicacion="La empresa ve el motivo junto al pago. Por ejemplo: la referencia no aparece o el monto no coincide."
        boton="Rechazar pago"
        onCerrar={() => setRechazar(null)}
        onConfirmar={(motivo) => {
          rechazarPago(rechazar!.id, motivo, admin.correo);
          setHecho("Pago rechazado.");
          setRechazar(null);
        }}
      />
    </>
  );
}
