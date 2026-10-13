import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { EMPRESAS_SEMILLA } from "../datos/empresas";
import { pedidosSemilla } from "../datos/pedidos-demo";
import { planDe } from "../datos/planes";
import { PRODUCTOS_SEMILLA } from "../datos/productos";
import type { Denuncia, Empresa, EstadoPedido, EventoAuditoria, Miembro, Movimiento, Pago, Pedido, Producto, Rol } from "../datos/tipos";
import { disponible, fisico, mover, type Clave } from "../lib/inventario";

// Datos del boceto en un solo almacén para que cada cambio de estado de un pedido mueva el inventario
// en la misma operación, como lo hará una transacción en la base de datos real.

/** Transiciones permitidas del pedido (plan maestro, sección 4.3) */
export const SIGUIENTES: Record<EstadoPedido, EstadoPedido[]> = {
  pendiente: ["confirmado", "cancelado"],
  confirmado: ["preparacion", "cancelado"],
  preparacion: ["listo", "despachado", "cancelado"],
  listo: ["entregado"],
  despachado: ["entregado"],
  entregado: [],
  cancelado: [],
};

const RESERVAN: EstadoPedido[] = ["confirmado", "preparacion"];
const SALIERON: EstadoPedido[] = ["listo", "despachado", "entregado"];

let contador = 0;
const nuevoId = (prefijo: string) => `${prefijo}-${Date.now().toString(36)}-${(contador++).toString(36)}`;

function hace(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString();
}

const enDias = (dias: number) => hace(-dias);

interface Unidades {
  clave: Clave;
  unidades: number;
  nombre: string;
}

function unidadesDe(p: Pedido): Unidades[] {
  return p.items.map((i) => ({
    clave: { productoId: i.productoId, varianteId: i.varianteId },
    unidades: i.unidadesBase,
    nombre: i.detalle.includes(",") ? `${i.nombre} (${i.detalle.split(", ").slice(1).join(", ")})` : i.nombre,
  }));
}

const claveTexto = (c: Clave) => `${c.productoId}/${c.varianteId ?? ""}`;

/** Estado inicial coherente: inventario inicial, salidas históricas y reservas de los pedidos semilla */
function estadoInicial() {
  const empresas = EMPRESAS_SEMILLA;
  let productos = PRODUCTOS_SEMILLA;
  const pedidos = pedidosSemilla(empresas, productos);
  const movimientos: Movimiento[] = [];
  const usuario = "Sistema";

  const salidas = new Map<string, number>();
  for (const p of pedidos.filter((x) => SALIERON.includes(x.estado))) {
    for (const u of unidadesDe(p)) salidas.set(claveTexto(u.clave), (salidas.get(claveTexto(u.clave)) ?? 0) + u.unidades);
  }

  for (const p of productos) {
    const claves: Clave[] = p.variantes ? p.variantes.map((v) => ({ productoId: p.id, varianteId: v.id })) : [{ productoId: p.id }];
    for (const c of claves) {
      const inicial = fisico(p, c.varianteId) + (salidas.get(claveTexto(c)) ?? 0);
      if (inicial > 0) {
        movimientos.push({ id: nuevoId("mov"), fecha: hace(30), empresa: p.empresa, ...c, tipo: "entrada", cantidad: inicial, motivo: "Inventario inicial", usuario });
      }
    }
  }

  for (const p of pedidos) {
    const salida = p.historial.find((h) => h.estado === "listo" || h.estado === "despachado");
    if (salida) {
      for (const u of unidadesDe(p)) {
        movimientos.push({ id: nuevoId("mov"), fecha: salida.fecha, empresa: p.empresa, ...u.clave, tipo: "salida", cantidad: -u.unidades, motivo: "Despacho de pedido", pedidoId: p.id, usuario });
      }
    }
    if (RESERVAN.includes(p.estado)) {
      const conf = p.historial.find((h) => h.estado === "confirmado")!;
      for (const u of unidadesDe(p)) {
        productos = mover(productos, u.clave, 0, u.unidades);
        movimientos.push({ id: nuevoId("mov"), fecha: conf.fecha, empresa: p.empresa, ...u.clave, tipo: "reserva", cantidad: u.unidades, motivo: "Pedido confirmado", pedidoId: p.id, usuario });
      }
    }
  }

  // Un pago esperando validación y una denuncia abierta, para que el panel de la plataforma tenga trabajo
  const pagos: Pago[] = [
    {
      id: nuevoId("pago"), empresa: "textiles-ejemplo", fecha: hace(1), metodo: "pago-movil", referencia: "00000000 (demostración)",
      montoCent: 0, moneda: "VES", estado: "en-revision", plan: "inicial", comprobante: "comprobante-demostracion.jpg",
    },
  ];
  const denuncias: Denuncia[] = [
    {
      id: nuevoId("den"), fecha: hace(2), empresa: "ferreteria-ejemplo", motivo: "precios",
      detalle: "Denuncia de demostración: el precio en Bs no coincidía con el que me dieron por WhatsApp.", autor: "cliente-c@ejemplo.test", estado: "abierta",
    },
  ];
  return { empresas, productos, pedidos, movimientos, pagos, denuncias, auditoria: [] as EventoAuditoria[], bloqueados: [] as string[] };
}

