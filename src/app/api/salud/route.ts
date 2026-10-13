// Vivo: el proceso responde. No toca la base de datos.
export function GET() {
  return Response.json({ estado: "ok" });
}
