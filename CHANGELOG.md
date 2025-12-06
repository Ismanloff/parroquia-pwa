# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Plan de mejoras para testing ([PLAN_MEJORAS_TESTING.md](PLAN_MEJORAS_TESTING.md))
- Plan de mejoras para documentación ([PLAN_MEJORAS_DOCUMENTACION.md](PLAN_MEJORAS_DOCUMENTACION.md))
- Guía de contribución completa ([CONTRIBUTING.md](CONTRIBUTING.md))
- Helper function `searchPinecone()` para facilitar testing

### Changed
- Actualizado @types/jest a versión 30.0.0

### Fixed
- Script `test-real-queries.ts` corregido para usar API correcta
- Tipos TypeScript en tests con @types/jest

### Removed
- Archivos de respaldo innecesarios (*.bak, route-agents-sdk-backup.ts)
- Agregado *.bak a .gitignore para prevenir futuros archivos de respaldo

## [1.0.0] - 2025-10-26

### Added
- **PWA Completa**: Progressive Web App funcional con todas las características
  - Service Worker con estrategia de cache inteligente
  - Manifest.json configurado
  - 10 tamaños de iconos (72px - 512px)
  - Componente InstallPWA con banner de instalación
  - Detección de instalación y modo standalone
  - Página offline amigable
  - Script de generación automática de iconos
- Configuración web.bundler: "metro" para build estático
- Configuración web.output: "static" para deployment

### Changed
- Actualizado Expo de ^54.0.0 a 54.0.20
- Actualizado React Native de 0.81.4 a 0.81.5
- Actualizado múltiples paquetes de Expo a últimas versiones
- Agregado sharp ^0.34.4 para procesamiento de imágenes PWA

### Fixed
- Configuración de Babel para incluir @openai/chatkit-react
- Firebase analytics deshabilitado en web

## [0.9.0] - 2025-10-22

### Added
- **Sistema RAG Avanzado V2**:
  - Query Expansion con Claude Haiku 4.5 (3 variaciones por query)
  - Reciprocal Rank Fusion (RRF) para combinar resultados
  - Intelligent Chunking V2 para mejores embeddings
  - Optimización condicional basada en longitud de query (< 30 chars)
  - Pre-filtering conversacional (evita RAG para saludos/gracias)
- Conversational Rewriting para preguntas de seguimiento
- Indicadores de progreso "Buscando datos..." y "Escribiendo..."
- Endpoint de diagnóstico para verificar threshold en producción

### Changed
- Query Expansion migrado de GPT-4o-mini a Claude Haiku 4.5 (más rápido)
- Conversational Rewriting usa Claude Haiku 4.5
- Optimización condicional: queries >= 30 chars skip expansion
- Threshold de relevancia Pinecone ajustado de 70% a 35%

### Performance
- Queries cortas (< 30 chars): ~2s con Query Expansion + RRF
- Queries largas (>= 30 chars): ~1.5s sin expansion (más rápido)
- Streaming SSE reduce latencia percibida en 70-80%

### Fixed
- Simplificadas respuestas de Pinecone sin metadata repetitiva
- Fortalecer prompt para forzar uso de search_parish_info
- Ajustado threshold y límite de contenido para mejorar búsquedas
- Quick Actions restringidas solo a preguntas explícitas de inscripción

## [0.8.0] - 2025-10-19

### Added
- **Sistema de Cache Multi-nivel**:
  - Memory Cache para 43 FAQs frecuentes (0ms latencia)
  - Semantic Cache con Redis (1h TTL)
  - Upstash Redis KV integration
- Content Moderation con OpenAI Moderation API
- Rate limiting para protección de APIs
- Circuit breaker para servicios externos
- Debug logger endpoint (`/api/debug/logger`)

### Changed
- Migración de ChatGPT API a OpenAI Agents SDK (@openai/agents)
- Timeout aumentado a 60s para /api/chat/message-stream
- Timeout de 15s para /api/chat/quick

### Fixed
- Convertido pineconeTool al formato correcto del SDK @openai/agents
- Endpoint de test de Pinecone para producción

## [0.7.0] - 2025-10-17

### Added
- **Dark Mode** completo en toda la app
  - Context API para gestión de tema
  - Soporte automático de tema del sistema
  - Persistencia de preferencia en AsyncStorage
  - Animaciones suaves de transición
- Sistema de logging estructurado
  - StructuredLogger en backend
  - useDebugLogger hook en frontend
  - Dashboard de logs en tiempo real
- Animaciones mejoradas con react-native-reanimated
- Tests para useDebugLogger

### Changed
- Rediseño de UI siguiendo Apple Human Interface Guidelines
- Mejoras en accesibilidad
- Optimización de rendimiento de animaciones

### Documentation
- Agregado DARK_MODE_IMPLEMENTADO.md
- Agregado ANIMACIONES_IMPLEMENTADAS.md
- Agregado TEMA_ARQUITECTURA_CORREGIDA.md

## [0.6.0] - 2025-10-15

### Added
- **Autenticación Completa**:
  - Login/Registro con Supabase
  - Reset de password
  - JWT tokens con auto-refresh
  - Row Level Security (RLS) en Supabase
  - AsyncStorage para persistencia de tokens
