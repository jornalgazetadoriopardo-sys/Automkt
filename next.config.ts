import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O Playwright abre um navegador de verdade no servidor; não pode ser empacotado.
  serverExternalPackages: ["playwright-core"],
  output: "standalone",
  experimental: {
    // Logos e fotos chegam pelo formulário do cliente.
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
