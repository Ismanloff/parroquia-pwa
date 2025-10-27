# Plan de Mejoras para APP PARRO - iOS 26 Liquid Glass PWA

**Fecha:** 27 Octubre 2025
**Versión Actual:** Next.js 16.0.0 + React 19.2.0
**Diseño:** iOS 26 Liquid Glass Lite

---

## 📊 ESTADO ACTUAL

### ✅ YA COMPLETADO

- **FASE 1:** Implementación base completa
- **FASE 2:** 7 mejoras PWA implementadas
  - Sistema de instalación (banner, modal iOS, botones)
  - Notificaciones básicas implementadas
  - Dark mode con selector sistema/claro/oscuro
  - Service Worker configurado
  - Manifest.json creado
  - Pull-to-refresh en todos los componentes
  - Caché optimizado
- **FASE 3:** Migración completa Calendar con iOS 26 Liquid Glass Lite
  - Header con colores litúrgicos
  - Tabs flotantes con glassmorphism
  - Vista semanal premium con timeline
  - Vista mensual interactiva
  - Modal sheet-style para eventos
  - Compartir y descargar eventos (.ics)
- **Validación tipografía:** Confirmado que 34px, 17px, 11px siguen estándares iOS
- **Diseño unificado:** Todos los componentes (Home, Calendar, Chat, Settings) con iOS 26 Liquid Glass Lite

### 🎯 TECNOLOGÍAS ACTUALES

- Next.js 16.0.0 con Turbopack (estable)
- React 19.2.0 (Concurrent Rendering, React Compiler)
- @ducanh2912/next-pwa para PWA
- Tailwind CSS 4 con dark mode
- dayjs para fechas
- lucide-react para iconos
- Pinecone para RAG
- OpenAI Agents SDK para chat

---

## 🔍 INVESTIGACIÓN 2025 - MEJORES PRÁCTICAS

### PWA Best Practices 2025

- **Enhanced OS Integration:** File System Access, WebAuthn, Web Payment API
- **Offline-first:** Service worker con Fetch/Cache APIs
- **Security:** HTTPS obligatorio, WebAuthn para autenticación
- **Performance:** HTTP/3, Core Web Vitals optimizados (LCP, FID, CLS)
- **Testing:** Lighthouse audits, Playwright E2E

### iOS 26 Liquid Glass Design Features

- **Material:** Translucent glass que refleja y refracta entorno
- **Animaciones:** Spring animations (duration, bounce: 0.2)
- **Interacciones:** Tab bar shrinking al scroll, 3D motion effects
- **Profundidad:** Sombras dinámicas, parallax, hover elevación
- **Cross-platform:** Mismo diseño en iOS 26, iPadOS 26, macOS Tahoe 26

### Accesibilidad WCAG 2.2 (Standard 2025)

- **Contrast ratio:** Mínimo 4.5:1 para texto regular, 3:1 para texto grande
- **Touch targets:** Mínimo 24x24 CSS pixels (nosotros usamos 44px ✅)
- **Keyboard navigation:** Todos los elementos accesibles por teclado
- **ARIA labels:** Semantic HTML + ARIA cuando sea necesario
- **Focus indicators:** Visibles y con contraste adecuado

### Church App Features 2025

- **Engagement:** Push notifications personalizadas, event RSVP
- **Community:** Prayer request boards, member directories
- **Content:** Live streaming, sermon libraries, media archives
- **Giving:** Online donations con pasarelas integradas
- **Analytics:** Engagement metrics, open rates, participation tracking

### Next.js 16 + React 19 Optimizations

- **Turbopack:** 5-10x faster Fast Refresh, 2-5x faster builds (YA ACTIVO ✅)
- **React Compiler:** Optimiza renders automáticamente, reduce useMemo/useCallback
- **Concurrent Rendering:** Default en React 19, prioriza updates
- **Server Components:** Render en servidor, reduce bundle
- **SSR Streaming:** HTML progresivo, mejor TTFB
- **Automatic Batching:** Batching extendido a promises, setTimeout, eventos

---

## 🚀 PLAN DE IMPLEMENTACIÓN

---

## 📱 FASE 4 - QUICK WINS (1-2 horas) ⭐ EMPEZAR AQUÍ

### ✅ 4.1. Manifest Mejorado

**Objetivo:** Mejorar manifest.json según PWA Best Practices 2025

