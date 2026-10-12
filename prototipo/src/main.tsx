import { StrictMode } from "react";
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

// Rutas con hash: GitHub Pages no reescribe rutas, así que recargar cualquier pantalla sigue funcionando
const router = createHashRouter([
  {
    element: <Raiz />,
    errorElement: <NoEncontrado />,
    children: [
      { path: "/", element: <Recorrido /> },
      {
        path: "/c/:slug",
        element: <CatalogoLayout />,
        children: [
          { index: true, element: <Portada /> },
          { path: "p/:id", element: <FichaProducto /> },
          { path: "pedido", element: <MiPedido /> },
          { path: "pedido/enviado/:pedidoId", element: <PedidoEnviado /> },
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
      { path: "*", element: <NoEncontrado /> },
    ],
  },
]);

createRoot(document.getElementById("raiz")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
