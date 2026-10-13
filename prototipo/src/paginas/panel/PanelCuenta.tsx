import { Check, Copy } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useShallow } from "zustand/react/shallow";
import { NOMBRE_ROL, PERMISOS_ROL, PLANES, planDe } from "../../datos/planes";
import type { Pago, Rol } from "../../datos/tipos";
import { useDatos, useProductosDe } from "../../estado/datos";
import { useTasas } from "../../estado/tasas";
import { aBs, formatear, formatearFecha } from "../../lib/dinero";
import { Boton } from "../../ui/Boton";
import { Campo } from "../../ui/Campo";
import { Dialogo } from "../../ui/Dialogo";
import { Aviso } from "../../ui/piezas";
import { Selector } from "../../ui/Selector";
import { aCentimos, Encabezado } from "./comun";
import { usePanel } from "./PanelLayout";

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ROLES_INVITABLES: Rol[] = ["administrador", "vendedor", "almacen", "lectura"];

export function PanelEquipo() {
  const { empresa, sesion } = usePanel();
  const { invitar, cambiarRol, quitarMiembro } = useDatos(useShallow((s) => ({ invitar: s.invitar, cambiarRol: s.cambiarRol, quitarMiembro: s.quitarMiembro })));
  const [correo, setCorreo] = useState("");
  const [rol, setRol] = useState<Rol>("vendedor");
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<string | null>(null);
  const [quitar, setQuitar] = useState<string | null>(null);
  const plan = planDe(empresa.plan);
  const puedeGestionar = sesion.rol === "dueno" || sesion.rol === "administrador";

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    setHecho(null);
    if (!CORREO.test(correo.trim())) {
      setError("Escribe un correo válido.");
      document.getElementById("inv-correo")?.focus();
      return;
    }
    const err = invitar(empresa.slug, correo.trim().toLowerCase(), rol);
    setError(err);
    if (!err) {
      setHecho(`Invitación enviada a ${correo.trim()}. Al aceptarla debe activar la verificación en dos pasos.`);
      setCorreo("");
    }
  };

  return (
    <>
      <Encabezado titulo="Equipo">
        <span className="cifras">
          {empresa.equipo.length} de {plan.usuarios} {plan.usuarios === 1 ? "usuario" : "usuarios"} del plan {plan.nombre}.
        </span>{" "}
        Cada persona entra con su propia cuenta y doble factor.
      </Encabezado>

      <ul className="max-w-3xl divide-y divide-linea rounded-tarjeta border border-linea bg-superficie">
        {empresa.equipo.map((m) => (
          <li key={m.correo} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{m.nombre || "Invitación pendiente"}</span>
              <span className="block break-all text-sm text-tenue">{m.correo}</span>
            </span>
            {m.rol === "dueno" || !puedeGestionar ? (
              <span className="text-sm font-semibold">
                {NOMBRE_ROL[m.rol]}
                {m.estado === "invitado" && <span className="font-normal text-alerta">, invitado</span>}
              </span>
            ) : (
              <>
                {m.estado === "invitado" && <span className="text-sm font-semibold text-alerta">Invitado</span>}
                <label className="sr-only" htmlFor={`rol-${m.correo}`}>
                  Rol de {m.correo}
                </label>
                <select
                  id={`rol-${m.correo}`}
                  value={m.rol}
                  onChange={(e) => {
                    cambiarRol(empresa.slug, m.correo, e.target.value as Rol);
                    setHecho(`Rol de ${m.correo} cambiado a ${NOMBRE_ROL[e.target.value as Rol]}.`);
                  }}
                  className="min-h-11 rounded-control border border-control bg-superficie px-2 text-sm"
                >
                  {ROLES_INVITABLES.map((r) => (
                    <option key={r} value={r}>
                      {NOMBRE_ROL[r]}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => setQuitar(m.correo)} className="min-h-11 px-2 text-sm font-semibold text-peligro underline underline-offset-2">
                  Quitar<span className="sr-only"> a {m.correo}</span>
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {hecho && (
        <p role="status" className="mt-3 text-sm font-semibold text-exito">
          {hecho}
        </p>
      )}

      {puedeGestionar && (
        <form onSubmit={enviar} noValidate className="mt-8 max-w-3xl space-y-4 rounded-tarjeta border border-linea bg-superficie p-4">
          <h2 className="text-lg font-bold">Invitar a alguien</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="inv-correo" etiqueta="Correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
            <Selector
              id="inv-rol"
              etiqueta="Rol"
              value={rol}
              onChange={(e) => setRol(e.target.value as Rol)}
              ayuda={PERMISOS_ROL[rol]}
              opciones={ROLES_INVITABLES.map((r) => ({ valor: r, texto: NOMBRE_ROL[r] }))}
            />
          </div>
          {error && <Aviso tipo="error">{error}</Aviso>}
          <Boton type="submit" variante="accion">
            Enviar invitación
          </Boton>
          <p className="text-sm text-tenue">En el boceto no se envía ningún correo.</p>
        </form>
      )}

      <Dialogo abierto={quitar != null} titulo="¿Quitar a esta persona del equipo?" onCerrar={() => setQuitar(null)}>
        <p className="text-tenue">{quitar} pierde el acceso al panel en ese momento. Lo que hizo queda en el registro de actividad.</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Boton onClick={() => setQuitar(null)}>Volver</Boton>
          <Boton
            variante="peligro"
            onClick={() => {
              quitarMiembro(empresa.slug, quitar!);
              setHecho(`Quitaste a ${quitar} del equipo.`);
              setQuitar(null);
            }}
          >
            Sí, quitar
          </Boton>
        </div>
      </Dialogo>
    </>
  );
}

const METODOS: { valor: Pago["metodo"]; texto: string; moneda: Pago["moneda"] }[] = [
  { valor: "pago-movil", texto: "Pago móvil", moneda: "VES" },
  { valor: "transferencia", texto: "Transferencia en bolívares", moneda: "VES" },
  { valor: "zelle", texto: "Zelle", moneda: "USD" },
  { valor: "usdt", texto: "USDT", moneda: "USDT" },
];

const ESTADO_PAGO: Record<Pago["estado"], string> = { "en-revision": "En revisión", validado: "Validado", rechazado: "Rechazado" };

export function PanelSuscripcion() {
  const { empresa } = usePanel();
  const productos = useProductosDe(empresa.slug);
  const pagos = useDatos(useShallow((s) => s.pagos.filter((p) => p.empresa === empresa.slug)));
  const reportarPago = useDatos((s) => s.reportarPago);
  const tasas = useTasas((s) => s.tasas);
  const plan = planDe(empresa.plan);
  const dias = Math.ceil((new Date(empresa.vence).getTime() - Date.now()) / 86_400_000);

  const [metodo, setMetodo] = useState<Pago["metodo"]>("pago-movil");
  const [referencia, setReferencia] = useState("");
  const [monto, setMonto] = useState("");
  const [comprobante, setComprobante] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [hecho, setHecho] = useState(false);
  const moneda = METODOS.find((m) => m.valor === metodo)!.moneda;
  const montoBs = tasas ? aBs(plan.precioUsdCent, "USD", tasas) : null;

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (referencia.trim().length < 4) err["pago-ref"] = "Escribe la referencia o el número de operación.";
    const cent = aCentimos(monto);
    if (cent == null || cent <= 0) err["pago-monto"] = "Escribe el monto pagado.";
    if (!comprobante) err["pago-comprobante"] = "Adjunta la captura o el PDF del comprobante.";
    setErrores(err);
    setHecho(false);
    const primero = Object.keys(err)[0];
    if (primero) return document.getElementById(primero)?.focus();
    reportarPago({ empresa: empresa.slug, metodo, referencia: referencia.trim(), montoCent: cent!, moneda });
    setReferencia("");
    setMonto("");
    setComprobante(null);
    setHecho(true);
  };

  return (
    <>
      <Encabezado titulo="Suscripción" />

      <section aria-labelledby="titulo-plan" className="max-w-3xl rounded-tarjeta border border-linea bg-superficie p-4">
        <h2 id="titulo-plan" className="text-lg font-bold">
          Plan {plan.nombre}
        </h2>
        <p className="mt-1">
          {dias > 0 ? `Vence el ${formatearFecha(empresa.vence)}, en ${dias} ${dias === 1 ? "día" : "días"}.` : `Venció el ${formatearFecha(empresa.vence)}. El catálogo queda en solo lectura hasta validar el pago.`}
        </p>
        <dl className="cifras mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="text-tenue">Usuarios</dt>
          <dd>
            {empresa.equipo.length} de {plan.usuarios}
          </dd>
          <dt className="text-tenue">Productos</dt>
          <dd>
            {productos.length.toLocaleString("es-VE")} {plan.productos ? `de ${plan.productos.toLocaleString("es-VE")}` : "sin límite"}
          </dd>
          <dt className="text-tenue">Precio</dt>
          <dd>
            USD {plan.precioUsdCent / 100} al mes{montoBs != null && `, hoy ${formatear(montoBs, "VES")}`}
          </dd>
        </dl>
        <p className="mt-3 text-sm text-tenue">Los precios de los planes son una propuesta del plan maestro: se fijan después de hablar con empresas reales.</p>
      </section>

      <section aria-labelledby="titulo-planes" className="mt-8 max-w-3xl">
        <h2 id="titulo-planes" className="text-lg font-bold">
          Planes
        </h2>
        {/* Se desplaza de lado en el celular: enfocable para recorrerla con el teclado */}
        <div tabIndex={0} role="region" aria-label="Comparación de planes, desplazable" className="mt-2 overflow-x-auto rounded-tarjeta border border-linea bg-superficie">
          <table className="w-full min-w-[34rem] text-sm">
            <caption className="sr-only">Comparación de planes</caption>
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
                <th scope="col" className="px-4 py-3 font-semibold">
                  Incluye
                </th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  Al mes
                </th>
              </tr>
            </thead>
            <tbody className="cifras">
              {PLANES.map((p) => (
                <tr key={p.id} className="border-b border-linea last:border-0">
                  <th scope="row" className="px-4 py-3 text-left font-semibold">
                    {p.nombre}
                    {p.id === plan.id && <span className="block text-xs font-semibold text-accion">Tu plan</span>}
                  </th>
                  <td className="px-4 py-3 text-right">{p.usuarios}</td>
                  <td className="px-4 py-3 text-right">{p.productos?.toLocaleString("es-VE") ?? "Sin límite"}</td>
                  <td className="px-4 py-3">{p.incluye}</td>
                  <td className="px-4 py-3 text-right">USD {p.precioUsdCent / 100}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-sm text-tenue">Para cambiar de plan, reporta el pago del plan nuevo y lo activamos al validarlo. Usuario extra: USD 3 al mes en Negocio y Mayorista.</p>
      </section>

      <form onSubmit={enviar} noValidate className="mt-8 max-w-3xl space-y-4 rounded-tarjeta border border-linea bg-superficie p-4">
        <h2 className="text-lg font-bold">Reportar un pago</h2>
        <p className="text-sm text-tenue">Vitrina valida el pago a mano y extiende tu suscripción. Recibes un correo cuando se valide.</p>
        <Selector id="pago-metodo" etiqueta="Método" value={metodo} onChange={(e) => setMetodo(e.target.value as Pago["metodo"])} opciones={METODOS.map((m) => ({ valor: m.valor, texto: m.texto }))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="pago-ref" etiqueta="Referencia" value={referencia} onChange={(e) => setReferencia(e.target.value)} error={errores["pago-ref"]} />
          <Campo
            id="pago-monto"
            etiqueta={`Monto (${moneda === "VES" ? "Bs" : moneda})`}
            inputMode="decimal"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            error={errores["pago-monto"]}
            ayuda={moneda === "VES" && montoBs != null ? `El plan ${plan.nombre} hoy: ${formatear(montoBs, "VES")}` : `El plan ${plan.nombre}: USD ${plan.precioUsdCent / 100}`}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="pago-comprobante" className="block text-sm font-semibold">
            Comprobante
          </label>
          <input
            id="pago-comprobante"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setComprobante(e.target.files?.[0]?.name ?? null)}
            aria-describedby={errores["pago-comprobante"] ? "pago-comprobante-error" : "pago-comprobante-ayuda"}
            className="block w-full text-sm file:mr-3 file:min-h-11 file:rounded-control file:border file:border-control file:bg-superficie file:px-4 file:font-semibold"
          />
          {errores["pago-comprobante"] ? (
            <p id="pago-comprobante-error" className="text-sm font-medium text-peligro">
              {errores["pago-comprobante"]}
            </p>
          ) : (
            <p id="pago-comprobante-ayuda" className="text-sm text-tenue">
              Captura o PDF. En el boceto el archivo no sale de tu teléfono.
            </p>
          )}
        </div>
        <Boton type="submit" variante="accion">
          Reportar pago
        </Boton>
        {hecho && (
          <p role="status" className="text-sm font-semibold text-exito">
            Pago reportado. Queda en revisión.
          </p>
        )}
      </form>

      <section aria-labelledby="titulo-pagos" className="mt-8 max-w-3xl">
        <h2 id="titulo-pagos" className="text-lg font-bold">
          Pagos reportados
        </h2>
        {pagos.length === 0 ? (
          <p className="mt-2 text-tenue">Todavía no has reportado pagos.</p>
        ) : (
          <ul className="mt-2 divide-y divide-linea rounded-tarjeta border border-linea bg-superficie">
            {pagos.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span>
                  <span className="block font-semibold">
                    {METODOS.find((m) => m.valor === p.metodo)?.texto}, ref. {p.referencia}
                  </span>
                  <span className="cifras block text-tenue">
                    {formatearFecha(p.fecha, true)}, {formatear(p.montoCent, p.moneda)}
                  </span>
                </span>
                <span className={`font-semibold ${p.estado === "validado" ? "text-exito" : p.estado === "rechazado" ? "text-peligro" : "text-alerta"}`}>{ESTADO_PAGO[p.estado]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function codigosRecuperacion(): string[] {
  const letras = "abcdefghjkmnpqrstuvwxyz23456789";
  const parte = () => Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => letras[b % letras.length]).join("");
  return Array.from({ length: 10 }, () => `${parte()}-${parte()}`);
}

export function PanelSeguridad() {
  const { empresa, sesion } = usePanel();
  const movimientos = useDatos(useShallow((s) => s.movimientos.filter((m) => m.empresa === empresa.slug && m.usuario !== "Sistema").slice(0, 8)));
  const pedidos = useDatos(useShallow((s) => s.pedidos.filter((p) => p.empresa === empresa.slug)));
  const [codigos, setCodigos] = useState<string[] | null>(null);
  const [copiados, setCopiados] = useState(false);
  const [cerradas, setCerradas] = useState(false);
  const [clave, setClave] = useState({ actual: "", nueva: "", repetir: "" });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [claveHecha, setClaveHecha] = useState(false);

  const cambiarClave = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!clave.actual) err["clave-actual"] = "Escribe tu contraseña actual.";
    if (clave.nueva.length < 12) err["clave-nueva"] = "La contraseña nueva debe tener al menos 12 caracteres.";
    else if (clave.nueva === clave.actual) err["clave-nueva"] = "La contraseña nueva debe ser distinta de la actual.";
    if (clave.repetir !== clave.nueva) err["clave-repetir"] = "Las dos contraseñas nuevas no coinciden.";
    setErrores(err);
    setClaveHecha(false);
    const primero = Object.keys(err)[0];
    if (primero) return document.getElementById(primero)?.focus();
    setClave({ actual: "", nueva: "", repetir: "" });
    setClaveHecha(true);
  };

  const actividad = [
    ...pedidos.flatMap((p) => p.historial.slice(1).map((h) => ({ fecha: h.fecha, texto: `Pedido #${String(p.numero).padStart(4, "0")}: ${h.estado === "cancelado" ? "cancelado" : `pasó a ${h.estado}`}` }))),
    ...movimientos.map((m) => ({ fecha: m.fecha, texto: `${m.usuario}: ${m.motivo.toLowerCase()}` })),
  ]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 10);

  return (
    <>
      <Encabezado titulo="Seguridad">Tu cuenta: {sesion.correo}.</Encabezado>
      <div className="max-w-3xl space-y-8">
        <section aria-labelledby="titulo-2fa" className="rounded-tarjeta border border-linea bg-superficie p-4">
          <h2 id="titulo-2fa" className="text-lg font-bold">
            Verificación en dos pasos
          </h2>
          <p className="mt-1">
            <span className="font-semibold text-exito">Activa</span> con aplicación autenticadora. Es obligatoria en las cuentas de empresa.
          </p>
          <p className="mt-1 text-sm text-tenue">Si pierdes el teléfono entras con un código de recuperación. Generar códigos nuevos anula los anteriores.</p>
          <Boton
            className="mt-3"
            onClick={() => {
              setCopiados(false);
              setCodigos(codigosRecuperacion());
            }}
          >
            Generar códigos de recuperación nuevos
          </Boton>
        </section>

        <section aria-labelledby="titulo-sesiones" className="rounded-tarjeta border border-linea bg-superficie p-4">
          <h2 id="titulo-sesiones" className="text-lg font-bold">
            Sesiones abiertas
          </h2>
          <ul className="mt-2 text-sm">
            <li>
              <span className="font-semibold">Este navegador</span>, desde {formatearFecha(sesion.desde, true)}
            </li>
          </ul>
          <Boton className="mt-3" onClick={() => setCerradas(true)}>
            Cerrar las demás sesiones
          </Boton>
          {cerradas && (
            <p role="status" className="mt-2 text-sm font-semibold text-exito">
              No había otras sesiones abiertas. Solo queda esta.
            </p>
          )}
        </section>

        <form onSubmit={cambiarClave} noValidate className="space-y-4 rounded-tarjeta border border-linea bg-superficie p-4">
          <h2 className="text-lg font-bold">Cambiar contraseña</h2>
          <Campo id="clave-actual" etiqueta="Contraseña actual" type="password" autoComplete="current-password" value={clave.actual} onChange={(e) => setClave({ ...clave, actual: e.target.value })} error={errores["clave-actual"]} />
          <Campo
            id="clave-nueva"
            etiqueta="Contraseña nueva"
            type="password"
            autoComplete="new-password"
            value={clave.nueva}
            onChange={(e) => setClave({ ...clave, nueva: e.target.value })}
            error={errores["clave-nueva"]}
            ayuda="Al menos 12 caracteres. En la versión final se compara contra contraseñas filtradas."
          />
          <Campo id="clave-repetir" etiqueta="Repite la contraseña nueva" type="password" autoComplete="new-password" value={clave.repetir} onChange={(e) => setClave({ ...clave, repetir: e.target.value })} error={errores["clave-repetir"]} />
          <Boton type="submit" variante="accion">
            Cambiar contraseña
          </Boton>
          {claveHecha && (
            <p role="status" className="text-sm font-semibold text-exito">
              Contraseña cambiada. Las demás sesiones se cierran solas.
            </p>
          )}
        </form>

        <section aria-labelledby="titulo-actividad">
          <h2 id="titulo-actividad" className="text-lg font-bold">
            Actividad reciente de la empresa
          </h2>
          {actividad.length === 0 ? (
            <p className="mt-2 text-tenue">Sin actividad todavía.</p>
          ) : (
            <ul className="mt-2 divide-y divide-linea rounded-tarjeta border border-linea bg-superficie text-sm">
              {actividad.map((a, i) => (
                <li key={i} className="flex flex-wrap justify-between gap-2 px-4 py-2.5">
                  <span>{a.texto}</span>
                  <span className="cifras text-tenue">{formatearFecha(a.fecha, true)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Dialogo abierto={codigos != null} titulo="Tus códigos de recuperación" onCerrar={() => setCodigos(null)}>
        <p className="text-tenue">Guárdalos fuera del teléfono. Cada uno sirve una sola vez. No los volverás a ver.</p>
        <ul className="cifras mt-4 grid grid-cols-2 gap-2 font-mono text-base">
          {codigos?.map((c) => (
            <li key={c} className="rounded-control bg-hundido px-3 py-2 text-center">
              {c}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Boton
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(codigos!.join("\n"));
                setCopiados(true);
              } catch {
                setCopiados(false);
              }
            }}
          >
            {copiados ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
            <span aria-live="polite">{copiados ? "Copiados" : "Copiar códigos"}</span>
          </Boton>
          <Boton variante="accion" onClick={() => setCodigos(null)}>
            Ya los guardé
          </Boton>
        </div>
      </Dialogo>
    </>
  );
}