**Cambios:**

```json
{
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable" // ← NUEVO: Iconos adaptables
    }
  ],
  "shortcuts": [
    // ← NUEVO: Accesos rápidos
    {
      "name": "Evangelio del día",
      "short_name": "Evangelio",
      "description": "Ver el evangelio de hoy",
      "url": "/?section=gospel",
      "icons": [{ "src": "/icons/gospel-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "Santo del día",
      "short_name": "Santo",
      "url": "/?section=saint",
      "icons": [{ "src": "/icons/saint-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "Calendario",
      "short_name": "Calendario",
      "url": "/?tab=calendar",
      "icons": [{ "src": "/icons/calendar-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "Chat IA",
      "short_name": "Chat",
      "url": "/?tab=chat",
      "icons": [{ "src": "/icons/chat-96x96.png", "sizes": "96x96" }]
    }
  ],
  "screenshots": [
    // ← NUEVO: Para tiendas de apps
    {
      "src": "/screenshots/home-narrow.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/calendar-narrow.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/home-wide.png",
      "sizes": "1024x593",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  "categories": ["lifestyle", "productivity"], // ← NUEVO: Categorías
  "iarc_rating_id": "e84b072d-71b3-4d3e-86ae-31a8ce4e53b7" // ← NUEVO: Rating
}
```

**Archivos a modificar:**

- `public/manifest.json`

**Archivos a crear:**

- `public/screenshots/home-narrow.png` (540x720px)
- `public/screenshots/calendar-narrow.png` (540x720px)
- `public/screenshots/chat-narrow.png` (540x720px)
- `public/screenshots/home-wide.png` (1024x593px)

---

### ✅ 4.2. Accesibilidad WCAG 2.2

**Objetivo:** Implementar ARIA labels, landmarks, skip navigation

**Cambios en `app/layout.tsx`:**

```tsx
<body>
  <a href="#main-content" className="sr-only focus:not-sr-only">
    Saltar al contenido principal
  </a>
  <Providers>
    <main id="main-content" role="main">
      {children}
    </main>
  </Providers>
</body>
```

**Cambios en `components/TabNavigation.tsx`:**

```tsx
<nav role="navigation" aria-label="Navegación principal">
  <button
    aria-label="Inicio - Ver evangelio y santo del día"
    aria-current={activeTab === 'home' ? 'page' : undefined}
  >
    <Home />
    <span>Inicio</span>
  </button>
  {/* ... resto de tabs */}
</nav>
```

**Cambios en todos los componentes:**

- Añadir `aria-label` a todos los botones de acción
- Añadir `role="region"` a secciones principales
- Añadir `aria-live="polite"` a zonas de actualización dinámica
- Añadir `aria-expanded` a accordions y expandibles
- Mejorar focus indicators con ring azul Liquid Glass

**Estilos focus mejorados en `globals.css`:**

