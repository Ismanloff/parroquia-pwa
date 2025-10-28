import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from '@/components/Providers';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { Onboarding } from '@/components/Onboarding';
import { UpdateBanner } from '@/components/UpdateBanner';
import { InstallBanner } from '@/components/install/InstallBanner';
import { NotificationPrompt } from '@/components/NotificationPrompt';
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
    statusBarStyle: 'default', // ✅ default = barra de estado normal sin translúcido
    title: 'Parroquia',
    startupImage: [
      {
        url: '/icons/icon-512x512.png',
        media:
          '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)',
      },
    ],
  },
  other: {
    // ✅ iOS: Forzar modo app nativa
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
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
        </Providers>
      </body>
    </html>
  );
}