export interface NuevoMovimiento {
  empresa: string;
  clave: Clave;
  tipo: "entrada" | "salida" | "ajuste";
  /** Entrada y salida en positivo; ajuste con signo */
  cantidad: number;
  motivo: string;
  usuario: string;
}

interface EstadoDatos {
  empresas: Empresa[];
  productos: Producto[];
  pedidos: Pedido[];
  movimientos: Movimiento[];
  pagos: Pago[];
  denuncias: Denuncia[];
  auditoria: EventoAuditoria[];
  /** Correos de compradores bloqueados por abuso: no pueden enviar pedidos */
  bloqueados: string[];

  registrarEmpresa: (e: Empresa) => void;
  aprobarEmpresa: (slug: string, actor: string) => void;
  rechazarEmpresa: (slug: string, motivo: string, actor: string) => void;
  suspenderEmpresa: (slug: string, motivo: string, actor: string) => void;
  reactivarEmpresa: (slug: string, actor: string) => void;
  validarPago: (id: string, actor: string) => void;
  rechazarPago: (id: string, motivo: string, actor: string) => void;
  denunciar: (d: Omit<Denuncia, "id" | "fecha" | "estado">) => void;
  resolverDenuncia: (id: string, estado: "resuelta" | "desestimada", resolucion: string, actor: string) => void;
  bloquearComprador: (correo: string, bloquear: boolean, motivo: string, actor: string) => void;
  auditar: (actor: string, accion: string, objetivo: string, detalle?: string) => void;

  crearPedido: (datos: Omit<Pedido, "id" | "numero">) => Pedido;
  asignarSemillas: (correo: string) => void;
  marcarWhatsappAbierto: (pedidoId: string) => void;
  cambiarEstado: (pedidoId: string, destino: EstadoPedido, usuario: string) => string | null;
  ajustarCantidad: (pedidoId: string, indice: number, unidadesBase: number) => void;
  cancelarVencidos: (empresa: string) => number;

  registrarMovimiento: (m: NuevoMovimiento) => string | null;
  guardarProducto: (p: Producto, usuario: string, stockInicial?: Record<string, number>) => void;

  actualizarEmpresa: (slug: string, cambios: Partial<Empresa>) => void;
  invitar: (slug: string, correo: string, rol: Rol) => string | null;
  cambiarRol: (slug: string, correo: string, rol: Rol) => void;
  quitarMiembro: (slug: string, correo: string) => void;
  reportarPago: (pago: Omit<Pago, "id" | "fecha" | "estado">) => void;

  reiniciar: () => void;
}

