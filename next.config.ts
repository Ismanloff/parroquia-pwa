import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';
import withBundleAnalyzer from '@next/bundle-analyzer';

// Serwist configuración - Sistema de actualizaciones con notificaciones
const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
});

// Bundle Analyzer - Ejecutar con: ANALYZE=true npm run build
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Turbopack deshabilitado - Serwist requiere webpack
  turbopack: undefined,
  reactCompiler: true, // React 19 Compiler - Optimiza renders automáticamente
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
};

export default bundleAnalyzer(withSerwist(nextConfig));
