import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Comprador, Rol } from "../datos/tipos";

export interface SesionPanel {
  empresa: string;
  correo: string;
  nombre: string;
  rol: Rol;
  desde: string;
  /** Entró alguien de Vitrina a dar soporte: todo en solo lectura y queda en la auditoría */
  soporte?: boolean;
}

export interface SesionAdmin {
  correo: string;
  desde: string;
}

interface EstadoSesion {
  comprador: Comprador | null;
  panel: SesionPanel | null;
  admin: SesionAdmin | null;
  entrarAdmin: (s: SesionAdmin) => void;
  salirAdmin: () => void;
  entrar: (c: Comprador) => void;
  actualizar: (datos: Partial<Comprador>) => void;
  salir: () => void;
  entrarPanel: (s: SesionPanel) => void;
  salirPanel: () => void;
}

// En el boceto las sesiones son simuladas: no hay contraseñas, ni Google, ni códigos reales.
// Comprador y empresa son sesiones distintas, como lo serán en la app (cuentas y permisos separados).
export const useSesion = create<EstadoSesion>()(
  persist(
    (set) => ({
      comprador: null,
      panel: null,
      admin: null,
      entrarAdmin: (admin) => set({ admin }),
      salirAdmin: () => set({ admin: null }),
      entrar: (comprador) => set({ comprador }),
      actualizar: (datos) => set((s) => (s.comprador ? { comprador: { ...s.comprador, ...datos } } : s)),
      salir: () => set({ comprador: null }),
      entrarPanel: (panel) => set({ panel }),
      salirPanel: () => set({ panel: null }),
    }),
    {
      name: "vitrina.sesion",
      version: 2,
      // Las sesiones de versiones anteriores del boceto no tienen los campos nuevos: se cierran
      migrate: () => ({ comprador: null, panel: null, admin: null }) as unknown as EstadoSesion,
    },
  ),
);
