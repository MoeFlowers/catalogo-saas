import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EstadoPedido, Pedido } from "../datos/tipos";
import { pedidosDemostracion } from "../datos/pedidos-demo";

interface EstadoPedidos {
  lista: Pedido[];
  sembrado: boolean;
  sembrar: () => void;
  crear: (p: Omit<Pedido, "id" | "numero">) => Pedido;
}

export const usePedidos = create<EstadoPedidos>()(
  persist(
    (set, get) => ({
      lista: [],
      sembrado: false,
      sembrar: () => {
        if (get().sembrado) return;
        set((s) => ({ lista: [...pedidosDemostracion(), ...s.lista], sembrado: true }));
      },
      crear: (datos) => {
        const deEmpresa = get().lista.filter((p) => p.empresa === datos.empresa);
        const numero = Math.max(40, ...deEmpresa.map((p) => p.numero)) + 1;
        const pedido: Pedido = { ...datos, id: `${datos.empresa}-${numero}`, numero };
        set((s) => ({ lista: [pedido, ...s.lista] }));
        return pedido;
      },
    }),
    { name: "vitrina.pedidos" },
  ),
);

export const NOMBRE_ESTADO: Record<EstadoPedido, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  preparacion: "En preparación",
  listo: "Listo para retiro",
  despachado: "Despachado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export const EXPLICACION_ESTADO: Record<EstadoPedido, string> = {
  pendiente: "La empresa todavía no lo confirma. Si no enviaste el mensaje de WhatsApp, puedes hacerlo desde aquí.",
  confirmado: "La empresa confirmó el pedido y apartó la mercancía.",
  preparacion: "La empresa está preparando tu pedido.",
  listo: "Puedes pasar a retirarlo en el horario de la tienda.",
  despachado: "El pedido salió de la tienda.",
  entregado: "Pedido entregado.",
  cancelado: "Este pedido fue cancelado.",
};