- Screens de autenticación:
  - LoginScreen
  - RegisterScreen
  - ForgotPasswordScreen
- AuthContext para gestión de estado de auth
- Tests de seguridad

### Documentation
- AUTENTICACION.md con guía completa
- MEJORAS_SEGURIDAD_TESTING.md

## [0.5.0] - 2025-10-14

### Added
- **Backend con Next.js 15**:
  - API Routes en /backend/app/api/
  - Deploy en Vercel
  - Edge Runtime para mejor performance
- **Integración con Pinecone**:
  - Vector database con 71 documentos
  - Modelo text-embedding-3-large (3072 dims)
  - Metadata enriquecida (categoría pastoral, tipo documento)
  - 24 PDFs + 47 MD chunks vectorizados
- **AI Tools**:
  - pineconeTool: Búsqueda en documentos parroquiales
  - calendarTool: Integración con Google Calendar
  - resourcesTool: Búsqueda de recursos parroquiales
- Scripts de backend:
  - upload-intelligent-to-pinecone.ts
  - clean-pinecone.ts
  - check-pinecone-stats.ts
- **Google Calendar Integration**:
  - ICAL parsing
  - Cache de 5 minutos
  - Eventos con fechas específicas

### Documentation
- DEPLOY_BACKEND.md
- PINECONE_DEPLOYMENT.md
- backend/CONFIGURACION.md
- backend/MIGRATION_SUMMARY.md

## [0.4.0] - 2025-10-10

### Added
- **Chat Funcional Completo**:
  - Componentes: MessageBubble, ChatInput, MessageList
  - Hook useChat con Zustand store
  - Streaming SSE support
  - Historial persistido en AsyncStorage
  - Manejo de errores con boundaries
  - QuickActionButtons para acciones comunes
- **Componentes UI**:
  - Button, Card, Input, Loading, EmptyState
  - Animaciones con expo-blur
  - Theming support
- Hook useStreamingChat para SSE
- Hook useSendMessage con React Query
- Hook useQuickDetector (50+ test cases)

### Changed
- Migración de REST a SSE streaming
- Optimistic updates en UI

### Tests
- chatStore.test.ts
- useQuickDetector.test.ts (50+ casos)
- useDebugLogger.test.ts

## [0.3.0] - 2025-09-28

### Added
- **Navegación por Tabs**:
  - HomeScreen con contenido diario
  - CalendarScreen con react-native-calendars
  - ChatScreen (placeholder)
  - SettingsScreen con perfil y preferencias
- Hook useDailyContent para saint/gospel del día
- Integración con React Query para server state
- Tab icons con Lucide React Native

### Changed
- Setup de Expo Router para navegación
- Layout de tabs configurado

## [0.2.0] - 2025-09-20

### Added
- TypeScript strict mode configurado
- ESLint con config expo
- Jest para testing
- Tailwind CSS con NativeWind
- Prettier para formateo
- Estructura de carpetas:
  - /app - Screens (Expo Router)
  - /components - Componentes reutilizables
  - /hooks - Custom hooks
  - /constants - Configuración
  - /types - TypeScript types
  - /stores - Zustand stores
  - /contexts - React contexts

### Documentation
- README.md actualizado
- SETUP.md con guía detallada
- TESTING.md

## [0.1.0] - 2025-09-15

### Added
- Setup inicial del proyecto con Expo 54
- Configuración básica de React Native 0.81
- Package.json con scripts básicos
- .gitignore configurado
- Variables de entorno (.env.example)
- Expo Router setup inicial
- Assets básicos (icon, splash screen)

### Configuration
- TypeScript 5.9.2
- Node.js 20+
- npm 10+
- Expo SDK 54

---

## Notas de Versiones

### Estrategia de Versioning

Este proyecto usa Semantic Versioning (SemVer):

- **MAJOR** (1.0.0): Cambios incompatibles de API
- **MINOR** (0.1.0): Nueva funcionalidad compatible
- **PATCH** (0.0.1): Bug fixes compatibles

### Breaking Changes

#### v1.0.0
- Ninguno (primera versión estable)

#### v0.8.0
- Cambio de ChatGPT API a OpenAI Agents SDK
  - Migración: Actualizar imports de `openai` a `@openai/agents`
  - Los tools ahora usan formato del SDK

### Deprecations

- **v0.9.0**: `useQuickDetector` hook deprecado (detección ahora en backend)
  - Reemplazar con llamada a `/api/chat/detect`
  - Hook se mantendrá hasta v2.0.0

---

## Contributors

Agradecimientos a todos los que han contribuido a este proyecto.

Para contribuir, ver [CONTRIBUTING.md](CONTRIBUTING.md).

---

**Última actualización**: 8 de noviembre de 2025

[Unreleased]: https://github.com/USER/REPO/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/USER/REPO/compare/v0.9.0...v1.0.0
[0.9.0]: https://github.com/USER/REPO/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/USER/REPO/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/USER/REPO/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/USER/REPO/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/USER/REPO/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/USER/REPO/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/USER/REPO/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/USER/REPO/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/USER/REPO/releases/tag/v0.1.0
