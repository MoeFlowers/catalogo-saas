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
    </>
  );
}