export const useDatos = create<EstadoDatos>()(
  persist(
    (set, get) => ({
      ...estadoInicial(),

      crearPedido: (datos) => {
        const numero = Math.max(40, ...get().pedidos.filter((p) => p.empresa === datos.empresa).map((p) => p.numero)) + 1;
        const pedido: Pedido = { ...datos, id: `${datos.empresa}-${numero}`, numero };
        set((s) => ({ pedidos: [pedido, ...s.pedidos] }));
        return pedido;
      },

      asignarSemillas: (correo) =>
        set((s) => ({ pedidos: s.pedidos.map((p) => (p.semillaComprador ? { ...p, compradorCorreo: correo } : p)) })),

      marcarWhatsappAbierto: (pedidoId) =>
        set((s) => ({
          pedidos: s.pedidos.map((p) => (p.id === pedidoId && !p.whatsappAbierto ? { ...p, whatsappAbierto: new Date().toISOString() } : p)),
        })),

      cambiarEstado: (pedidoId, destino, usuario) => {
        const s = get();
        const pedido = s.pedidos.find((p) => p.id === pedidoId);
        if (!pedido) return "El pedido no existe.";
        if (!SIGUIENTES[pedido.estado].includes(destino)) return "Ese cambio de estado no está permitido.";

        let productos = s.productos;
        const movimientos: Movimiento[] = [];
        const ahora = new Date().toISOString();
        const base = { fecha: ahora, empresa: pedido.empresa, pedidoId, usuario };
        const lineas = unidadesDe(pedido);
        const productoDe = (c: Clave) => productos.find((p) => p.id === c.productoId);

        if (destino === "confirmado") {
          const faltan = lineas.filter((l) => {
            const p = productoDe(l.clave);
            return p && !p.bajoPedido && disponible(p, l.clave.varianteId) < l.unidades;
          });
          if (faltan.length > 0) {
            return `No alcanza el disponible para: ${faltan
              .map((l) => `${l.nombre} (pides ${l.unidades}, hay ${disponible(productoDe(l.clave)!, l.clave.varianteId)})`)
              .join("; ")}. Ajusta las cantidades o registra una entrada en Inventario.`;
          }
          for (const l of lineas) {
            productos = mover(productos, l.clave, 0, l.unidades);
            movimientos.push({ ...base, id: nuevoId("mov"), ...l.clave, tipo: "reserva", cantidad: l.unidades, motivo: "Pedido confirmado" });
          }
        }

        if (destino === "listo" || destino === "despachado") {
          const faltan = lineas.filter((l) => {
            const p = productoDe(l.clave);
            return p && fisico(p, l.clave.varianteId) < l.unidades;
          });
          if (faltan.length > 0) {
            return `Falta mercancía física de: ${faltan.map((l) => l.nombre).join(", ")}. Registra la entrada en Inventario antes de despachar.`;
          }
          for (const l of lineas) {
            productos = mover(productos, l.clave, -l.unidades, -l.unidades);
            movimientos.push({ ...base, id: nuevoId("mov"), ...l.clave, tipo: "salida", cantidad: -l.unidades, motivo: destino === "listo" ? "Pedido listo para retiro" : "Despacho de pedido" });
            movimientos.push({ ...base, id: nuevoId("mov"), ...l.clave, tipo: "liberacion", cantidad: -l.unidades, motivo: "Reserva cumplida" });
          }
        }

        if (destino === "cancelado" && RESERVAN.includes(pedido.estado)) {
          for (const l of lineas) {
            productos = mover(productos, l.clave, 0, -l.unidades);
            movimientos.push({ ...base, id: nuevoId("mov"), ...l.clave, tipo: "liberacion", cantidad: -l.unidades, motivo: "Pedido cancelado" });
          }
        }

        set({
          productos,
          movimientos: [...movimientos, ...s.movimientos],
          pedidos: s.pedidos.map((p) =>
            p.id === pedidoId ? { ...p, estado: destino, historial: [...p.historial, { estado: destino, fecha: ahora }] } : p,
          ),
        });
        return null;
      },

      ajustarCantidad: (pedidoId, indice, unidadesBase) =>
        set((s) => ({
          pedidos: s.pedidos.map((p) => {
            if (p.id !== pedidoId || p.estado !== "pendiente") return p;
            const items = p.items
              .map((it, i) => {
                if (i !== indice) return it;
                const factor = it.unidadesBase / it.cantidad;
                const totalCent = it.precioUnitCent * unidadesBase;
                return { ...it, cantidad: unidadesBase / factor, unidadesBase, totalCent, totalBsCent: Math.round(totalCent * p.tasa) };
              })
              .filter((it) => it.unidadesBase > 0);
            return {
              ...p,
              items,
              ajustado: true,
              totalCent: items.reduce((t, i) => t + i.totalCent, 0),
              totalBsCent: items.reduce((t, i) => t + i.totalBsCent, 0),
            };
          }),
        })),

      cancelarVencidos: (slug) => {
        const empresa = get().empresas.find((e) => e.slug === slug);
        if (!empresa) return 0;
        const limite = Date.now() - empresa.diasCancelacion * 86_400_000;
        const vencidos = get().pedidos.filter((p) => p.empresa === slug && p.estado === "pendiente" && new Date(p.fecha).getTime() < limite);
        for (const p of vencidos) get().cambiarEstado(p.id, "cancelado", "Cancelación automática");
        return vencidos.length;
      },

      registrarMovimiento: (m) => {
        const p = get().productos.find((x) => x.id === m.clave.productoId);
        if (!p) return "El producto no existe.";
        if (!Number.isInteger(m.cantidad) || m.cantidad === 0) return "La cantidad debe ser un número entero distinto de cero.";
        if (m.tipo !== "ajuste" && m.cantidad < 0) return "Escribe la cantidad en positivo.";
        if (m.motivo.trim().length < 3) return "Escribe el motivo del movimiento.";
        const delta = m.tipo === "salida" ? -m.cantidad : m.cantidad;
        if (delta < 0 && -delta > disponible(p, m.clave.varianteId)) {
          return `Solo puedes sacar lo disponible (${disponible(p, m.clave.varianteId)}). Lo reservado pertenece a pedidos confirmados.`;
        }
        set((s) => ({
          productos: mover(s.productos, m.clave, delta, 0),
          movimientos: [
            { id: nuevoId("mov"), fecha: new Date().toISOString(), empresa: m.empresa, ...m.clave, tipo: m.tipo, cantidad: delta, motivo: m.motivo.trim(), usuario: m.usuario },
            ...s.movimientos,
          ],
        }));
        return null;
      },

      guardarProducto: (producto, usuario, stockInicial) => {
        const existe = get().productos.find((p) => p.id === producto.id);
        if (existe) {
          // El stock solo cambia con movimientos: se conserva el físico y lo reservado de cada variante
          const conservado: Producto = {
            ...producto,
            stock: existe.stock,
            reservado: existe.reservado,
            variantes: producto.variantes?.map((v) => {
              const antes = existe.variantes?.find((x) => x.id === v.id);
              return { ...v, stock: antes?.stock ?? 0, reservado: antes?.reservado ?? 0 };
            }),
          };
          set((s) => ({ productos: s.productos.map((p) => (p.id === producto.id ? conservado : p)) }));
          return;
        }
        set((s) => ({ productos: [...s.productos, { ...producto, stock: 0, reservado: 0, variantes: producto.variantes?.map((v) => ({ ...v, stock: 0, reservado: 0 })) }] }));
        for (const [clave, cantidad] of Object.entries(stockInicial ?? {})) {
          if (cantidad > 0) {
            get().registrarMovimiento({
              empresa: producto.empresa,
              clave: { productoId: producto.id, varianteId: clave || undefined },
              tipo: "entrada",
              cantidad,
              motivo: "Inventario inicial",
              usuario,
            });
          }
        }
      },

      actualizarEmpresa: (slug, cambios) => set((s) => ({ empresas: s.empresas.map((e) => (e.slug === slug ? { ...e, ...cambios } : e)) })),

      invitar: (slug, correo, rol) => {
        const e = get().empresas.find((x) => x.slug === slug);
        if (!e) return "La empresa no existe.";
        if (e.equipo.some((m) => m.correo.toLowerCase() === correo.toLowerCase())) return "Esa persona ya está en el equipo.";
        const plan = planDe(e.plan);
        if (e.equipo.length >= plan.usuarios) {
          return `El plan ${plan.nombre} incluye ${plan.usuarios} ${plan.usuarios === 1 ? "usuario" : "usuarios"}. Cambia de plan para invitar a más personas.`;
        }
        const miembro: Miembro = { correo, nombre: "", rol, estado: "invitado" };
        get().actualizarEmpresa(slug, { equipo: [...e.equipo, miembro] });
        return null;
      },
      cambiarRol: (slug, correo, rol) => {
        const e = get().empresas.find((x) => x.slug === slug);
        if (e) get().actualizarEmpresa(slug, { equipo: e.equipo.map((m) => (m.correo === correo ? { ...m, rol } : m)) });
      },
      quitarMiembro: (slug, correo) => {
        const e = get().empresas.find((x) => x.slug === slug);
        if (e) get().actualizarEmpresa(slug, { equipo: e.equipo.filter((m) => m.correo !== correo) });
      },

      reportarPago: (pago) =>
        set((s) => ({ pagos: [{ ...pago, id: nuevoId("pago"), fecha: new Date().toISOString(), estado: "en-revision" }, ...s.pagos] })),

      auditar: (actor, accion, objetivo, detalle) =>
        set((s) => ({ auditoria: [{ id: nuevoId("aud"), fecha: new Date().toISOString(), actor, accion, objetivo, detalle }, ...s.auditoria] })),

      registrarEmpresa: (e) => set((s) => ({ empresas: [...s.empresas, e] })),

      aprobarEmpresa: (slug, actor) => {
        // La prueba de 30 días empieza al aprobar, no al registrarse
        get().actualizarEmpresa(slug, { estado: "activa", motivoEstado: undefined, vence: enDias(30) });
        get().auditar(actor, "Aprobó la empresa", slug);
      },
      rechazarEmpresa: (slug, motivo, actor) => {
        get().actualizarEmpresa(slug, { estado: "rechazada", motivoEstado: motivo, publicado: false });
        get().auditar(actor, "Rechazó la empresa", slug, motivo);
      },
      suspenderEmpresa: (slug, motivo, actor) => {
        get().actualizarEmpresa(slug, { estado: "suspendida", motivoEstado: motivo });
        get().auditar(actor, "Suspendió la empresa", slug, motivo);
      },
      reactivarEmpresa: (slug, actor) => {
        get().actualizarEmpresa(slug, { estado: "activa", motivoEstado: undefined });
        get().auditar(actor, "Reactivó la empresa", slug);
      },

      validarPago: (id, actor) => {
        const pago = get().pagos.find((p) => p.id === id);
        const empresa = get().empresas.find((e) => e.slug === pago?.empresa);
        if (!pago || !empresa) return;
        // Extiende 30 días desde el vencimiento actual, o desde hoy si ya venció
        const base = Math.max(Date.now(), new Date(empresa.vence).getTime());
        get().actualizarEmpresa(empresa.slug, { vence: new Date(base + 30 * 86_400_000).toISOString(), plan: pago.plan });
        set((s) => ({ pagos: s.pagos.map((p) => (p.id === id ? { ...p, estado: "validado" } : p)) }));
        get().auditar(actor, "Validó un pago", empresa.slug, `ref. ${pago.referencia}, plan ${planDe(pago.plan).nombre}`);
      },
      rechazarPago: (id, motivo, actor) => {
        const pago = get().pagos.find((p) => p.id === id);
        set((s) => ({ pagos: s.pagos.map((p) => (p.id === id ? { ...p, estado: "rechazado", motivo } : p)) }));
        if (pago) get().auditar(actor, "Rechazó un pago", pago.empresa, `ref. ${pago.referencia}: ${motivo}`);
      },

      denunciar: (d) => set((s) => ({ denuncias: [{ ...d, id: nuevoId("den"), fecha: new Date().toISOString(), estado: "abierta" }, ...s.denuncias] })),
      resolverDenuncia: (id, estado, resolucion, actor) => {
        const d = get().denuncias.find((x) => x.id === id);
        set((s) => ({ denuncias: s.denuncias.map((x) => (x.id === id ? { ...x, estado, resolucion } : x)) }));
        if (d) get().auditar(actor, estado === "resuelta" ? "Resolvió una denuncia" : "Desestimó una denuncia", d.empresa, resolucion);
      },

      bloquearComprador: (correo, bloquear, motivo, actor) => {
        set((s) => ({ bloqueados: bloquear ? [...new Set([...s.bloqueados, correo])] : s.bloqueados.filter((c) => c !== correo) }));
        get().auditar(actor, bloquear ? "Bloqueó un comprador" : "Desbloqueó un comprador", correo, motivo || undefined);
      },

      reiniciar: () => set(estadoInicial()),
    }),
    {
      name: "vitrina.datos",
      version: 5,
      // El boceto no conserva datos de versiones anteriores: vuelve a la demostración inicial
      migrate: () => estadoInicial() as unknown as EstadoDatos,
    },
  ),
);

export function useEmpresaPorSlug(slug: string | undefined): Empresa | undefined {
  return useDatos((s) => s.empresas.find((e) => e.slug === slug));
}

export function useProductosDe(slug: string, soloActivos = false): Producto[] {
  return useDatos(useShallow((s) => s.productos.filter((p) => p.empresa === slug && (!soloActivos || p.activo))));
}

export function useProducto(id: string | undefined): Producto | undefined {
  return useDatos((s) => s.productos.find((p) => p.id === id));
}

export function usePedidosDe(empresa: string): Pedido[] {
  return useDatos(useShallow((s) => s.pedidos.filter((p) => p.empresa === empresa)));
}

export function usePedido(id: string | undefined): Pedido | undefined {
  return useDatos((s) => s.pedidos.find((p) => p.id === id));
}
