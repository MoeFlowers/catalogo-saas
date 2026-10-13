import type { Metadata } from "next";
import { Suspense } from "react";
import { ListaPedidos } from "@/componentes/panel/ListaPedidos";
import { conContexto } from "@/lib/db";
import { contextoPanel } from "@/modulos/cuentas/panel";
import { cargarPedidos } from "@/modulos/pedidos/servicio";

export const metadata: Metadata = { title: "Pedidos" };

export default async function Pedidos() {
  const { ctx } = await contextoPanel();
  const pedidos = await conContexto(ctx, (tx) => cargarPedidos(tx));
  return (
    <Suspense>
      <ListaPedidos pedidos={pedidos} />
    </Suspense>
  );
}