```css
/* Focus indicators iOS 26 Liquid Glass */
*:focus-visible {
  outline: 3px solid #007aff;
  outline-offset: 2px;
  border-radius: 12px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.focus\:not-sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: 1rem;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

**Archivos a modificar:**

- `app/layout.tsx`
- `components/TabNavigation.tsx`
- `components/Home.tsx`
- `components/Calendar.tsx`
- `components/Chat.tsx`
- `components/Settings.tsx`
- `app/globals.css`

---

### ✅ 4.3. Iconos Faltantes

**Objetivo:** Generar todos los tamaños de iconos requeridos

**Iconos necesarios:**

- ✅ icon-192x192.png (YA EXISTE)
- ⚠️ icon-72x72.png (FALTA)
- ⚠️ icon-96x96.png (FALTA)
- ⚠️ icon-128x128.png (FALTA)
- ⚠️ icon-144x144.png (FALTA)
- ⚠️ icon-152x152.png (FALTA)
- ⚠️ icon-384x384.png (FALTA)
- ⚠️ icon-512x512.png (FALTA)

**Iconos maskable (adaptables a formas):**

- icon-192x192-maskable.png
- icon-512x512-maskable.png

**Favicons modernos:**

- favicon.ico (multi-size: 16x16, 32x32, 48x48)
- favicon.svg (vector, adapta a dark mode)

**Shortcuts icons:**

- gospel-96x96.png
- saint-96x96.png
- calendar-96x96.png
- chat-96x96.png

**Método:** Usar herramienta online o script para generar desde el 192x192 existente

- Herramienta recomendada: https://realfavicongenerator.net/
- O librería: `sharp` en Node.js

**Archivos a crear:**

- `public/icons/icon-*.png` (todos los tamaños)
- `public/icons/*-maskable.png`
- `public/favicon.ico`
- `public/favicon.svg`

---

## ✨ FASE 5 - ANIMATIONS & POLISH (2-3 horas)

### 5.1. Spring Animations Refinadas

**Objetivo:** Implementar animaciones springy según iOS 26 Liquid Glass

**Cambios en `app/globals.css`:**

```css
/* iOS 26 Spring Animations */
@keyframes spring-in {
  0% {
    transform: scale(0.9) translateY(10px);
    opacity: 0;
  }
  50% {
    transform: scale(1.02) translateY(-2px);
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes bounce-subtle {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.animate-spring-in {
  animation: spring-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.animate-bounce-subtle {
  animation: bounce-subtle 0.6s ease-in-out;
}

/* Tab bar shrinking on scroll */
.tab-bar-shrink {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tab-bar-shrink.scrolled {
  transform: scale(0.95) translateY(2px);
  opacity: 0.9;
}
```

**Implementar en componentes:**

- Cards: `animate-spring-in` al cargar
- Botones: bounce sutil en hover
- Tab navigation: shrink al hacer scroll
- Modals: slide-up con spring

**Archivos a modificar:**

- `app/globals.css`
- `components/Home.tsx`
- `components/Calendar.tsx`
- `components/TabNavigation.tsx`

---

### 5.2. Haptic Feedback

**Objetivo:** Añadir vibración sutil en interacciones importantes

**Utility function `lib/haptics.ts`:**

```typescript
export const haptics = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 30, 10]);
    }
  },
  error: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50]);
    }
  },
};
```

**Usar en:**

- Tab changes: `haptics.light()`
- Botón instalación: `haptics.medium()`
- Pull-to-refresh activado: `haptics.success()`
- Errores: `haptics.error()`
- Compartir/descargar evento: `haptics.success()`

**Archivos a crear:**

- `lib/haptics.ts`

**Archivos a modificar:**

- `components/TabNavigation.tsx`
- `components/Calendar.tsx`
- `components/Home.tsx`
- `components/install/InstallButton.tsx`

---

### 5.3. Skeleton Loaders

**Objetivo:** Loading states con shimmer effect Liquid Glass

**Component `components/ui/SkeletonLoader.tsx`:**

```tsx
export function SkeletonLoader({ type }: { type: 'card' | 'text' | 'circle' }) {
  return (
    <div
      className={`
      animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200
      dark:from-slate-800 dark:via-slate-700 dark:to-slate-800
      ${type === 'card' ? 'h-32 rounded-[28px]' : ''}
      ${type === 'text' ? 'h-4 rounded-xl' : ''}
      ${type === 'circle' ? 'w-12 h-12 rounded-full' : ''}
    `}
    />
  );
}
```

**Usar en lugar de `<Loading />`:**

- Home: Skeleton de Santo + Evangelio cards
- Calendar: Skeleton de eventos
- Chat: Skeleton de mensajes

**Archivos a crear:**

- `components/ui/SkeletonLoader.tsx`

**Archivos a modificar:**

- `components/Home.tsx`
- `components/Calendar.tsx`
- `components/Chat.tsx`

---

## 🚀 FASE 6 - PERFORMANCE (2-3 horas)

### 6.1. React Compiler

**Objetivo:** Habilitar React Compiler para optimización automática

**Cambios en `next.config.ts`:**

```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    reactCompiler: true, // ← NUEVO: Habilitar React Compiler
  },
  // ... resto config
};
```

**Beneficios:**

- Reduce necesidad de `useMemo`, `useCallback`, `memo`
- Optimiza renders automáticamente
- Usado en producción por Instagram

**Archivos a modificar:**

- `next.config.ts`

---

### 6.2. Code Splitting con Lazy Loading

**Objetivo:** Cargar componentes pesados solo cuando se necesitan

**Cambios en `app/page.tsx`:**

```tsx
import dynamic from 'next/dynamic';

