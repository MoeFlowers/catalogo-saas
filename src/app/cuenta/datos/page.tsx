import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MisDatos } from "@/componentes/cuenta/MisDatos";
import { perfilComprador } from "@/modulos/compras/acciones";

export const metadata: Metadata = { title: "Mis datos" };

export default async function Datos() {
  const perfil = await perfilComprador();
  if (!perfil) redirect("/entrar?volver=/cuenta/datos");
  return <MisDatos perfil={perfil} />;
}
