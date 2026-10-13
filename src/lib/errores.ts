/** Error de negocio con un mensaje que se puede mostrar a la persona tal cual */
export class ErrorApp extends Error {
  constructor(
    public readonly codigo: "no-encontrado" | "no-autorizado" | "prohibido" | "invalido" | "conflicto" | "limite",
    mensaje: string,
  ) {
    super(mensaje);
    this.name = "ErrorApp";
  }
}

export function esErrorApp(e: unknown): e is ErrorApp {
  return e instanceof ErrorApp;
}

/** Resultado de una acción de servidor: o datos, o un mensaje para la interfaz */
export type Resultado<T = void> = { ok: true; datos: T } | { ok: false; error: string; campos?: Record<string, string> };

export const ok = <T>(datos: T): Resultado<T> => ({ ok: true, datos });
export const fallo = (error: string, campos?: Record<string, string>): Resultado<never> => (campos ? { ok: false, error, campos } : { ok: false, error });
