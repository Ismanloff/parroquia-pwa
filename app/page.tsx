'use client';

import dynamic from 'next/dynamic';

// Cargar la landing page solo en el cliente para evitar problemas de hidratación
const LandingPageClient = dynamic(
  () => import('@/components/landing').then((mod) => ({ default: mod.LandingPage })),
  { ssr: false }
);

export default function Home() {
  return <LandingPageClient />;
}
