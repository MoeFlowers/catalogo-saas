import type { ReactNode } from "react";
import { Aviso } from "../../ui/piezas";
import { CabeceraSitio, PieSitio } from "./Portada";

function Documento({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <>
      <CabeceraSitio />
      <main id="contenido" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-10 outline-none">
        <h1 className="text-3xl font-bold">{titulo}</h1>
        <div className="mt-4">
          <Aviso tipo="alerta" titulo="Borrador para revisión legal">
            Este texto describe cómo funcionará Vitrina. No está vigente: un abogado debe revisarlo antes del lanzamiento.
          </Aviso>
        </div>
        <div className="mt-8 space-y-6 leading-relaxed [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_li]:mt-1 [&_p]:text-tinta [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
      </main>
      <PieSitio />
    </>
  );
}

export function Terminos() {
  return (
    <Documento titulo="Términos de uso">
      <h2>Qué es Vitrina</h2>
      <p>
        Vitrina es una plataforma para que las empresas publiquen catálogos en línea y reciban pedidos por WhatsApp. Vitrina no vende productos, no cobra los
        pedidos ni participa en la entrega: la venta es entre la empresa y su cliente.
      </p>

      <h2>Cuentas de empresa</h2>
      <ul>
        <li>Quien registra la empresa declara que tiene facultad para representarla y que los datos (razón social, RIF, dirección) son verdaderos.</li>
        <li>Toda empresa queda en revisión hasta que Vitrina la aprueba. Vitrina puede rechazar una solicitud explicando el motivo.</li>
        <li>Cada persona del equipo usa su propia cuenta con verificación en dos pasos. La empresa responde por lo que hace su equipo.</li>
      </ul>

      <h2>Catálogo, precios y pedidos</h2>
      <ul>
        <li>La empresa es responsable de sus productos, precios, existencias y de cumplir los pedidos que confirma.</li>
        <li>Los precios en bolívares se calculan con la tasa oficial del BCV del momento. El pedido guarda la tasa del día en que se hizo.</li>
        <li>Vitrina no puede saber si el comprador envió el mensaje de WhatsApp: el pedido queda pendiente hasta que la empresa lo confirma.</li>
      </ul>

      <h2>Suscripción y pagos</h2>
      <ul>
        <li>El primer mes es gratis desde la aprobación. Después se paga el plan cada mes por los medios publicados en el panel.</li>
        <li>Vitrina valida cada pago reportado. Si la suscripción vence, el catálogo se sigue viendo pero no recibe pedidos; los datos no se borran.</li>
        <li>No hay comisión por pedido.</li>
      </ul>

      <h2>Usos prohibidos</h2>
      <ul>
        <li>Vender productos ilegales, falsificados o robados.</li>
        <li>Hacerse pasar por otra empresa o usar el catálogo para estafar.</li>
        <li>Enviar pedidos falsos o usar datos de compradores para fines distintos a atender sus pedidos.</li>
      </ul>
      <p>Ante una denuncia, Vitrina puede suspender una empresa o bloquear una cuenta de comprador mientras revisa el caso, y deja registro de cada decisión.</p>

      <h2>Cambios</h2>
      <p>Si estos términos cambian, se avisa por correo a las empresas con al menos 15 días de anticipación.</p>
    </Documento>
  );
}

export function Privacidad() {
  return (
    <Documento titulo="Política de privacidad">
      <h2>Qué datos guardamos</h2>
      <ul>
        <li>De las empresas: razón social, RIF, dirección, WhatsApp, correo y nombre de cada persona del equipo.</li>
        <li>De los compradores: nombre, correo, teléfono, cédula o RIF si lo dan, direcciones de entrega y sus pedidos.</li>
        <li>Registros de seguridad: inicios de sesión y acciones importantes, para detectar abusos.</li>
      </ul>

      <h2>Con quién se comparten</h2>
      <ul>
        <li>Cuando un comprador hace un pedido, la empresa de ese pedido ve su nombre, teléfono, documento y dirección. Ninguna otra empresa los ve.</li>
        <li>Vitrina no vende datos ni los usa para publicidad de terceros.</li>
        <li>El mensaje del pedido viaja por WhatsApp, que tiene su propia política de privacidad.</li>
      </ul>

      <h2>Cómo se protegen</h2>
      <ul>
        <li>Las contraseñas se guardan cifradas con argon2id; nadie en Vitrina puede leerlas.</li>
        <li>Las cuentas de empresa usan verificación en dos pasos obligatoria.</li>
        <li>Los datos de cada empresa están separados en la base de datos para que ninguna vea los de otra.</li>
        <li>Las fotos que se suben se limpian de datos de ubicación.</li>
      </ul>

      <h2>Tus derechos</h2>
      <p>
        Puedes ver y corregir tus datos desde tu cuenta, y pedir que borremos tu cuenta. Los pedidos ya hechos se conservan para la empresa que los atendió, sin tu
        correo, por obligaciones contables.
      </p>
    </Documento>
  );
}
