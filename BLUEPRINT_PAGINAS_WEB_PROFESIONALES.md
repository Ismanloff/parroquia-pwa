# 🚀 BLUEPRINT: PÁGINAS WEB PROFESIONALES CON NEXT.JS 16

**Fecha:** Noviembre 2025
**Versión:** 1.0
**Basado en:** Arquitectura Resply (Next.js 16 + React 19 + TailwindCSS 4)

---

## 📋 RESUMEN EJECUTIVO

Este blueprint es una **plantilla maestra** para generar sitios web profesionales modernos en minutos. Está basado en la arquitectura probada de Resply, que incluye:

- ✅ Next.js 16 con App Router
- ✅ React 19 con Server Components
- ✅ TailwindCSS 4 (utility-first)
- ✅ TypeScript estricto
- ✅ SEO optimizado
- ✅ Dark mode nativo
- ✅ Responsive design
- ✅ Performance 100/100
- ✅ Deploy automático en Vercel

---

## 🎯 PROMPT PARA CLAUDE (COPIAR Y PEGAR)

```
Eres un desarrollador web experto especializado en Next.js 16, React 19 y TailwindCSS 4.

Tu misión es crear una página web profesional moderna siguiendo estas especificaciones técnicas exactas:

## STACK TECNOLÓGICO (NO NEGOCIABLE)
- Next.js 16.0.0 (App Router)
- React 19.0.0
- TypeScript 5.3+
- TailwindCSS 4.0
- Lucide React (iconos)
- next/font (Google Fonts)
- Vercel Analytics

## ESTRUCTURA DE ARCHIVOS OBLIGATORIA

proyecto/
├── app/
│   ├── layout.tsx          # Root layout con metadata SEO
│   ├── page.tsx            # Homepage
│   ├── globals.css         # TailwindCSS imports
│   ├── [ruta]/
│   │   └── page.tsx        # Páginas adicionales
│   └── api/                # API routes si es necesario
├── components/
│   ├── ui/                 # Componentes reutilizables
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── ...
│   ├── sections/           # Secciones de landing
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── Pricing.tsx
│   │   ├── Testimonials.tsx
│   │   ├── CTA.tsx
│   │   └── Footer.tsx
│   └── layout/
│       ├── Navbar.tsx
│       └── Footer.tsx
├── lib/
│   └── utils.ts            # Utilidades (cn, etc.)
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── images/
├── styles/
│   └── globals.css
├── .env.local              # Variables de entorno
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json

## REGLAS DE CÓDIGO (CRÍTICAS)

### 1. METADATA SEO (app/layout.tsx)
```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: '[NOMBRE PROYECTO]',
    template: '%s | [NOMBRE PROYECTO]'
  },
  description: '[DESCRIPCIÓN SEO-FRIENDLY]',
  keywords: ['[KEYWORD1]', '[KEYWORD2]', ...],
  authors: [{ name: '[AUTOR]' }],
  creator: '[EMPRESA]',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://[DOMINIO]',
    title: '[TÍTULO OG]',
    description: '[DESCRIPCIÓN OG]',
    siteName: '[NOMBRE]',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: '[ALT TEXT]',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '[TÍTULO TWITTER]',
    description: '[DESCRIPCIÓN TWITTER]',
    images: ['/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}
```

### 2. ROOT LAYOUT (app/layout.tsx)
```typescript
import { Inter, Poppins } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
```

### 3. TAILWIND CONFIG (tailwind.config.ts)
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
```

### 4. GLOBALS CSS (app/globals.css)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
```

### 5. COMPONENTE BUTTON (components/ui/Button.tsx)
```typescript
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
            'border border-input bg-background hover:bg-accent': variant === 'outline',
            'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
          },
          {
            'h-9 px-3 text-sm': size === 'sm',
            'h-11 px-8 text-base': size === 'md',
            'h-14 px-12 text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
```

### 6. UTILS (lib/utils.ts)
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 7. HERO SECTION (components/sections/Hero.tsx)
```typescript
import { Button } from '@/components/ui/Button'
import { ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="text-center space-y-8 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm">
            <span className="text-primary font-medium">✨ Nuevo producto 2025</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold font-heading text-balance">
            [TÍTULO PRINCIPAL]
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              [SUBTÍTULO CON GRADIENTE]
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto text-balance">
            [DESCRIPCIÓN BREVE Y CLARA DEL VALOR]
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="group">
              Comenzar Ahora
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline">
              Ver Demo
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐⭐⭐⭐⭐</span>
              <span>4.9/5 de 1000+ usuarios</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

### 8. FEATURES SECTION (components/sections/Features.tsx)
```typescript
import { Zap, Shield, Sparkles, TrendingUp } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: '[FEATURE 1]',
    description: '[DESCRIPCIÓN DEL BENEFICIO]',
  },
  {
    icon: Shield,
    title: '[FEATURE 2]',
    description: '[DESCRIPCIÓN DEL BENEFICIO]',
  },
  {
    icon: Sparkles,
    title: '[FEATURE 3]',
    description: '[DESCRIPCIÓN DEL BENEFICIO]',
  },
  {
    icon: TrendingUp,
    title: '[FEATURE 4]',
    description: '[DESCRIPCIÓN DEL BENEFICIO]',
  },
]

export function Features() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-heading">
            [TÍTULO DE LA SECCIÓN]
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            [SUBTÍTULO EXPLICATIVO]
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="group p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
```

### 9. NAVBAR (components/layout/Navbar.tsx)
```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const navItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Características', href: '#features' },
  { label: 'Precios', href: '#pricing' },
  { label: 'Contacto', href: '#contact' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold font-heading bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              [LOGO]
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-foreground/80 hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <Button>Comenzar</Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden"
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block py-2 text-foreground/80"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Button className="w-full">Comenzar</Button>
          </div>
        )}
      </div>
    </nav>
  )
}
```

### 10. PACKAGE.JSON
```json
{
  "name": "[nombre-proyecto]",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5",
    "tailwindcss": "^4.0.0",
    "postcss": "^8",
    "autoprefixer": "^10"
  }
}
```

## PATRONES DE DISEÑO OBLIGATORIOS

### 1. Spacing System
- Usa múltiplos de 4: 4, 8, 12, 16, 24, 32, 48, 64, 96
- Padding: `p-4`, `p-8`, `py-24`, etc.
- Gaps: `gap-4`, `gap-8`, `gap-12`

### 2. Typography Scale
- H1: `text-5xl md:text-7xl` (48-72px)
- H2: `text-4xl md:text-5xl` (36-48px)
- H3: `text-3xl md:text-4xl` (30-36px)
- Body: `text-base md:text-lg` (16-18px)
- Small: `text-sm` (14px)

### 3. Color Usage
- Primary: CTAs, links, highlights
- Secondary: Accents, gradients
- Muted: Secondary text, borders
- Destructive: Errors, warnings

### 4. Animations
- Fade in: `animate-fade-in`
- Slide up: `animate-slide-up`
- Hover: `hover:scale-105 transition-transform`
- Focus: `focus-visible:ring-2 focus-visible:ring-primary`

### 5. Responsive Breakpoints
```
sm: 640px   (móvil grande)
md: 768px   (tablet)
lg: 1024px  (laptop)
xl: 1280px  (desktop)
2xl: 1536px (desktop grande)
```

## OPTIMIZACIONES OBLIGATORIAS

### 1. Performance
- Usar Server Components por defecto
- 'use client' solo cuando necesario (interactividad, hooks)
- Lazy loading de imágenes: `loading="lazy"`
- next/font para fonts optimizadas

### 2. SEO
- Metadata en cada página
- Semantic HTML (header, nav, main, section, article, footer)
- Alt text en todas las imágenes
- Structured data (JSON-LD) cuando aplique

### 3. Accessibility
- Contraste mínimo WCAG AA (4.5:1)
- Focus visible en todos los elementos interactivos
- aria-labels donde sea necesario
- Navegación por teclado funcional

### 4. Mobile-First
- Diseñar para móvil primero
- Touch targets mínimo 44x44px
- Evitar hover-only interactions
- Gestos táctiles intuitivos

## ESTRUCTURA DE HOMEPAGE TÍPICA

1. **Hero Section**
   - Título impactante
   - Subtítulo explicativo
   - 2 CTAs (primario + secundario)
   - Social proof (ratings, logos)

2. **Features Section**
   - 3-6 features principales
   - Iconos + título + descripción
   - Grid responsive

3. **How it Works**
   - 3-4 pasos
   - Visual + texto
   - Timeline o cards

4. **Social Proof**
   - Testimonials
   - Logos de clientes
   - Estadísticas

5. **Pricing**
   - 3 planes (básico, pro, enterprise)
   - Tabla comparativa
   - FAQ integrado

6. **CTA Final**
   - Hero secundario
   - Un solo CTA claro
   - Urgencia/escasez

7. **Footer**
   - Links importantes
   - Social media
   - Legal (privacidad, términos)

## COMANDOS DE INSTALACIÓN

```bash
# Crear proyecto
npx create-next-app@latest mi-proyecto --typescript --tailwind --app --use-npm

# Instalar dependencias
npm install lucide-react clsx tailwind-merge

# Desarrollo
npm run dev

# Build producción
npm run build
npm start

# Deploy Vercel
vercel --prod
```

## CHECKLIST FINAL

Antes de entregar, verificar:

- [ ] TypeScript sin errores
- [ ] ESLint sin warnings críticos
- [ ] Todas las imágenes tienen alt text
- [ ] Metadata SEO completa
- [ ] Responsive en mobile/tablet/desktop
- [ ] Dark mode funcional
- [ ] Performance >90 en Lighthouse
- [ ] Accesibilidad >90 en Lighthouse
- [ ] Links funcionan correctamente
- [ ] Formularios con validación
- [ ] Loading states en acciones async
- [ ] Error boundaries configurados
- [ ] Favicon y OG images
- [ ] Google Analytics (si aplica)
- [ ] GDPR compliance (si aplica)

---

AHORA, GENERA EL SITIO WEB COMPLETO SIGUIENDO ESTAS ESPECIFICACIONES.
```

---

## 💡 CASOS DE USO ESPECÍFICOS

### Landing Page SaaS
```
Contexto: Plataforma de [DESCRIPCIÓN]
Audiencia: [TARGET AUDIENCE]
Objetivo: Conversión a trial/demo
Secciones:
- Hero con demo video
- Beneficios (3 columnas)
- Features detallados (6 features)
- Comparación con competencia
- Testimonials (carousel)
- Pricing (3 tiers)
- FAQ (10 preguntas)
- CTA agresivo
```

### Portfolio Profesional
```
Contexto: Portfolio de [PROFESIÓN]
Audiencia: Recruiters/clientes potenciales
Objetivo: Mostrar trabajo y generar contacto
Secciones:
- Hero con foto profesional
- About me
- Skills (grid con iconos)
- Projects (cards con imágenes)
- Experience (timeline)
- Contact form
```

### E-commerce Landing
```
Contexto: Producto [TIPO]
Audiencia: Consumidores [PERFIL]
Objetivo: Ventas directas
Secciones:
- Hero con producto hero
- Beneficios principales
- Galería de productos
- Testimonials con fotos
- Trust badges
- Pricing/Add to cart
- Shipping info
```

### Blog/Contenido
```
Contexto: Blog sobre [TEMA]
Audiencia: [READERS]
Objetivo: Engagement y newsletter signups
Secciones:
- Hero con featured article
- Categories grid
- Recent posts (list)
- Newsletter signup
- Sidebar con popular posts
- Footer con social links
```

---

## 📦 COMPONENTES PREMIUM INCLUIDOS

### Accordion
```typescript
// components/ui/Accordion.tsx
'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface AccordionItem {
  question: string
  answer: string
}

export function Accordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="border border-border rounded-lg overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-accent transition-colors"
          >
            <span className="font-medium">{item.question}</span>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${
                openIndex === index ? 'rotate-180' : ''
              }`}
            />
          </button>
          {openIndex === index && (
            <div className="p-4 pt-0 text-muted-foreground">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

### Card con Hover Effect
```typescript
// components/ui/Card.tsx
export function Card({
  title,
  description,
  icon
}: {
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="group relative p-6 border border-border rounded-xl bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
```

### Pricing Card
```typescript
// components/sections/PricingCard.tsx
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface PricingCardProps {
  name: string
  price: string
  features: string[]
  popular?: boolean
}

export function PricingCard({ name, price, features, popular }: PricingCardProps) {
  return (
    <div className={`relative p-8 rounded-2xl border ${
      popular
        ? 'border-primary shadow-lg scale-105'
        : 'border-border'
    }`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
          Más Popular
        </div>
      )}

      <div className="text-center space-y-4">
        <h3 className="text-2xl font-bold">{name}</h3>
        <div>
          <span className="text-5xl font-bold">{price}</span>
          <span className="text-muted-foreground">/mes</span>
        </div>
      </div>

      <ul className="space-y-3 my-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        variant={popular ? 'default' : 'outline'}
        className="w-full"
      >
        Comenzar Ahora
      </Button>
    </div>
  )
}
```

---

## 🎨 SISTEMA DE DISEÑO COMPLETO

### Paleta de Colores Profesionales

```typescript
// tailwind.config.ts - Opciones de color

// Opción 1: Tech/SaaS (Blue-Purple)
primary: {
  500: '#667eea',
  600: '#5568d3',
}
secondary: {
  500: '#764ba2',
  600: '#63408a',
}

// Opción 2: Finance (Green-Teal)
primary: {
  500: '#10b981',
  600: '#059669',
}
secondary: {
  500: '#14b8a6',
  600: '#0d9488',
}

// Opción 3: Creative (Orange-Pink)
primary: {
  500: '#f59e0b',
  600: '#d97706',
}
secondary: {
  500: '#ec4899',
  600: '#db2777',
}

// Opción 4: Corporate (Navy-Gold)
primary: {
  500: '#1e40af',
  600: '#1e3a8a',
}
secondary: {
  500: '#f59e0b',
  600: '#d97706',
}
```

---

## 🚀 PROMPTS ESPECÍFICOS LISTOS PARA USAR

### Prompt 1: Landing Page para SaaS
```
Usando el BLUEPRINT_PAGINAS_WEB_PROFESIONALES.md, crea una landing page para:

Nombre: [TU PRODUCTO]
Descripción: [DESCRIPCIÓN DE 1 LÍNEA]
Target: [AUDIENCIA]
Valor único: [TU UVP]

Genera:
1. Homepage con hero + 6 features + pricing (3 planes) + testimonials
2. Paleta de colores: Tech/SaaS (Blue-Purple)
3. Incluir formulario de contacto funcional
4. Agregar sección "How it Works" con 3 pasos
5. Footer con links a redes sociales

Requisitos extra:
- Animaciones en scroll
- CTA sticky en mobile
- Dark mode toggle
```

### Prompt 2: Portfolio Profesional
```
Usando el BLUEPRINT_PAGINAS_WEB_PROFESIONALES.md, crea un portfolio para:

Nombre: [TU NOMBRE]
Profesión: [TU PROFESIÓN]
Especialización: [TU NICHE]

Genera:
1. Homepage con hero + about + skills + projects grid
2. Página de proyectos individuales (usar dynamic routes)
3. Formulario de contacto con validación
4. Integración con LinkedIn y GitHub
5. Blog posts (3 artículos de ejemplo)

Requisitos extra:
- Lightbox para imágenes de proyectos
- Scroll progress bar
- Cursor personalizado
- Smooth scrolling
```

### Prompt 3: E-commerce Landing
```
Usando el BLUEPRINT_PAGINAS_WEB_PROFESIONALES.md, crea un e-commerce para:

Producto: [TU PRODUCTO]
Precio: [RANGO DE PRECIO]
Target: [AUDIENCIA]

Genera:
1. Hero con carousel de productos
2. Features/beneficios del producto
3. Testimonials con star ratings
4. Sección de FAQ
5. CTA para compra directa
6. Trust badges (secure payment, free shipping, etc.)

Requisitos extra:
- Product gallery con zoom
- Size/color selector
- Add to cart animation
- Stock counter con urgencia
```

---

## 📱 RESPONSIVE DESIGN PATTERNS

### Mobile Navigation
```typescript
// Hamburger menu con animación suave
const [isOpen, setIsOpen] = useState(false)

return (
  <>
    <button onClick={() => setIsOpen(!isOpen)}>
      <div className={`w-6 h-0.5 bg-foreground transition-all ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
      <div className={`w-6 h-0.5 bg-foreground my-1 transition-all ${isOpen ? 'opacity-0' : ''}`} />
      <div className={`w-6 h-0.5 bg-foreground transition-all ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
    </button>

    <div className={`absolute top-16 inset-x-0 bg-background border-b transition-all ${
      isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
    }`}>
      {/* Menu items */}
    </div>
  </>
)
```

### Responsive Grid Patterns
```typescript
// 1 col móvil, 2 col tablet, 3 col desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// 1 col móvil, 2 col tablet, 4 col desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

// Sidebar layout (responsive)
<div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
```

---

## ⚡ PERFORMANCE TIPS

### Image Optimization
```typescript
import Image from 'next/image'

// Siempre usar next/image
<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority // Para hero images
  placeholder="blur" // Para mejor UX
  blurDataURL="data:image/jpeg..." // Placeholder mientras carga
/>
```

### Font Loading
```typescript
// Preload fonts críticas
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Evita FOIT
  preload: true,
})
```

### Code Splitting
```typescript
// Lazy load componentes pesados
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <Spinner />,
  ssr: false, // Deshabilitar SSR si no es necesario
})
```

---

## 🎯 CONVERSION OPTIMIZATION

### CTAs Efectivos
```typescript
// Patrón de CTA con urgencia
<Button className="relative overflow-hidden group">
  <span className="relative z-10">Comenzar Prueba Gratis</span>
  <div className="absolute inset-0 bg-primary/80 -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