// Lazy load componentes pesados
const Calendar = dynamic(
  () => import('@/components/Calendar').then((mod) => ({ default: mod.Calendar })),
  {
    loading: () => <SkeletonLoader type="card" />,
    ssr: false,
  }
);

const Chat = dynamic(() => import('@/components/Chat').then((mod) => ({ default: mod.Chat })), {
  loading: () => <SkeletonLoader type="card" />,
  ssr: false,
});

const Settings = dynamic(
  () => import('@/components/Settings').then((mod) => ({ default: mod.Settings })),
  {
    loading: () => <SkeletonLoader type="card" />,
    ssr: false,
  }
);
```

**Importar iconos específicos en lugar de destructuring:**

```typescript
// ❌ MAL
import { Calendar, Clock, MapPin, X, List } from 'lucide-react';

// ✅ BIEN
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Clock from 'lucide-react/dist/esm/icons/clock';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
```

**Archivos a modificar:**

- `app/page.tsx`
- Todos los componentes (imports de lucide-react)

---

### 6.3. Bundle Analysis

**Objetivo:** Analizar y reducir tamaño del bundle

**Instalar:**

```bash
npm install --save-dev @next/bundle-analyzer
```

**Cambios en `next.config.ts`:**

```typescript
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default bundleAnalyzer(withPWA(nextConfig));
```

**Ejecutar:**

```bash
ANALYZE=true npm run build
```

**Acciones basadas en resultados:**

- Identificar librerías grandes
- Lazy load componentes no críticos
- Eliminar dependencias no usadas
- Tree shake librerías grandes

**Archivos a modificar:**

- `next.config.ts`
- `package.json` (script analyze)

---

## 🎨 FASE 7 - UX ENHANCEMENTS (2-3 horas)

### 7.1. Empty States Ilustrados

**Objetivo:** Diseños atractivos cuando no hay contenido

**Ejemplos:**

- Calendar sin eventos: Ilustración de calendario vacío + "No tienes eventos"
- Chat vacío: Ilustración de chat + "Pregúntame sobre la parroquia"
- Notificaciones desactivadas: Ilustración de campana + CTA para activar

**Archivos a crear:**

- `components/ui/EmptyState.tsx`

**Archivos a modificar:**

- `components/Calendar.tsx`
- `components/Chat.tsx`

---

### 7.2. Error Boundaries Específicos

**Objetivo:** Manejo de errores por componente sin romper toda la app

**Component `components/ErrorBoundary.tsx` (MEJORAR EXISTENTE):**

```tsx
// Añadir botón "Reintentar" con haptic feedback
// Añadir logging a servicio externo
// Diseño Liquid Glass para error UI
```

**Envolver componentes críticos:**

```tsx
<ErrorBoundary fallback={<ErrorUI />}>
  <Calendar />
