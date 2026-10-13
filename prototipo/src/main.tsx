import { StrictMode, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router";
import "./index.css";
import { Raiz } from "./paginas/Raiz";
import { Recorrido } from "./paginas/Recorrido";
import { CatalogoLayout } from "./paginas/catalogo/CatalogoLayout";
import { Portada } from "./paginas/catalogo/Portada";
import { FichaProducto } from "./paginas/catalogo/FichaProducto";
import { MiPedido } from "./paginas/catalogo/MiPedido";
import { PedidoEnviado } from "./paginas/catalogo/PedidoEnviado";
import { Entrar } from "./paginas/Entrar";
import { CuentaLayout } from "./paginas/cuenta/CuentaLayout";
import { MisPedidos } from "./paginas/cuenta/MisPedidos";
import { DetallePedido } from "./paginas/cuenta/DetallePedido";
import { MisDatos } from "./paginas/cuenta/MisDatos";
import { NoEncontrado } from "./paginas/NoEncontrado";
import { Denunciar } from "./paginas/catalogo/Denunciar";

// El panel se descarga aparte: quien solo compra no carga el código de la empresa
const panel = (archivo: string, componente: string) => async () => {
  const modulos = import.meta.glob("./paginas/panel/*.tsx");
  const m = (await modulos[`./paginas/panel/${archivo}.tsx`]!()) as Record<string, ComponentType>;
  return { Component: m[componente] };
};

// El sitio de Vitrina y la administración también se descargan aparte
const perezoso = (carpeta: "sitio" | "admin", archivo: string, componente: string) => async () => {
  const modulos = { sitio: import.meta.glob("./paginas/sitio/*.tsx"), admin: import.meta.glob("./paginas/admin/*.tsx") }[carpeta];
  const m = (await modulos[`./paginas/${carpeta}/${archivo}.tsx`]!()) as Record<string, ComponentType>;
  return { Component: m[componente] };
};

// Rutas con hash: GitHub Pages no reescribe rutas, así que recargar cualquier pantalla sigue funcionando
const router = createHashRouter([
  {
    element: <Raiz />,
    errorElement: <NoEncontrado />,
    children: [
      { path: "/", lazy: perezoso("sitio", "Portada", "PortadaSitio") },
      { path: "/recorrido", element: <Recorrido /> },
      { path: "/registro", lazy: perezoso("sitio", "Registro", "Registro") },
      { path: "/terminos", lazy: perezoso("sitio", "Legales", "Terminos") },
      { path: "/privacidad", lazy: perezoso("sitio", "Legales", "Privacidad") },
      { path: "/admin/entrar", lazy: perezoso("admin", "AdminLayout", "AdminEntrar") },
      {
        path: "/admin",
        lazy: perezoso("admin", "AdminLayout", "AdminLayout"),
        children: [
          { index: true, lazy: perezoso("admin", "AdminOperacion", "AdminResumen") },
          { path: "solicitudes", lazy: perezoso("admin", "AdminOperacion", "AdminSolicitudes") },
          { path: "empresas", lazy: perezoso("admin", "AdminOperacion", "AdminEmpresas") },
          { path: "empresas/:slug", lazy: perezoso("admin", "AdminOperacion", "AdminEmpresa") },
          { path: "pagos", lazy: perezoso("admin", "AdminOperacion", "AdminPagos") },
          { path: "tasas", lazy: perezoso("admin", "AdminControl", "AdminTasas") },
          { path: "denuncias", lazy: perezoso("admin", "AdminControl", "AdminDenuncias") },
          { path: "compradores", lazy: perezoso("admin", "AdminControl", "AdminCompradores") },
          { path: "planes", lazy: perezoso("admin", "AdminControl", "AdminPlanes") },
          { path: "auditoria", lazy: perezoso("admin", "AdminControl", "AdminAuditoria") },
        ],
      },
      {
        path: "/c/:slug",
        element: <CatalogoLayout />,
        children: [
          { index: true, element: <Portada /> },
          { path: "p/:id", element: <FichaProducto /> },
          { path: "pedido", element: <MiPedido /> },
          { path: "pedido/enviado/:pedidoId", element: <PedidoEnviado /> },
          { path: "denunciar", element: <Denunciar /> },
        ],
      },
      { path: "/entrar", element: <Entrar /> },
      {
        path: "/cuenta",
        element: <CuentaLayout />,
        children: [
          { index: true, element: <MisPedidos /> },
          { path: "pedidos/:id", element: <DetallePedido /> },
          { path: "datos", element: <MisDatos /> },
        ],
      },
      { path: "/panel/entrar", lazy: panel("PanelEntrar", "PanelEntrar") },
      {
        path: "/panel",
        lazy: panel("PanelLayout", "PanelLayout"),
        children: [
          { index: true, lazy: panel("PanelInicio", "PanelInicio") },
          { path: "pedidos", lazy: panel("PanelPedidos", "PanelPedidos") },
          { path: "pedidos/:id", lazy: panel("PanelPedido", "PanelPedido") },
          { path: "productos", lazy: panel("PanelProductos", "PanelProductos") },
          { path: "productos/:id", lazy: panel("EditorProducto", "EditorProducto") },
          { path: "inventario", lazy: panel("PanelInventario", "PanelInventario") },
          { path: "clientes", lazy: panel("PanelClientes", "PanelClientes") },
          { path: "categorias", lazy: panel("PanelClientes", "PanelCategorias") },
          { path: "entrega", lazy: panel("PanelAjustes", "PanelEntrega") },
          { path: "catalogo", lazy: panel("PanelAjustes", "PanelCatalogo") },
          { path: "equipo", lazy: panel("PanelCuenta", "PanelEquipo") },
          { path: "suscripcion", lazy: panel("PanelCuenta", "PanelSuscripcion") },
          { path: "seguridad", lazy: panel("PanelCuenta", "PanelSeguridad") },
          { path: "mas", lazy: panel("PanelClientes", "PanelMas") },
        ],
      },
      { path: "*", element: <NoEncontrado /> },
    ],
  },
]);

createRoot(document.getElementById("raiz")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