</Button>

// Beneficios bajo CTA
<div className="text-sm text-muted-foreground mt-2">
  ✓ Sin tarjeta de crédito
  ✓ Cancela cuando quieras
  ✓ 14 días gratis
</div>
```

### Social Proof
```typescript
// Trust badges
<div className="flex items-center gap-8 justify-center opacity-60">
  <Image src="/secure.svg" width={100} height={30} alt="Secure" />
  <Image src="/ssl.svg" width={100} height={30} alt="SSL" />
  <Image src="/money-back.svg" width={100} height={30} alt="Money back" />
</div>

// Testimonial card
<div className="p-6 border rounded-lg">
  <div className="flex items-center gap-4 mb-4">
    <Image src="/avatar.jpg" width={48} height={48} className="rounded-full" />
    <div>
      <div className="font-semibold">John Doe</div>
      <div className="text-sm text-muted-foreground">CEO, Company</div>
    </div>
  </div>
  <p className="text-muted-foreground">"Amazing product..."</p>
  <div className="flex gap-1 mt-4">
    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
  </div>
</div>
```

---

## 🔒 SEGURIDAD Y PRIVACIDAD

### GDPR Banner
```typescript
'use client'
import { useState, useEffect } from 'react'

export function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const accepted = localStorage.getItem('cookies-accepted')
    if (!accepted) setShow(true)
  }, [])

  const accept = () => {
    localStorage.setItem('cookies-accepted', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 inset-x-0 p-4 bg-background border-t z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <p className="text-sm">
          Usamos cookies para mejorar tu experiencia.{' '}
          <Link href="/privacy" className="underline">
            Más información
          </Link>
        </p>
        <Button onClick={accept} size="sm">
          Aceptar
        </Button>
      </div>
    </div>
  )
}
```

---

## 📊 ANALYTICS INTEGRATION

### Google Analytics 4
```typescript
// app/layout.tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

