import { BotonEnlace } from "../ui/Boton";

export function NoEncontrado() {
  return (
    <main id="contenido" className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Esta página no existe</h1>
      <p className="mt-2 text-tenue">Puede que el enlace esté mal escrito o que el catálogo ya no esté publicado.</p>
      <BotonEnlace to="/" variante="accion" className="mt-6">
        Volver al recorrido
      </BotonEnlace>
    </main>
  );
}
