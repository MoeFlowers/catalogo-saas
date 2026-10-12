import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base relativa: el boceto se publica en GitHub Pages bajo /catalogo-saas/ y usa rutas con hash
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
});
