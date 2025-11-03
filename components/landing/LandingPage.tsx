'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from './Header';
import { Hero } from './Hero';
import { Features } from './Features';
import { Documentation } from './Documentation';
import { Pricing } from './Pricing';
import { Footer } from './Footer';

export function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Redirigir al dashboard si el usuario está autenticado
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Header />
      <Hero />
      <Features />
      <Documentation />
      <Pricing />
      <Footer />
    </div>
  );
}
