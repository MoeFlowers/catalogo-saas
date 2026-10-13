import Link from "next/link";
import { clasesBoton } from "@/ui/Boton";

export default function NoEncontrado() {
  return (
    <main id="contenido" tabIndex={-1} className="mx-auto max-w-lg px-4 py-20 text-center outline-none">
      <h1 className="text-2xl font-bold">Esta página no existe</h1>
      <p className="mt-2 text-tenue">Puede que el enlace esté mal escrito, que el pedido no sea tuyo o que el catálogo ya no esté publicado.</p>
      <Link href="/" className={clasesBoton("accion", "mt-6")}>
        Ir a Vitrina
      </Link>
    </main>
  );
}
