import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';
// import { withSentryConfig } from '@sentry/nextjs'; // Temporarily disabled - causing Vercel build issues

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
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  async headers() {
    // Content Security Policy - Protege contra XSS, clickjacking, y otros ataques
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.vercel-insights.com https://va.vercel-scripts.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https:;
      font-src 'self' data:;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      connect-src 'self' https://api.openai.com https://api.anthropic.com https://api.voyageai.com https://*.supabase.co wss://*.supabase.co https://*.pinecone.io;
      upgrade-insecure-requests;
    `.replace(/\n/g, '').replace(/\s{2,}/g, ' ').trim();

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY' // Previene clickjacking
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff' // Previene MIME type sniffing
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin' // Protege privacidad del referrer
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' // Deshabilita APIs sensibles
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload' // Fuerza HTTPS
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on' // Performance: permite DNS prefetch
          }
        ]
      }
    ];
  },
};

// Sentry configuration options - TEMPORARILY DISABLED
// Causing Vercel build issues with missing @sentry/nextjs module
// TODO: Re-enable after fixing Sentry configuration in Vercel
/*
const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
};
*/

// Export with Bundle Analyzer only (Sentry temporarily disabled)
export default bundleAnalyzer(nextConfig);
