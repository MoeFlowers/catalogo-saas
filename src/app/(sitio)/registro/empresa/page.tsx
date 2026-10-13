import { redirect } from "next/navigation";

// El panel manda aquí a quien tiene cuenta pero todavía no registró su empresa
export default function RegistroEmpresa() {
  redirect("/registro");
}