</ErrorBoundary>
```

**Archivos a modificar:**

- `components/ErrorBoundary.tsx` (ya existe, mejorar)
- `app/page.tsx` (envolver componentes)

---

### 7.3. Onboarding Tour

**Objetivo:** Tour de 4 pasos en primera visita

**Pasos:**

1. **Home:** "Aquí verás el evangelio y santo del día"
2. **Calendar:** "Consulta eventos parroquiales"
3. **Chat:** "Pregunta cualquier duda sobre la parroquia"
4. **Settings:** "Personaliza notificaciones y tema"

**Librería recomendada:** `react-joyride` o custom implementation

**Guardar en localStorage:** `onboarding_completed`

**Archivos a crear:**

- `components/Onboarding.tsx`

**Archivos a modificar:**

- `app/page.tsx`

---

## 🎁 FASE 8 - FEATURES PARROQUIALES (variable)

### 8.1. Prayer Request Board

**Objetivo:** Comunidad comparte intenciones de oración

**Features:**

- Submit prayer request (anónimo o con nombre)
- Lista de prayer requests activas
- "Orar por esto" button (incrementa contador)
- Moderación admin

**Componentes:**

- `components/PrayerBoard.tsx`
- API: `app/api/prayers/route.ts`

**Base de datos:**

- Tabla `prayer_requests` en Supabase

---

### 8.2. Event RSVP

**Objetivo:** Confirmar asistencia a eventos

**Features:**

- Botón "Confirmar asistencia" en evento
- Ver lista de asistentes
- Enviar recordatorio 1 día antes
- Analytics: % de asistencia

**Modificaciones:**

- `components/Calendar.tsx` (añadir RSVP)
- API: `app/api/calendar/rsvp/route.ts`

**Base de datos:**

- Tabla `event_attendees` en Supabase

---

### 8.3. Online Donations

**Objetivo:** Donaciones integradas en la app

**Features:**

- Montos predefinidos + custom
- Frecuencia: única, mensual, anual
- Pasarela: Stripe o local (España: Bizum, Redsys)
- Recibo fiscal automático

**Componentes:**

- `components/Donations.tsx`
- API: `app/api/donations/route.ts`

**Integración:**

- Stripe Elements
- Webhook para confirmación

---

### 8.4. Sermon Library

**Objetivo:** Archivo de homilías pasadas

**Features:**

- Lista de sermones con fecha
- Audio player integrado
- Transcripción (opcional)
- Filtrar por tema, fecha, sacerdote

**Componentes:**

- `components/Sermons.tsx`
- API: `app/api/sermons/route.ts`

**Storage:**

- Audio files en Supabase Storage o CDN

---

## 🔧 FASE 9 - DEVELOPER EXPERIENCE (1-2 horas)

### 9.1. Testing Setup

**Unit tests con Vitest:**

```bash
npm install -D vitest @testing-library/react
```

**E2E tests con Playwright:**

```bash
npm install -D @playwright/test
```

**Tests prioritarios:**

- `lib/liturgicalColors.test.ts`
- `components/Calendar.test.tsx`
- `e2e/navigation.spec.ts`

---

### 9.2. Code Quality

**ESLint config personalizada:**

```json
{
  "extends": ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

**Prettier config:**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100
}
```

**Git hooks con Husky:**

```bash
npm install -D husky lint-staged
npx husky init
```

---

## 📊 MÉTRICAS DE ÉXITO

### Performance (Lighthouse)

- **Performance:** >90
- **Accessibility:** 100 (WCAG 2.2)
- **Best Practices:** 100
- **SEO:** >90
- **PWA:** 100

### Core Web Vitals

- **LCP (Largest Contentful Paint):** <2.5s
- **FID (First Input Delay):** <100ms
- **CLS (Cumulative Layout Shift):** <0.1

### User Engagement

- **Install rate:** >10% de visitantes únicos
- **Return rate:** >50% de usuarios instalados
- **Daily active users:** Tracking con analytics
- **Feature usage:** Calendar, Chat, Donations

---

## 🎯 ROADMAP TENTATIVO

### Inmediato (Hoy/Mañana)

- ✅ **FASE 4:** Quick Wins (1-2h)

### Corto plazo (Esta semana)

- ⏳ **FASE 5:** Animations & Polish (2-3h)
- ⏳ **FASE 6:** Performance (2-3h)

### Medio plazo (Próximas 2 semanas)

- ⏳ **FASE 7:** UX Enhancements (2-3h)
- ⏳ **FASE 8:** Prayer Board + Event RSVP (4-6h)

### Largo plazo (Próximo mes)

- ⏳ **FASE 8:** Donations + Sermon Library (6-8h)
- ⏳ **FASE 9:** Testing & DevEx (2-3h)

---

## 📝 NOTAS FINALES

### Priorización recomendada

1. **Accesibilidad** (FASE 4.2) → Legal requirement + mejora UX para todos
2. **Performance** (FASE 6) → Afecta directamente a retención
3. **Animations** (FASE 5) → Polish visual, diferenciador de marca
4. **Features parroquiales** (FASE 8) → Engagement y utilidad práctica

### Consideraciones técnicas

- **React Compiler:** Requiere Next.js 16+ (YA TENEMOS ✅)
- **Service Worker:** Ya configurado, solo optimizar caché
- **iOS 26:** Diseño ya implementado, solo añadir micro-interacciones
- **WCAG 2.2:** Standard legal en 2025, prioritario

### Recursos adicionales

- [iOS 26 Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [PWA Best Practices 2025 - MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Best_practices)
- [WCAG 2.2 Guidelines](https://www.w3.org/TR/WCAG22/)
- [Next.js 16 Documentation](https://nextjs.org/docs)
- [React 19 Release Notes](https://react.dev/blog/2025/09/15/react-19)

---

**Última actualización:** 27 Octubre 2025
**Próxima revisión:** Después de completar FASE 4
