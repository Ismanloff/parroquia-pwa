import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';

// Bundle Analyzer - Ejecutar con: ANALYZE=true npm run build
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  reactCompiler: true, // React 19 Compiler - Optimiza renders automáticamente
  typescript: {
    // TODO: Remove ignoreBuildErrors once all Supabase types are properly generated
    // For now, basic types are in types/database.ts
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: false, // Re-enabled
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
};

export default bundleAnalyzer(nextConfig);
