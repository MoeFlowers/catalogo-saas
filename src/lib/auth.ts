import "server-only";
import { hash, verify } from "@node-rs/argon2";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP, haveIBeenPwned, twoFactor } from "better-auth/plugins";
import { correoCodigo } from "./correo";
import { db } from "./db";
import { account, session, twoFactor as tablaDobleFactor, user, verification } from "./db/esquema";
import { env, googleActivo } from "./env";

// Parámetros de argon2id recomendados por OWASP (19 MiB, 2 pasadas, 1 hilo)
const ARGON = { memoryCost: 19_456, timeCost: 2, parallelism: 1 };

/** Autenticación (ADR-0006): una sola tabla de usuarios para empresas, compradores y administración. */
export const auth = betterAuth({
  appName: "Vitrina",
  baseURL: env.APP_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema: { user, session, account, verification, twoFactor: tablaDobleFactor } }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    requireEmailVerification: true,
    password: {
      hash: (clave) => hash(clave, ARGON),
      verify: ({ hash: guardado, password }) => verify(guardado, password),
    },
  },
  emailVerification: { autoSignInAfterVerification: true },
  socialProviders: googleActivo ? { google: { clientId: env.GOOGLE_CLIENT_ID!, clientSecret: env.GOOGLE_CLIENT_SECRET! } } : {},
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    // Acciones sensibles (cambiar WhatsApp, quitar el doble factor) piden una sesión de menos de 10 minutos
    freshAge: 60 * 10,
  },
  rateLimit: {
    enabled: env.APP_ENV !== "test",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
      "/two-factor/*": { window: 60, max: 5 },
      "/email-otp/*": { window: 60, max: 5 },
    },
  },
  advanced: { cookiePrefix: "vitrina", useSecureCookies: env.APP_URL.startsWith("https://") },
  plugins: [
    emailOTP({
      otpLength: 6,
      expiresIn: 15 * 60,
      allowedAttempts: 5,
      sendVerificationOnSignUp: true,
      overrideDefaultEmailVerification: true,
      sendVerificationOTP: async ({ email, otp, type }) => {
        // Sin await a propósito: el tiempo de respuesta no debe revelar si el correo existe
        void correoCodigo(email, otp, type);
      },
    }),
    twoFactor({ issuer: "Vitrina" }),
    // Rango anónimo de Have I Been Pwned: la contraseña nunca sale del servidor
    ...(env.APP_ENV === "test" ? [] : [haveIBeenPwned({ customPasswordCompromisedMessage: "Esa contraseña aparece en filtraciones conocidas. Elige otra." })]),
    nextCookies(),
  ],
});

export type Sesion = typeof auth.$Infer.Session;
