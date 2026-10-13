import { describe, expect, it } from "vitest";
import { aBs, formatear, refUsd } from "./dinero";
import { disponible, mover } from "./inventario";
import { calcularLinea, mensajeWhatsApp } from "./pedido";
import { cantidadInicial, nivelStock, paso, precioUnitario, presentacion, validarCantidad } from "./precio";
import type { Empresa, Pedido, Producto, Tasas } from "./tipos";

const tasas: Tasas = { bcv: 36.4, usdt: 40, eur: 39.5, fecha: "2026-10-12T12:00:00.000Z", origen: "en-vivo" };

const tornillo: Producto = {
  id: "tor",
  empresa: "e1",
  categoria: "c1",
  nombre: "Tornillo 3/8",
  marca: "",
  sku: "TOR-38",
  descripcion: "",
  unidad: "unidad",
  unidadPlural: "unidades",
  precioCent: 9,
  escalas: [
    { desde: 500, precioCent: 8 },
    { desde: 2000, precioCent: 7 },
  ],
  presentaciones: [
    { id: "caja", nombre: "Caja de 100", factor: 100 },
    { id: "bulto", nombre: "Bulto de 1.000", factor: 1000 },
  ],
  varianteBaseId: "v-tor",
  stock: 1200,
  reservado: 300,
  activo: true,
  stockMinimo: 500,
  minimo: 100,
  multiplo: 100,
  bajoPedido: false,
  imagenes: [],
};

const empresa = { id: "e1", slug: "ferreteria", nombre: "Ferretería", monedaBase: "USD" } as Empresa;

describe("dinero", () => {
  it("convierte a bolívares en céntimos enteros y formatea en es-VE", () => {
    expect(aBs(2150, "USD", tasas)).toBe(78260);
    expect(formatear(78260, "VES")).toBe("Bs 782,60");
    expect(refUsd(78260, tasas)).toBe(2150);
  });

  it("sin tasa EUR no convierte en lugar de inventar un valor", () => {
    expect(aBs(100, "EUR", { ...tasas, eur: null })).toBeNull();
  });
});

describe("precios por cantidad", () => {
  it("aplica la escala según las unidades base", () => {
    expect(precioUnitario(tornillo, 100)).toBe(9);
    expect(precioUnitario(tornillo, 500)).toBe(8);
    expect(precioUnitario(tornillo, 3000)).toBe(7);
  });

  it("el paso del selector respeta el múltiplo de venta según la presentación", () => {
    expect(paso(tornillo, presentacion(tornillo, "caja"))).toBe(1);
    expect(paso({ ...tornillo, multiplo: 10 }, { id: "u", nombre: "Unidad", factor: 1 })).toBe(10);
    expect(cantidadInicial({ ...tornillo, minimo: 250, multiplo: 50 }, { id: "u", nombre: "Unidad", factor: 1 })).toBe(250);
  });

  it("valida mínimo, múltiplo y disponible", () => {
    const unidad = { id: "u", nombre: "Unidad", factor: 1 };
    expect(validarCantidad(tornillo, unidad, 50)).toMatch(/mínimo/);
    expect(validarCantidad(tornillo, unidad, 150)).toMatch(/de 100 en 100/);
    expect(validarCantidad(tornillo, presentacion(tornillo, "bulto"), 1)).toMatch(/Solo hay 900/);
    expect(validarCantidad(tornillo, presentacion(tornillo, "caja"), 9)).toBeNull();
  });
});

describe("inventario", () => {
  it("disponible es físico menos reservado", () => {
    expect(disponible(tornillo)).toBe(900);
    expect(nivelStock({ ...tornillo, reservado: 1200 })).toBe("agotado");
    expect(nivelStock({ ...tornillo, reservado: 1200, bajoPedido: true })).toBe("bajo-pedido");
  });

  it("mover no muta y nunca deja reservado negativo", () => {
    const [p] = mover([tornillo], { productoId: "tor" }, -100, -500);
    expect(p).toMatchObject({ stock: 1100, reservado: 0 });
    expect(tornillo.stock).toBe(1200);
  });
});

describe("pedido", () => {
  it("calcula la línea con la escala y la tasa del día", () => {
    const c = calcularLinea({ productoId: "tor", presentacionId: "caja", cantidad: 5 }, empresa, tasas, [tornillo])!;
    expect(c.unidadesBase).toBe(500);
    expect(c.precioUnitCent).toBe(8);
    expect(c.totalCent).toBe(4000);
    expect(c.totalBsCent).toBe(145600);
  });

  it("el mensaje de WhatsApp es determinista e incluye total, referencia y tasa", () => {
    const pedido = {
      numero: 42,
      items: [{ cantidad: 5, nombre: "Tornillo 3/8", detalle: "Caja de 100", totalBsCent: 145600 }],
      totalBsCent: 145600,
      tasa: 36.4,
      fechaTasa: tasas.fecha,
      entrega: "retiro",
      destino: "",
      nota: "",
      comprador: { nombre: "Ana", telefono: "", documento: "V-1" },
    } as unknown as Pedido;
    const m = mensajeWhatsApp(pedido, empresa, "https://vitrina.app/p/abc");
    expect(m).toContain("Pedido #0042");
    expect(m).toContain("Total: Bs 1.456,00 (Ref. USD 40,00)");
    expect(m).toContain("Tasa BCV 36,40");
    expect(m).toBe(mensajeWhatsApp(pedido, empresa, "https://vitrina.app/p/abc"));
  });
});
