import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from '@/components/Providers';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { Onboarding } from '@/components/Onboarding';
import { UpdateBanner } from '@/components/UpdateBanner';
import { InstallBanner } from '@/components/install/InstallBanner';
import { NotificationPrompt } from '@/components/NotificationPrompt';
import { DynamicMetaTags } from '@/components/pwa/DynamicMetaTags';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Parroquia - Asistente Digital',
  description: 'Tu asistente parroquial con IA disponible 24/7',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent', // ✅ black-translucent permite que el contenido suba tras la barra (premium)
    title: 'Parroquia',
    startupImage: [
      // iPhone 15/16 Pro Max, 14 Pro Max
      {
        url: '/icons/icon-512x512.png',
        media:
          '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)',
      },
      // iPhone 15/16 Pro, 14 Pro
      {
        url: '/icons/icon-512x512.png',
        media:
          '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)',
      },
      // iPhone 13/14, 12/12 Pro
      {
        url: '/icons/icon-512x512.png',
        media:
          '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)',
      },
      // iPhone 13 mini, 12 mini, 11 Pro, XS, X
      {
        url: '/icons/icon-512x512.png',
        media:
          '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)',
      },
      // iPhone 14 Plus, 13 Pro Max, 12 Pro Max
      {
        url: '/icons/icon-512x512.png',
        media:
          '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)',
      },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-title': 'Parroquia',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // ✅ Permitir zoom (accesibilidad)
  userScalable: true,
  themeColor: '#2563eb',
  viewportFit: 'cover', // ✅ Cubrir toda la pantalla (notch de iPhone)
  interactiveWidget: 'resizes-content', // ✅ Redimensiona el layout cuando aparece el teclado (iOS)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        {/* Inline script to apply theme before first paint - prevents flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme-mode') || 'system';
                  var isDark = false;

                  if (theme === 'dark') {
                    isDark = true;
                  } else if (theme === 'system') {
                    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  }

                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-xl focus:shadow-lg"
        >
          Saltar al contenido principal
        </a>
        <Providers>
          <ToastContainer />
          <Onboarding />
          <main id="main-content" role="main">
            {children}
          </main>
          {/* Banner de actualizaci\u00f3n PWA - Muestra cuando hay nueva versi\u00f3n */}
          <UpdateBanner />
          {/* Banner de instalaci\u00f3n PWA - Invita a instalar la app */}
          <InstallBanner delay={30} position="bottom" />
          {/* Prompt de notificaciones push */}
          <NotificationPrompt />
          {/* Meta tags dinámicos para PWA */}
          <DynamicMetaTags />
        </Providers>
      </body>
    </html>
  );
}
