"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { agregarDireccion, guardarPerfil, quitarDireccion } from "@/modulos/compras/acciones";
import { Boton } from "@/ui/Boton";
import { Campo } from "@/ui/Campo";
import { Aviso } from "@/ui/piezas";

interface Perfil {
  nombre: string;
  correo: string;
  telefono: string;
  documento: string;
  razonSocial: string;
  direcciones: { id: string; nombre: string; detalle: string }[];
}

export function MisDatos({ perfil }: { perfil: Perfil }) {
  const router = useRouter();
  const [enCurso, iniciar] = useTransition();
  const [f, setF] = useState({ nombre: perfil.nombre, telefono: perfil.telefono, documento: perfil.documento, razonSocial: perfil.razonSocial });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardado, setGuardado] = useState(false);
  const [dir, setDir] = useState({ nombre: "", detalle: "" });
  const [erroresDir, setErroresDir] = useState<Record<string, string>>({});
  const [hechoDir, setHechoDir] = useState<string | null>(null);

  const guardar = (e: FormEvent) => {
    e.preventDefault();
    setGuardado(false);
    iniciar(async () => {
      const r = await guardarPerfil(f);
      if (!r.ok) {
        setErrores(r.campos ?? { nombre: r.error });
        const primero = Object.keys(r.campos ?? { nombre: 1 })[0];
        if (primero) document.getElementById(primero)?.focus();
        return;
      }
      setErrores({});
      setGuardado(true);
      router.refresh();
    });
  };

  const agregar = (e: FormEvent) => {
    e.preventDefault();
    setHechoDir(null);
    iniciar(async () => {
      const r = await agregarDireccion(dir.nombre, dir.detalle);
      if (!r.ok) {
        setErroresDir(r.campos ?? { "dir-nombre": r.error });
        const primero = Object.keys(r.campos ?? { "dir-nombre": 1 })[0];
        if (primero) document.getElementById(primero)?.focus();
        return;
      }
      setErroresDir({});
      setHechoDir(`Guardaste ${dir.nombre.trim()}.`);
      setDir({ nombre: "", detalle: "" });
      router.refresh();
    });
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Mis datos</h1>
      <p className="mt-1 text-tenue">Se usan para llenar tus pedidos. Cada empresa solo ve los datos de los pedidos que le envías.</p>

      <form onSubmit={guardar} noValidate className="mt-6 max-w-lg space-y-4">
        <Campo id="correo" etiqueta="Correo" value={perfil.correo} readOnly ayuda="Para cambiar el correo, escribe a soporte." />
        <Campo id="nombre" etiqueta="Nombre" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} error={errores.nombre} autoComplete="name" />
        <Campo id="telefono" etiqueta="Teléfono" type="tel" inputMode="tel" opcional value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} error={errores.telefono} autoComplete="tel" />
        <fieldset className="space-y-4 border-t border-linea pt-4">
          <legend className="pt-4 font-bold">Datos para factura</legend>
          <Campo id="razonSocial" etiqueta="Razón social" opcional value={f.razonSocial} onChange={(e) => setF({ ...f, razonSocial: e.target.value })} ayuda="Si compras para una empresa." />
          <Campo id="documento" etiqueta="Cédula o RIF" opcional value={f.documento} onChange={(e) => setF({ ...f, documento: e.target.value })} error={errores.documento} />
        </fieldset>
        <Boton type="submit" variante="accion" cargando={enCurso} textoCargando="Guardando">
          Guardar cambios
        </Boton>
        {guardado && <Aviso>Cambios guardados.</Aviso>}
      </form>

      <section aria-labelledby="titulo-direcciones" className="mt-10 max-w-lg">
        <h2 id="titulo-direcciones" className="text-lg font-bold">
          Direcciones
        </h2>
        <p className="mt-1 text-sm text-tenue">Las eliges al pedir con delivery o encomienda, sin volver a escribirlas.</p>
        {perfil.direcciones.length === 0 ? (
          <p className="mt-3 text-tenue">No tienes direcciones guardadas.</p>
        ) : (
          <ul className="mt-3 divide-y divide-linea rounded-tarjeta border border-linea bg-superficie">
            {perfil.direcciones.map((d) => (
              <li key={d.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="block font-semibold">{d.nombre}</span>
                  <span className="block text-sm text-tenue">{d.detalle}</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    iniciar(async () => {
                      await quitarDireccion(d.id);
                      setHechoDir(`Quitaste ${d.nombre}.`);
                      router.refresh();
                    })
                  }
                  className="min-h-11 shrink-0 px-2 text-sm font-semibold text-peligro underline underline-offset-2"
                >
                  Quitar<span className="sr-only"> {d.nombre}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={agregar} noValidate className="mt-4 space-y-4">
          <Campo id="dir-nombre" etiqueta="Nombre de la dirección" value={dir.nombre} onChange={(e) => setDir({ ...dir, nombre: e.target.value })} error={erroresDir["dir-nombre"]} ayuda="Depósito, Casa, Agencia Barquisimeto" />
          <Campo id="dir-detalle" etiqueta="Dirección" value={dir.detalle} onChange={(e) => setDir({ ...dir, detalle: e.target.value })} error={erroresDir["dir-detalle"]} autoComplete="street-address" />
          <Boton type="submit" cargando={enCurso} textoCargando="Guardando">
            Guardar dirección
          </Boton>
          {hechoDir && (
            <p role="status" className="text-sm font-semibold text-exito">
              {hechoDir}
            </p>
          )}
        </form>
      </section>
    </>
  );
}
