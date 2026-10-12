import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Comprador } from "../datos/tipos";

interface EstadoSesion {
  comprador: Comprador | null;
  entrar: (c: Comprador) => void;
  actualizar: (datos: Partial<Comprador>) => void;
  salir: () => void;
}

// En el boceto la sesión es simulada: no hay contraseñas ni conexión con Google.
export const useSesion = create<EstadoSesion>()(
  persist(
    (set) => ({
      comprador: null,
      entrar: (comprador) => set({ comprador }),
      actualizar: (datos) => set((s) => (s.comprador ? { comprador: { ...s.comprador, ...datos } } : s)),
      salir: () => set({ comprador: null }),
    }),
    { name: "vitrina.sesion" },
  ),
);
