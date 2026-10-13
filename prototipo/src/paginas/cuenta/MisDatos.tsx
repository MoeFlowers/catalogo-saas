import { useState, type FormEvent } from "react";
import { useSesion } from "../../estado/sesion";
import { Boton } from "../../ui/Boton";
import { Campo } from "../../ui/Campo";
import { Aviso } from "../../ui/piezas";

export function MisDatos() {
  const { comprador, actualizar } = useSesion();
  const [nombre, setNombre] = useState(comprador?.nombre ?? "");
  const [telefono, setTelefono] = useState(comprador?.telefono ?? "");
  const [documento, setDocumento] = useState(comprador?.documento ?? "");
  const [razonSocial, setRazonSocial] = useState(comprador?.razonSocial ?? "");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardado, setGuardado] = useState(false);

  if (!comprador) return null;

  const guardar = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (nombre.trim().length < 3) err.nombre = "Escribe tu nombre.";
    if (telefono && telefono.replace(/\D/g, "").length < 10) err.telefono = "Escribe el teléfono con código de área, por ejemplo 0414 1234567.";
    setErrores(err);
    setGuardado(false);
    if (Object.keys(err).length > 0) {
      document.getElementById(Object.keys(err)[0]!)?.focus();
      return;
    }
    actualizar({ nombre: nombre.trim(), telefono: telefono.trim(), documento: documento.trim(), razonSocial: razonSocial.trim() });
    setGuardado(true);
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Mis datos</h1>
      <p className="mt-1 text-tenue">Se usan para llenar tus pedidos. Cada empresa solo ve los datos de los pedidos que le envías.</p>

      <form onSubmit={guardar} noValidate className="mt-6 max-w-lg space-y-4">
        <Campo id="correo" etiqueta="Correo" value={comprador.correo} readOnly ayuda={comprador.metodo === "google" ? "Entras con Google." : "Entras con correo y contraseña."} />
        <Campo id="nombre" etiqueta="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} error={errores.nombre} autoComplete="name" />
        <Campo id="telefono" etiqueta="Teléfono" type="tel" inputMode="tel" opcional value={telefono} onChange={(e) => setTelefono(e.target.value)} error={errores.telefono} autoComplete="tel" />

        <fieldset className="space-y-4 border-t border-linea pt-4">
          <legend className="pt-4 font-bold">Datos para factura</legend>
          <Campo id="razon" etiqueta="Razón social" opcional value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} ayuda="Si compras para una empresa." />
          <Campo id="documento" etiqueta="Cédula o RIF" opcional value={documento} onChange={(e) => setDocumento(e.target.value)} />
        </fieldset>

        <Boton type="submit" variante="accion">
          Guardar cambios
        </Boton>
        {guardado && <Aviso>Cambios guardados.</Aviso>}
      </form>

      <Direcciones />
    </>
  );
}

function Direcciones() {
  const { comprador, actualizar } = useSesion();
  const [nombre, setNombre] = useState("");
  const [detalle, setDetalle] = useState("");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [hecho, setHecho] = useState<string | null>(null);
  if (!comprador) return null;
  const lista = comprador.direcciones ?? [];

  const agregar = (e: FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (nombre.trim().length < 2) err["dir-nombre"] = "Ponle un nombre, por ejemplo Depósito.";
    if (detalle.trim().length < 8) err["dir-detalle"] = "Escribe la dirección completa o la ciudad y agencia de destino.";
    setErrores(err);
    setHecho(null);
    const primero = Object.keys(err)[0];
    if (primero) return document.getElementById(primero)?.focus();
    actualizar({ direcciones: [...lista, { id: `dir-${Date.now().toString(36)}`, nombre: nombre.trim(), detalle: detalle.trim() }] });
    setHecho(`Guardaste ${nombre.trim()}.`);
    setNombre("");
    setDetalle("");
  };

  return (
    <section aria-labelledby="titulo-direcciones" className="mt-10 max-w-lg">
      <h2 id="titulo-direcciones" className="text-lg font-bold">
        Direcciones
      </h2>
      <p className="mt-1 text-sm text-tenue">Las eliges al pedir con delivery o encomienda, sin volver a escribirlas.</p>
      {lista.length === 0 ? (
        <p className="mt-3 text-tenue">No tienes direcciones guardadas.</p>
      ) : (
        <ul className="mt-3 divide-y divide-linea rounded-tarjeta border border-linea bg-superficie">
          {lista.map((d) => (
            <li key={d.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <span className="min-w-0">
                <span className="block font-semibold">{d.nombre}</span>
                <span className="block text-sm text-tenue">{d.detalle}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  actualizar({ direcciones: lista.filter((x) => x.id !== d.id) });
                  setHecho(`Quitaste ${d.nombre}.`);
                }}
                className="min-h-11 shrink-0 px-2 text-sm font-semibold text-peligro underline underline-offset-2"
              >
                Quitar<span className="sr-only"> {d.nombre}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={agregar} noValidate className="mt-4 space-y-4">
        <Campo id="dir-nombre" etiqueta="Nombre de la dirección" value={nombre} onChange={(e) => setNombre(e.target.value)} error={errores["dir-nombre"]} ayuda="Depósito, Casa, Agencia Barquisimeto" />
        <Campo id="dir-detalle" etiqueta="Dirección" value={detalle} onChange={(e) => setDetalle(e.target.value)} error={errores["dir-detalle"]} autoComplete="street-address" />
        <Boton type="submit">Guardar dirección</Boton>
        {hecho && (
          <p role="status" className="text-sm font-semibold text-exito">
            {hecho}
          </p>
        )}
      </form>
    </section>
  );
}
