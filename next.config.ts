import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Sin el botón flotante de Next en desarrollo (tapa la interfaz en las grabaciones).
  devIndicators: false,
};

export default nextConfig;
