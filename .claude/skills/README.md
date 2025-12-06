# Claude Skills para App de Parroquia

## 📚 Skills Disponibles

### 1. **react-native-standards/**
Estándares de código para React Native 0.81.4 + Expo Router + NativeWind.

**Usa este skill para:**
- Crear nuevos componentes y pantallas
- Mantener consistencia en naming y estructura
- Optimizar re-renders
- Implementar patrones de hooks

### 2. **supabase-integration/**
Patrones para trabajar con Supabase (autenticación + base de datos).

**Usa este skill para:**
- Configurar autenticación con sesión persistente
- Realizar queries optimizadas
- Manejar errores de Supabase
- Implementar RLS policies
- Generar tipos TypeScript desde DB

### 3. **openai-chatbot/**
Arquitectura dual de chatbot (Quick + Full) con caché semántico.

**Usa este skill para:**
- Implementar endpoints de chat
- Configurar Memory Cache (43 FAQs)
- Configurar Redis Cache (semántico)
- Añadir tools al agente OpenAI
- Implementar streaming de respuestas

### 4. **google-calendar-integration/**
Integración con Google Calendar API para eventos parroquiales.

**Usa este skill para:**
- Configurar Calendar Tool para el chatbot
- Mostrar eventos en calendario visual
- Sincronizar eventos públicos
- Manejar zonas horarias
- Cachear eventos eficientemente

### 5. **app-architecture/**
Arquitectura específica del proyecto con Expo Router y file-based routing.

**Usa este skill para:**
- Entender la estructura de carpetas
- Decidir dónde colocar nuevo código
- Seguir patrones de navegación
- Gestionar estado (Zustand + React Query + Context)
- Onboarding de desarrolladores

### 6. **testing-debugging/**
Testing con Jest + Testing Library y estrategias de debugging.

**Usa este skill para:**
- Escribir tests de componentes
- Testear hooks personalizados
- Configurar mocks de Supabase/Expo
- Debugging con structured logging
- Implementar error boundaries

### 7. **performance-optimization/**
Optimizaciones de rendimiento con caché dual y React Query.

**Usa este skill para:**
- Optimizar re-renders con React.memo
- Configurar React Query óptimamente
- Implementar Memory Cache + Redis Cache
- Optimizar FlatList
- Reducir bundle size

### 8. **skill-creator-parroquial/**
Meta-skill para crear nuevos skills para apps similares.

**Usa este skill para:**
- Crear skills para nuevas features
- Adaptar estos skills para otras parroquias
- Documentar patrones únicos
- Mantener y versionar skills

---

## 🚀 Cómo Usar los Skills

### En Claude Code (CLI)
```bash
# Los skills se cargan automáticamente desde .claude/skills/
claude "mejora el componente SantoCard siguiendo react-native-standards"
claude "implementa autenticación siguiendo supabase-integration"
```

### En Chat Web de Claude
```
"Siguiendo el skill react-native-standards, crea un nuevo componente de EventCard"
"Usando supabase-integration, implementa un hook para eventos del usuario"
```

---

## 📋 Quick Reference

### Stack del Proyecto
- **Frontend:** React Native 0.81.4, Expo 54, Expo Router 6
- **Styling:** NativeWind 4.1.23 (Tailwind)
- **State:** Zustand 5 + React Query 5
- **Backend:** Next.js con API Routes
- **DB:** Supabase (PostgreSQL + Auth)
- **AI:** OpenAI SDK + Agentes con tools
- **Cache:** Memory (43 FAQs) + Redis Cloud

### Estructura de la App
```
app/
├── (auth)/          # Login, Register, Forgot Password
└── (tabs)/          # Home, Chat, Calendar, Settings

components/
├── chat/            # MessageBubble, ChatInput, etc.
├── ui/              # Button, Card, Input, Loading
└── [feature]/       # Componentes por feature

hooks/
├── useChat.ts       # Chat state (Zustand)
├── useSendMessage.ts # Chat mutation (React Query)
├── useDailyContent.ts # Santos + Evangelios
└── useCalendarEvents.ts # Eventos

stores/
└── chatStore.ts     # Zustand con AsyncStorage

contexts/
├── AuthContext.tsx  # Autenticación global
└── ThemeContext.tsx # Tema dark/light
```

### Comandos Rápidos
```bash
# Development
npm start                # Expo dev server
npm run ios              # iOS simulator
npm run android          # Android emulator

# Testing
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Backend
cd backend && npm run dev # Next.js dev server
```

---

## 🎯 Casos de Uso Comunes

### "Quiero crear un nuevo componente"
1. Lee `react-native-standards/` para estructura y naming
2. Usa NativeWind para estilos (NO StyleSheet)
3. Tipado TypeScript estricto
4. SafeAreaView de `react-native-safe-area-context`
5. Lucide icons

### "Quiero hacer una query a Supabase"
1. Lee `supabase-integration/` para patrones
2. Usa React Query con `useQuery`
3. Configura `staleTime` y `gcTime` apropiados
4. Maneja errores con helper `getSupabaseErrorMessage`
5. Tipos desde `@/types/database`

### "Quiero añadir una feature al chatbot"
1. Lee `openai-chatbot/` para arquitectura dual
2. Quick endpoint para FAQs simples
3. Full endpoint para queries complejas
4. Añade FAQ a Memory Cache si es común
5. Crea tool si necesitas integración externa

### "Quiero optimizar performance"
1. Lee `performance-optimization/` para estrategias
2. React.memo para componentes en listas
3. useCallback para funciones en props
4. useMemo para cálculos costosos
5. FlatList con `windowSize` y `getItemLayout`

---

## 🔧 Mantenimiento

### Actualizar Skills
Cuando cambie una dependencia mayor o descubras un mejor patrón:

1. Abre el SKILL.md correspondiente
2. Actualiza la sección **Stack** con nuevas versiones
3. Añade entrada en **Changelog** (si existe)
4. Actualiza ejemplos de código
5. Testea ejemplos con el nuevo código

### Crear Nuevo Skill
Sigue el meta-skill `skill-creator-parroquial/` para crear skills para nuevas features.

---

## 📖 Documentación Adicional

- **Expo Router:** https://docs.expo.dev/router/introduction/
- **NativeWind:** https://www.nativewind.dev/
- **React Query:** https://tanstack.com/query/latest
- **Zustand:** https://docs.pmnd.rs/zustand
- **Supabase:** https://supabase.com/docs

---

## 🤝 Contribuir

Si descubres un patrón nuevo o mejor:
1. Documéntalo en el skill correspondiente
2. Añade ejemplos ✅ CORRECTO vs ❌ INCORRECTO
3. Explica el razonamiento
4. Testea con código real

---

## 📝 Notas

- Estos skills están específicamente diseñados para esta app de parroquia
- Incluyen patrones únicos como la arquitectura dual de chat
- Todos los ejemplos están basados en código real del proyecto
- Se actualizan según evoluciona el proyecto

---

**Creado:** 2025-10-18  
**Stack Version:** React Native 0.81.4, Expo 54, Supabase 2.75, OpenAI SDK 5.0
