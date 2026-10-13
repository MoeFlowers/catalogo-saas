import "server-only";
import nodemailer from "nodemailer";
import { env } from "./env";
import { registro } from "./registro";

// En desarrollo todo llega a Mailpit (http://localhost:8025); en producción, al SMTP del proveedor.
const transporte = nodemailer.createTransport({ host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_PORT === 465 });

export async function enviarCorreo(para: string, asunto: string, texto: string): Promise<void> {
  try {
    await transporte.sendMail({ from: env.SMTP_FROM, to: para, subject: asunto, text: texto });
  } catch (e) {
    // Un correo caído no debe tumbar el registro: se registra y la persona puede pedir otro código
    registro.error({ err: e, asunto }, "no se pudo enviar el correo");
  }
}

const ASUNTO = {
  "email-verification": "Tu código para verificar el correo",
  "sign-in": "Tu código para entrar a Vitrina",
  "forget-password": "Tu código para cambiar la contraseña",
  "change-email": "Tu código para cambiar el correo",
} as const;

export function correoCodigo(para: string, codigo: string, tipo: keyof typeof ASUNTO): Promise<void> {
  return enviarCorreo(
    para,
    `${ASUNTO[tipo]}: ${codigo}`,
    `Tu código es ${codigo}. Vence en 15 minutos.\n\nSi no lo pediste, ignora este correo: nadie puede entrar a tu cuenta sin él.\n\nVitrina`,
  );
}
