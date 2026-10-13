"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LineaPedido } from "@/dominio/tipos";

interface EstadoCarrito {
  /** Un pedido abierto por empresa */
  porEmpresa: Record<string, LineaPedido[]>;
  agregar: (empresa: string, linea: LineaPedido) => void;
  cambiar: (empresa: string, indice: number, cantidad: number) => void;
  quitar: (empresa: string, indice: number) => void;
  reemplazar: (empresa: string, lineas: LineaPedido[]) => void;
  vaciar: (empresa: string) => void;
}

const misma = (a: LineaPedido, b: LineaPedido) =>
  a.productoId === b.productoId && a.varianteId === b.varianteId && a.presentacionId === b.presentacionId;

export const useCarrito = create<EstadoCarrito>()(
  persist(
    (set) => ({
      porEmpresa: {},
      agregar: (empresa, linea) =>
        set((s) => {
          const actual = s.porEmpresa[empresa] ?? [];
          const i = actual.findIndex((l) => misma(l, linea));
          const nuevas =
            i >= 0 ? actual.map((l, j) => (j === i ? { ...l, cantidad: l.cantidad + linea.cantidad } : l)) : [...actual, linea];
          return { porEmpresa: { ...s.porEmpresa, [empresa]: nuevas } };
        }),
      cambiar: (empresa, indice, cantidad) =>
        set((s) => ({
          porEmpresa: {
            ...s.porEmpresa,
            [empresa]: (s.porEmpresa[empresa] ?? []).map((l, j) => (j === indice ? { ...l, cantidad } : l)),
          },
        })),
      quitar: (empresa, indice) =>
        set((s) => ({
          porEmpresa: { ...s.porEmpresa, [empresa]: (s.porEmpresa[empresa] ?? []).filter((_, j) => j !== indice) },
        })),
      reemplazar: (empresa, lineas) => set((s) => ({ porEmpresa: { ...s.porEmpresa, [empresa]: lineas } })),
      vaciar: (empresa) => set((s) => ({ porEmpresa: { ...s.porEmpresa, [empresa]: [] } })),
    }),
    { name: "vitrina.carrito" },
  ),
);