---

## ✅ DEPLOYMENT CHECKLIST

Antes de hacer deploy:

```bash
# 1. Build localmente
npm run build

# 2. Verificar errores TypeScript
npx tsc --noEmit

# 3. Verificar ESLint
npm run lint

# 4. Optimizar imágenes
# Usar herramientas como Squoosh o TinyPNG

# 5. Verificar environment variables
# Crear .env.production

# 6. Deploy a Vercel
vercel --prod

# 7. Post-deploy checks
# - Lighthouse audit (Performance, SEO, Accessibility)
# - Mobile responsiveness testing
# - Browser compatibility (Chrome, Safari, Firefox)
# - Forms functionality
# - Links validity
```

---

## 🎓 RECURSOS ADICIONALES

### Documentación Oficial
- Next.js: https://nextjs.org/docs
- React: https://react.dev
- TailwindCSS: https://tailwindcss.com/docs
- TypeScript: https://www.typescriptlang.org/docs

### Herramientas Recomendadas
- **Diseño**: Figma, Adobe XD
- **Iconos**: Lucide, Heroicons, React Icons
- **Imágenes**: Unsplash, Pexels
- **Fonts**: Google Fonts, Font Awesome
- **Colors**: Coolors.co, Tailwind Shades
- **SEO**: Ahrefs, SEMrush
- **Performance**: Lighthouse, PageSpeed Insights
- **Testing**: Playwright, Cypress

### Inspiración
- **Awwwards**: awwwards.com
- **Dribbble**: dribbble.com
- **Behance**: behance.net
- **Land-book**: land-book.com
- **SaaS Landing Pages**: saaslandingpage.com

---

## 💬 SOPORTE

Si tienes preguntas o necesitas customizaciones específicas:

1. **Consulta la documentación**: Revisa este blueprint completo
2. **Usa el prompt base**: Copia el prompt principal y ajusta según necesites
3. **Itera con Claude**: Pide cambios específicos paso a paso
4. **Usa Cursor**: Para desarrollo más rápido con AI pair programming

---

**🎉 ¡LISTO PARA CREAR PÁGINAS WEB PROFESIONALES EN MINUTOS!**

**Copia el prompt principal, reemplaza los placeholders, y deja que Claude genere tu sitio completo.**
