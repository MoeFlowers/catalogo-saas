"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authCliente } from "@/lib/auth-cliente";

const PESTANA = "flex min-h-11 items-center border-b-2 px-1 text-sm font-semibold";

export function CabeceraCuenta({ correo }: { correo: string }) {
  const ruta = usePathname();
  const router = useRouter();
  const pestana = (href: string, texto: string, activa: boolean) => (
    <Link href={href} aria-current={activa ? "page" : undefined} className={`${PESTANA} ${activa ? "border-tinta text-tinta" : "border-transparent text-tenue hover:text-tinta"}`}>
      {texto}
    </Link>
  );
  return (
    <header className="border-b border-linea bg-superficie">
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 pt-3">
        <Link href="/" className="text-lg font-bold">
          Vitrina
        </Link>
        <p className="ml-auto truncate text-sm text-tenue">{correo}</p>
        <button
          type="button"
          onClick={async () => {
            await authCliente.signOut();
            router.push("/");
            router.refresh();
          }}
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-control px-3 text-sm font-semibold hover:bg-hundido"
        >
          <LogOut size={16} aria-hidden />
          Salir
        </button>
      </div>
      <nav aria-label="Mi cuenta" className="mx-auto flex max-w-4xl gap-6 px-4">
        {pestana("/cuenta", "Mis pedidos", ruta === "/cuenta" || ruta.startsWith("/cuenta/pedidos"))}
        {pestana("/cuenta/datos", "Mis datos", ruta === "/cuenta/datos")}
      </nav>
    </header>
  );
}
