"use client";

import { emailOTPClient, twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/** Cliente de autenticación para los formularios del navegador (registro, entrar, doble factor) */
export const authCliente = createAuthClient({
  plugins: [
    emailOTPClient(),
    // El paso de doble factor lo maneja cada pantalla de entrada; no se redirige solo
    twoFactorClient(),
  ],
});

/** Mensajes en español para los códigos de error de Better Auth que ve una persona */
export function mensajeError(e: { code?: string | undefined; message?: string | undefined } | null | undefined): string {
  switch (e?.code) {
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "Ese correo ya tiene una cuenta. Entra con él o recupera la contraseña.";
    case "INVALID_EMAIL_OR_PASSWORD":
      return "El correo o la contraseña no coinciden.";
    case "EMAIL_NOT_VERIFIED":
      return "Todavía no verificas tu correo. Te enviamos un código nuevo.";
    case "PASSWORD_TOO_SHORT":
      return "La contraseña debe tener al menos 12 caracteres.";
    case "PASSWORD_COMPROMISED":
      return "Esa contraseña aparece en filtraciones conocidas. Elige otra.";
    case "INVALID_OTP":
    case "INVALID_CODE":
    case "INVALID_TWO_FACTOR_CODE":
      return "El código no es correcto.";
    case "OTP_EXPIRED":
      return "El código venció. Pide uno nuevo.";
    case "TOO_MANY_ATTEMPTS":
      return "Demasiados intentos. Pide un código nuevo.";
    default:
      return e?.message && /^[A-ZÁÉÍÓÚÑ¿]/.test(e.message) && /[áéíóúñ]/i.test(e.message) ? e.message : "No se pudo completar. Intenta de nuevo en un momento.";
  }
}
