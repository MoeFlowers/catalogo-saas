import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import type { Empresa, MetodoEntrega, TipoEntrega } from "../../datos/tipos";
import { useDatos } from "../../estado/datos";
import { contraste, marcaSegura } from "../../lib/color";
import { NOMBRE_ENTREGA } from "../../lib/pedido";
import { Boton } from "../../ui/Boton";
import { Area, Campo } from "../../ui/Campo";
import { Aviso } from "../../ui/piezas";
import { Casilla } from "../../ui/Selector";
import { aCentimos, deCentimos, Encabezado, enteroPositivo } from "./comun";
import { SinPermiso, usePanel } from "./PanelLayout";

const TIPOS: { tipo: TipoEntrega; ayuda: string; pideDireccion: boolean }[] = [
  { tipo: "retiro", ayuda: "Dirección y horario donde se retira.", pideDireccion: false },
  { tipo: "delivery", ayuda: "Zonas y costo, o si se coordina por WhatsApp.", pideDireccion: true },
  { tipo: "encomienda", ayuda: "Agencias con las que trabajas y cómo se cobra el envío.", pideDireccion: true },
  { tipo: "coordinar", ayuda: "Cualquier otra forma que acuerdes con el cliente.", pideDireccion: false },
];

function Errores({ errores }: { errores: { id: string; texto: string }[] }) {
  if (!errores.length) return null;
  return (
    <div id="errores-ajustes" tabIndex={-1} role="alert" className="rounded-control border border-peligro/40 bg-[#fef2f2] p-4 outline-none">
      <p className="font-semibold">Revisa antes de guardar:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
        {errores.map((e) => (
          <li key={e.id}>
            <button type="button" onClick={() => document.getElementById(e.id)?.focus()} className="inline text-left font-medium text-peligro underline underline-offset-2">
              {e.texto}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PanelEntrega() {
  const { empresa, puede } = usePanel();
  const actualizar = useDatos((s) => s.actualizarEmpresa);
  const [metodos, setMetodos] = useState(() =>
    TIPOS.map((t) => {
      const m = empresa.entregas.find((e) => e.tipo === t.tipo);
      return { ...t, activo: Boolean(m), detalle: m?.detalle ?? "" };
    }),
  );
  const [errores, setErrores] = useState<{ id: string; texto: string }[]>([]);
  const [hecho, setHecho] = useState(false);

  const guardar = (e: FormEvent) => {
    e.preventDefault();
    const lista: { id: string; texto: string }[] = [];
    if (!metodos.some((m) => m.activo)) lista.push({ id: "entrega-retiro", texto: "Activa al menos un método de entrega." });
    metodos.forEach((m) => {
      if (m.activo && m.detalle.trim().length < 5) lista.push({ id: `detalle-${m.tipo}`, texto: `${NOMBRE_ENTREGA[m.tipo]}: explica cómo funciona.` });
    });
    setErrores(lista);
    setHecho(false);
    if (lista.length) return requestAnimationFrame(() => document.getElementById("errores-ajustes")?.focus());
    const entregas: MetodoEntrega[] = metodos.filter((m) => m.activo).map((m) => ({ tipo: m.tipo, detalle: m.detalle.trim(), pideDireccion: m.pideDireccion }));
    actualizar(empresa.slug, { entregas });
    setHecho(true);
  };

  return (
    <>
      <Encabezado titulo="Entrega">El cliente elige uno de estos métodos al hacer el pedido. Los costos que se coordinan no se suman al total.</Encabezado>
      <form onSubmit={guardar} noValidate className="max-w-2xl space-y-4">
        <Errores errores={errores} />
        {metodos.map((m, i) => (
          <div key={m.tipo} className="space-y-3 rounded-tarjeta border border-linea bg-superficie p-4">
            <Casilla
              id={`entrega-${m.tipo}`}
              etiqueta={NOMBRE_ENTREGA[m.tipo]}
              descripcion={m.pideDireccion ? "Le pide al cliente la dirección o la ciudad de destino." : undefined}
              checked={m.activo}
              onChange={(e) => setMetodos(metodos.map((x, j) => (j === i ? { ...x, activo: e.target.checked } : x)))}
            />
            {m.activo && (
              <Area
                id={`detalle-${m.tipo}`}
                etiqueta="Lo que ve el cliente"
                value={m.detalle}
                rows={2}
                ayuda={m.ayuda}
                onChange={(e) => setMetodos(metodos.map((x, j) => (j === i ? { ...x, detalle: e.target.value } : x)))}
              />
            )}
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          {puede("ajustes") ? (
            <Boton type="submit" variante="accion">
              Guardar entrega
            </Boton>
          ) : (
            <SinPermiso que="cambiar la entrega" />
          )}
          {hecho && (
            <p role="status" className="text-sm font-semibold text-exito">
              Guardado. Ya se ve en tu catálogo.
            </p>
          )}
        </div>
      </form>
    </>
  );
}

const HEX = /^#[0-9a-f]{6}$/i;
/** Venezuela: +58 y 10 dígitos (4XX XXX XXXX); otros países, entre 8 y 15 dígitos */
const WHATSAPP = /^\+\d{8,15}$/;

export function PanelCatalogo() {
  const { empresa, puede } = usePanel();
  const actualizar = useDatos((s) => s.actualizarEmpresa);
  const [f, setF] = useState({
    nombre: empresa.nombre,
    descripcion: empresa.descripcion,
    ciudad: empresa.ciudad,
    horario: empresa.horario,
    whatsapp: empresa.whatsapp,
    color: empresa.color,
    minimo: deCentimos(empresa.pedidoMinimoCent),
    mostrarStock: empresa.mostrarStock,
    dias: String(empresa.diasCancelacion),
  });
  const [errores, setErrores] = useState<{ id: string; texto: string }[]>([]);
  const [hecho, setHecho] = useState(false);
  const poner = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  const colorValido = HEX.test(f.color);
  const segura = marcaSegura(colorValido ? f.color : "#2563eb");
  const whatsapp = f.whatsapp.replace(/[\s-]/g, "");

  const guardar = (e: FormEvent) => {
    e.preventDefault();
    const lista: { id: string; texto: string }[] = [];
    if (f.nombre.trim().length < 3) lista.push({ id: "cat-nombre", texto: "Escribe el nombre comercial." });
    if (whatsapp && !WHATSAPP.test(whatsapp)) lista.push({ id: "cat-whatsapp", texto: "Escribe el WhatsApp con el código de país, por ejemplo +58 414 1234567." });
    if (!colorValido) lista.push({ id: "cat-color-hex", texto: "El color va en formato #RRGGBB, por ejemplo #9A3412." });
    const minimo = aCentimos(f.minimo);
    if (minimo == null) lista.push({ id: "cat-minimo", texto: "Escribe el pedido mínimo; 0 si no tienes." });
    if (!enteroPositivo(f.dias)) lista.push({ id: "cat-dias", texto: "Escribe los días como número entero." });
    setErrores(lista);
    setHecho(false);
    if (lista.length) return requestAnimationFrame(() => document.getElementById("errores-ajustes")?.focus());
    const cambios: Partial<Empresa> = {
      nombre: f.nombre.trim(),
      descripcion: f.descripcion.trim(),
      ciudad: f.ciudad.trim(),
      horario: f.horario.trim(),
      whatsapp,
      color: segura.marca,
      pedidoMinimoCent: minimo!,
      mostrarStock: f.mostrarStock,
      diasCancelacion: Number(f.dias),
    };
    actualizar(empresa.slug, cambios);
    setF((x) => ({ ...x, color: segura.marca, whatsapp }));
    setHecho(true);
  };

  return (
    <>
      <Encabezado
        titulo="Catálogo"
        acciones={
          <Link to={`/c/${empresa.slug}`} className="inline-flex min-h-11 items-center rounded-control border border-control bg-superficie px-4 font-semibold hover:bg-hundido">
            Ver catálogo
          </Link>
        }
      >
        Lo que ven tus clientes en {`/c/${empresa.slug}`}.
      </Encabezado>

      <section aria-labelledby="titulo-publicacion" className="mb-6 max-w-2xl rounded-tarjeta border border-linea bg-superficie p-4">
        <h2 id="titulo-publicacion" className="font-bold">
          {empresa.publicado ? "Catálogo publicado" : "Catálogo pausado"}
        </h2>
        <p className="mt-1 text-sm text-tenue">
          {empresa.publicado ? "Cualquiera con el enlace puede verlo y pedir." : "Quien abra el enlace ve un aviso de que el catálogo no está disponible. Tus datos no se borran."}
        </p>
        {empresa.estado !== "activa" ? (
          <p className="mt-3 text-sm font-semibold">
            {empresa.estado === "en-revision" ? "Podrás publicarlo cuando Vitrina apruebe tu empresa." : "No se puede publicar mientras la empresa no esté activa."}
          </p>
        ) : puede("ajustes") ? (
          <Boton className="mt-3" variante={empresa.publicado ? "peligro" : "accion"} onClick={() => actualizar(empresa.slug, { publicado: !empresa.publicado })}>
            {empresa.publicado ? "Pausar catálogo" : "Publicar catálogo"}
          </Boton>
        ) : (
          <div className="mt-3">
            <SinPermiso que="publicar ni pausar el catálogo" />
          </div>
        )}
      </section>

      <form onSubmit={guardar} noValidate className="max-w-2xl space-y-6">
        <Errores errores={errores} />
        <fieldset className="space-y-4">
          <legend className="text-lg font-bold">Datos que ve el cliente</legend>
          <Campo id="cat-nombre" etiqueta="Nombre comercial" value={f.nombre} onChange={(e) => poner("nombre", e.target.value)} />
          <Area id="cat-desc" etiqueta="Descripción" value={f.descripcion} onChange={(e) => poner("descripcion", e.target.value)} rows={2} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="cat-ciudad" etiqueta="Ciudad" value={f.ciudad} onChange={(e) => poner("ciudad", e.target.value)} />
            <Campo id="cat-horario" etiqueta="Horario" value={f.horario} onChange={(e) => poner("horario", e.target.value)} />
          </div>
          <Campo
            id="cat-whatsapp"
            etiqueta="WhatsApp que recibe los pedidos"
            type="tel"
            inputMode="tel"
            value={f.whatsapp}
            onChange={(e) => poner("whatsapp", e.target.value)}
            ayuda="Con código de país, por ejemplo +58 414 1234567. Cambiarlo pedirá tu contraseña en la versión final."
          />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-lg font-bold">Color de tu marca</legend>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <label htmlFor="cat-color" className="block text-sm font-semibold">
                Elegir
              </label>
              <input id="cat-color" type="color" value={colorValido ? f.color : "#2563eb"} onChange={(e) => poner("color", e.target.value)} className="h-11 w-16 cursor-pointer rounded-control border border-control bg-superficie p-1" />
            </div>
            <div className="w-36">
              <Campo id="cat-color-hex" etiqueta="Código" value={f.color} onChange={(e) => poner("color", e.target.value)} />
            </div>
            <span
              style={{ background: segura.marca, color: segura.texto }}
              className="inline-flex min-h-11 items-center rounded-control px-5 font-semibold"
              aria-label={`Vista previa del botón con el color ${segura.marca}`}
            >
              Agregar al pedido
            </span>
          </div>
          {colorValido && segura.ajustado ? (
            <Aviso tipo="alerta" titulo={`Lo oscurecemos a ${segura.marca}`}>
              Con {f.color} el texto del botón tendría contraste {contraste(f.color, "#ffffff").toFixed(2)}:1 y no se leería bien en el sol. Se guarda el tono ajustado.
            </Aviso>
          ) : (
            colorValido && <p className="text-sm text-tenue">Contraste del texto: {contraste(segura.marca, segura.texto).toFixed(2)}:1. Se lee bien.</p>
          )}
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-lg font-bold">Pedidos</legend>
          <Campo
            id="cat-minimo"
            etiqueta={`Pedido mínimo (${empresa.monedaBase})`}
            inputMode="decimal"
            value={f.minimo}
            onChange={(e) => poner("minimo", e.target.value)}
            ayuda="El catálogo no deja enviar pedidos menores. 0 para no tener mínimo."
          />
          <div role="radiogroup" aria-labelledby="titulo-stock" className="space-y-2">
            <p id="titulo-stock" className="text-sm font-semibold">
              Qué ve el cliente del stock
            </p>
            {(
              [
                ["nivel", "Disponible, Pocas unidades o Agotado"],
                ["cantidad", "La cantidad exacta disponible"],
                ["oculto", "Nada, solo si está agotado"],
              ] as const
            ).map(([v, t]) => (
              <label key={v} className="flex min-h-11 cursor-pointer items-center gap-3">
                <input type="radio" name="mostrarStock" checked={f.mostrarStock === v} onChange={() => setF((x) => ({ ...x, mostrarStock: v }))} className="size-5 accent-[var(--color-accion)]" />
                {t}
              </label>
            ))}
          </div>
          <Campo
            id="cat-dias"
            etiqueta="Cancelar pendientes sin confirmar después de"
            inputMode="numeric"
            value={f.dias}
            onChange={(e) => poner("dias", e.target.value)}
            ayuda="días. Evita pedidos olvidados en la lista."
          />
        </fieldset>

        <div className="flex flex-wrap items-center gap-3 border-t border-linea pt-6">
          {puede("ajustes") ? (
            <Boton type="submit" variante="accion">
              Guardar catálogo
            </Boton>
          ) : (
            <SinPermiso que="cambiar el catálogo" />
          )}
          {hecho && (
            <p role="status" className="text-sm font-semibold text-exito">
              Guardado. Ya se ve en tu catálogo.
            </p>
          )}
        </div>
      </form>
    </>
  );
}
