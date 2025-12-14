# Parroquia PWA

Progressive Web App (PWA) para gestión parroquial con AI chatbot integrado.

## Stack Tecnológico

- **Next.js 16.0.0** con Turbopack
- **React 19.2.0** con React Compiler
- **TypeScript** con strict mode
- **Tailwind CSS** con diseño iOS 26 Liquid Glass Lite
- **OpenAI Agents SDK** para chatbot inteligente
- **Pinecone** para búsqueda vectorial en documentos
- **Anthropic Claude** para query expansion
- **Supabase** para autenticación y base de datos (Gospel/Saints)
- **PWA** con soporte offline

## Características

✅ **AI Chatbot** - Asistente parroquial con búsqueda RAG en documentos
✅ **Calendario** - Eventos parroquiales sincronizados con Google Calendar y festividades litúrgicas
✅ **Autenticación** - Login/Registro con Supabase
✅ **PWA** - Instalable como app nativa (iOS/Android)
✅ **Offline** - Funciona sin conexión
✅ **Push Notifications** - Notificaciones de eventos
✅ **iOS Design** - Liquid Glass design con efectos visuales avanzados

## Instalación Local

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Cuentas en: OpenAI, Pinecone, Anthropic, Supabase, Resend

### Setup

1. **Clonar el repositorio**

```bash
git clone <repo-url>
cd "APP PARRO PWA"
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env.local` con las siguientes variables:

```bash
# OpenAI API Key
OPENAI_API_KEY=tu_openai_api_key

# ChatKit Workflow ID (opcional si usas OpenAI Agents SDK)
CHATKIT_WORKFLOW_ID=wf_...

# Configuración del Agente
AGENT_NAME=Asistente Parroquial
OPENAI_AGENT_MODEL=gpt-4o-mini
OPENAI_VECTOR_STORE_ID=vs_...

# Instrucciones del agente
AGENT_INSTRUCTIONS="Eres un chatbot parroquial..."

# Google Calendar ICS URL
GOOGLE_CALENDAR_ICS_URL=https://calendar.google.com/calendar/ical/...

# Supabase (autenticación y Datos Litúrgicos)
# Proyecto: wuvlujxzwfvqbegqehsh
SUPABASE_URL=https://wuvlujxzwfvqbegqehsh.supabase.co
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Variables públicas para el cliente
NEXT_PUBLIC_SUPABASE_URL=https://wuvlujxzwfvqbegqehsh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key

# Resend (emails de autenticación)
RESEND_API_KEY=tu_resend_api_key
RESEND_FROM_EMAIL=Parroquia <noreply@tudominio.com>

# Pinecone (búsqueda vectorial)
PINECONE_API_KEY=tu_pinecone_api_key

# Anthropic (Query Expansion con Claude)
ANTHROPIC_API_KEY=tu_anthropic_api_key

# Redis (opcional - para caching)
REDIS_URL=tu_redis_url
```

4. **Ejecutar en desarrollo**

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## Scripts Disponibles

```bash
npm run dev          # Desarrollo con Turbopack
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linter ESLint
npm run lint:fix     # Fix automático de errores
npm run type-check   # Verificación de tipos TypeScript
npm test             # Tests con Vitest
```

## Deployment en Vercel

### 1. Preparación

Asegúrate de que el build local funciona correctamente:

```bash
npm run build
```

### 2. Deploy en Vercel

#### Opción A: Desde GitHub

1. Sube tu código a GitHub
2. Ve a [vercel.com](https://vercel.com)
3. Importa tu repositorio
4. Configura las variables de entorno (ver sección siguiente)
5. Deploy automático

#### Opción B: CLI de Vercel

```bash
npm i -g vercel
vercel login
vercel --prod
```

### 3. Configurar Variables de Entorno en Vercel

En el dashboard de Vercel > Settings > Environment Variables, añade todas las variables de `.env.local`:

**Variables requeridas:**

- `OPENAI_API_KEY`
- `OPENAI_VECTOR_STORE_ID`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `PINECONE_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_CALENDAR_ICS_URL`

**Variables opcionales:**

- `CHATKIT_WORKFLOW_ID`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `REDIS_URL`
- `AGENT_NAME`
- `OPENAI_AGENT_MODEL`
- `AGENT_INSTRUCTIONS`

### 4. Verificar Deployment

Una vez desplegado:

1. Prueba el chatbot AI
2. Verifica el calendario de eventos
3. Prueba autenticación (login/registro)
4. Instala la PWA en tu dispositivo
5. Verifica funcionamiento offline

## Arquitectura

```
app/
├── (tabs)/                  # Tabs principales (Home, Calendar, Chat, Profile)
├── api/                     # API Routes
│   ├── chat/               # Endpoints del chatbot
│   │   ├── message/        # Chat con OpenAI Agents
│   │   ├── message-stream/ # Streaming de respuestas
│   │   └── tools/          # Tools para el agente (Pinecone, Calendar)
│   ├── calendar/           # Eventos del calendario
│   ├── auth/               # Autenticación Supabase
│   └── admin/              # Endpoints administrativos
├── auth/                    # Páginas de auth (login, register)
components/                  # Componentes React
lib/                         # Utilidades y configuración
├── supabase.ts             # Cliente Supabase
├── dayjs.ts                # Configuración dayjs
├── haptics.ts              # Feedback háptico
└── toast.ts                # Sistema de notificaciones
public/                      # Assets estáticos
└── manifest.json           # PWA manifest
```

## Optimizaciones Implementadas

### Performance

- ✅ React 19 Compiler para optimización automática
- ✅ Turbopack para builds ultra-rápidos
- ✅ ISR (Incremental Static Regeneration) para páginas estáticas
- ✅ Code splitting automático
- ✅ Image optimization con next/image

### SEO

- ✅ Metadata dinámica en cada página
- ✅ Sitemap y robots.txt
- ✅ Open Graph tags
- ✅ Structured data

### PWA

- ✅ Service Worker para offline support
- ✅ App Manifest configurado
- ✅ Installable prompt
- ✅ Push notifications ready

### UX

- ✅ Pull-to-refresh en móvil
- ✅ Haptic feedback (iOS)
- ✅ Toast notifications
- ✅ Loading states elegantes
- ✅ Error boundaries

## Testing

```bash
# Ejecutar tests
npm test

# Tests en modo watch
npm test -- --watch

# Tests con coverage
npm test -- --coverage
```

## Troubleshooting

### Build Errors

Si el build falla en Vercel, verifica:

1. Todas las variables de entorno están configuradas
2. Las API keys son válidas
3. Los modelos de OpenAI existen y tienes acceso
4. El índice de Pinecone existe

### PWA No Instala

- Verifica que estés usando HTTPS
- Comprueba que `manifest.json` es accesible
- Revisa la consola del navegador para errores del Service Worker

### Chatbot No Responde

1. Verifica `OPENAI_API_KEY` en variables de entorno
2. Comprueba que `OPENAI_VECTOR_STORE_ID` es correcto
3. Revisa logs en Vercel Dashboard
4. Verifica límites de rate de OpenAI

## Roadmap

- [ ] Migración a React Native (70-80% código reusable)
- [ ] Multi-idioma (i18n)
- [ ] Dashboard administrativo avanzado
- [ ] Analytics de uso del chatbot
- [ ] Integración con sistemas parroquiales existentes
- [ ] Donaciones online
- [ ] Sistema de reservas para eventos

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Soporte

Para reportar bugs o solicitar features, abre un issue en GitHub.

## Licencia

[MIT License](LICENSE)

---

**Desarrollado con ❤️ para comunidades parroquiales**
