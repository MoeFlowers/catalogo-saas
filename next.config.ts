import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // Paquetes nativos que no se empaquetan en el servidor
  serverExternalPackages: ["@node-rs/argon2", "pino"],
  poweredByHeader: false,
};

export default config;
