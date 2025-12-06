# Skill Creator Parroquial (Meta-Skill)

## Propósito
Este skill te guía para crear nuevos Skills personalizados para apps similares de parroquias, iglesias, o comunidades religiosas que usen React Native + Supabase + OpenAI.

## Cuándo Usar Este Skill
- ✅ Crear Skills para nuevas features de la app
- ✅ Adaptar estos Skills para otras parroquias
- ✅ Documentar patrones únicos del proyecto
- ✅ Onboarding de desarrolladores nuevos

---

## 1. ANATOMÍA DE UN SKILL

### Estructura de Carpeta
```
.claude/skills/[nombre-del-skill]/
├── SKILL.md                 # Documento principal (OBLIGATORIO)
├── examples/                # Ejemplos de código (opcional)
│   ├── good-example.tsx
│   └── bad-example.tsx
├── templates/               # Plantillas reutilizables (opcional)
│   └── component-template.tsx
└── scripts/                 # Scripts útiles (opcional)
    └── generate-types.sh
```

### SKILL.md Template
```markdown
# [Nombre del Skill]

## [Stack/Tecnologías Involucradas]
- Listar tecnologías específicas con versiones

## Propósito
Una o dos frases explicando qué problema resuelve este skill.

## Cuándo Usar Este Skill
- ✅ Situación 1
- ✅ Situación 2
- ✅ Situación 3

---

## 1. SECCIÓN PRINCIPAL 1

### Patrón Principal
```typescript
// ✅ CORRECTO - Ejemplo de código bien hecho
code here
```

```typescript
// ❌ INCORRECTO - Anti-patrón a evitar
bad code here
```

### Explicación
Explicar el razonamiento detrás del patrón.

---

## 2. SECCIÓN PRINCIPAL 2

[Repetir estructura anterior]

---

## CHECKLIST

- [ ] ✅ Punto 1
- [ ] ✅ Punto 2
- [ ] ✅ Punto 3

---

## COMANDOS

```bash
# Comando útil 1
comando aquí

# Comando útil 2
otro comando
```

---

## RECURSOS

- **Documentación:** link
- **Tutorial:** link
```

---

## 2. TIPOS DE SKILLS COMUNES

### Skill de Integración (API/Servicio)
**Ejemplo:** Supabase Integration, OpenAI Chatbot, Google Calendar

**Contenido debe incluir:**
- Configuración inicial
- Patrones de queries/mutations
- Manejo de errores específicos
- Tipos TypeScript
- Variables de entorno
- Checklist de seguridad

**Plantilla:**
```markdown
# [Nombre] Integration Skill

## Stack
- Librería: version
- Dependencias: versions

## Configuración Inicial
[Código de setup]

## Patrones de Uso
[Ejemplos de código]

## Manejo de Errores
[Error handling patterns]

## Tipos TypeScript
[Type definitions]

## Variables de Entorno
[.env example]

## Checklist de Seguridad
[Security items]
```

### Skill de Arquitectura
**Ejemplo:** App Architecture, React Native Standards

**Contenido debe incluir:**
- Estructura de carpetas
- Naming conventions
- Patrones de componentes
- Patrones de estado
- Decisiones arquitectónicas

**Plantilla:**
```markdown
# [Nombre] Architecture Skill

## Estructura
[Folder structure diagram]

## Naming Conventions
[Naming rules with examples]

## Patrones de Componentes
[Component patterns]

## Gestión de Estado
[State management patterns]

## Decisiones Arquitectónicas
### ✅ Usar cuando:
### ❌ Evitar:
```

### Skill de Performance
**Ejemplo:** Performance Optimization

**Contenido debe incluir:**
- Métricas objetivo
- Estrategias de caché
- Optimizaciones específicas
- Herramientas de medición
- Benchmarks

**Plantilla:**
```markdown
# [Nombre] Performance Skill

## Métricas Objetivo
[Target metrics]

## Estrategias de Caché
[Cache strategies]

## Optimizaciones
[Specific optimizations]

## Herramientas
[Measurement tools]

## Benchmarks
[Performance benchmarks]
```

### Skill de Testing
**Ejemplo:** Testing & Debugging

**Contenido debe incluir:**
- Setup de testing
- Patrones de tests
- Casos de test comunes
- Debugging strategies
- Mocking patterns

---

## 3. PROCESO DE CREACIÓN

### Paso 1: Identificar la Necesidad
```
¿Qué problema específico resuelve este skill?
¿Ya existe un skill similar que pueda extenderse?
¿Es un patrón que se repite en el proyecto?
```

### Paso 2: Investigar el Código Existente
```bash
# Buscar patrones similares
grep -r "pattern" ./app ./components

# Identificar dependencias
cat package.json | grep "dependency"

# Ver estructura
tree -L 3 -I 'node_modules'
```

### Paso 3: Documentar Patrones Correctos
```markdown
## Pattern Name

### ✅ CORRECTO
[Show working example from actual codebase]

### ❌ INCORRECTO
[Show anti-pattern or common mistake]

### Por qué es Mejor
[Explain reasoning]
```

### Paso 4: Añadir Contexto del Stack
```markdown
## Stack
- React Native: 0.81.4
- Specific library: version
- Related dependencies

Esto ayuda a:
- Mantener compatibilidad
- Detectar breaking changes
- Onboarding más rápido
```

### Paso 5: Crear Checklist Accionable
```markdown
## CHECKLIST

- [ ] ✅ Acción concreta 1
- [ ] ✅ Acción concreta 2
- [ ] ✅ Acción concreta 3

NO simplemente "seguir best practices"
SÍ "usar React.memo para componentes en FlatList"
```

### Paso 6: Añadir Comandos Útiles
```markdown
## COMANDOS

```bash
# Descripción clara del comando
comando específico con flags relevantes

# Otro comando útil
otro comando
```
```

---

## 4. SKILLS ESPECÍFICOS PARA APPS PARROQUIALES

### Skill: Liturgical Content Management
**Para:** Apps que muestran contenido litúrgico diario

```markdown
# Liturgical Content Management Skill

## Stack
- Supabase: Almacenamiento de santos/evangelios
- React Query: Caché inteligente
- dayjs: Manejo de fechas litúrgicas

## Patrón de Fetch Diario
```typescript
// Hook para contenido litúrgico del día
export const useDailyLiturgicalContent = () => {
  const liturgicalDate = getLiturgicalDate(); // Función helper
  
  return useQuery({
    queryKey: ['liturgical', liturgicalDate],
    queryFn: () => fetchLiturgicalContent(liturgicalDate),
    staleTime: 1000 * 60 * 60, // 1 hora
  });
};
```

## Calendario Litúrgico
- Implementar conversión a año litúrgico
- Manejar fechas móviles (Pascua, etc.)
- Colores litúrgicos por temporada
```

### Skill: Community Events Management
**Para:** Gestión de eventos parroquiales

```markdown
# Community Events Management Skill

## Stack
- Google Calendar API: Eventos públicos
- Supabase: Eventos privados de usuarios
- react-native-calendars: UI de calendario

## Patrón de Eventos Duales
```typescript
// Combinar eventos públicos y privados
export const useCombinedEvents = (date: Date) => {
  const publicEvents = usePublicEvents(date);
  const userEvents = useUserEvents(date);
  
  return {
    events: [...publicEvents, ...userEvents],
    loading: publicEvents.loading || userEvents.loading,
  };
};
```

## Tipos de Eventos
- Misas y servicios religiosos
- Eventos comunitarios
- Recordatorios personales
```

### Skill: Faith-Based Chatbot
**Para:** Chatbots con conocimiento religioso

```markdown
# Faith-Based Chatbot Skill

## Stack
- OpenAI: GPT-4 con system prompt religioso
- Memory Cache: FAQs de catecismo
- Vector DB: Documentos religiosos

## System Prompt Pattern
```typescript
const FAITH_SYSTEM_PROMPT = `
Eres un asistente de parroquia católica.
Tus respuestas deben ser:
- Fieles a la doctrina católica
- Respetuosas y compasivas
- Basadas en el Catecismo cuando sea apropiado

Si no sabes algo sobre fe, di "No estoy seguro, 
consulta con el párroco para información más precisa."
`;
```

## FAQs Comunes a Cachear
- Horarios de sacramentos
- Requisitos para sacramentos
- Preguntas de catecismo básicas
```

### Skill: Multi-Parish Architecture
**Para:** Apps que sirven múltiples parroquias

```markdown
# Multi-Parish Architecture Skill

## Database Schema
```sql
-- Tabla de parroquias
CREATE TABLE parishes (
  id UUID PRIMARY KEY,
  name TEXT,
  location TEXT,
  calendar_id TEXT,
  config JSONB
);

-- Contenido por parroquia
CREATE TABLE saints (
  id UUID PRIMARY KEY,
  parish_id UUID REFERENCES parishes(id),
  date DATE,
  content TEXT
);
```

## Patrón de Tenant Isolation
```typescript
// Context de parroquia activa
export const ParishContext = createContext<Parish | null>(null);

// Queries con parish_id
export const useSaints = () => {
  const parish = useContext(ParishContext);
  
  return useQuery({
    queryKey: ['saints', parish?.id],
    queryFn: () => fetchSaints(parish?.id),
    enabled: !!parish,
  });
};
```
```

---

## 5. MANTENIMIENTO DE SKILLS

### Cuándo Actualizar un Skill
```
✅ Actualizar cuando:
- Cambió la versión de una dependencia key
- Se descubrió un mejor patrón
- Hay un breaking change en la API
- Se agregó nueva funcionalidad relacionada

❌ NO actualizar para:
- Cambios mínimos de estilo
- Preferencias personales no justificadas
- Features experimentales no probadas
```

### Versionado de Skills
```markdown
# [Skill Name] v2.0

## Changelog
### v2.0 (2025-10-18)
- BREAKING: Migrado a React Query v5
- Añadido soporte para suspense
- Actualizado staleTime defaults

### v1.1 (2025-09-01)
- Añadidos ejemplos de error handling
- Mejorado checklist

### v1.0 (2025-08-01)
- Versión inicial
```

### Testing de Skills
```bash
# Verificar que los ejemplos funcionan
npm test -- --grep "skill-examples"

# Linter en ejemplos de código
npm run lint skills/

# Validar markdown
npx markdownlint .claude/skills/**/*.md
```

---

## 6. COMPARTIR SKILLS ENTRE PROYECTOS

### Exportar Skills
```bash
# Copiar skill a otro proyecto
cp -r .claude/skills/react-native-standards ../otro-proyecto/.claude/skills/

# Crear bundle de skills
tar -czf parroquia-skills.tar.gz .claude/skills/
```

### Adaptar Skills para Otros Proyectos
```markdown
## Checklist de Adaptación

- [ ] Actualizar versiones de dependencias
- [ ] Cambiar ejemplos de código específicos
- [ ] Ajustar naming conventions si difieren
- [ ] Revisar variables de entorno
- [ ] Actualizar estructura de carpetas
- [ ] Testear ejemplos en nuevo proyecto
```

---

## 7. PLANTILLA RÁPIDA

### Quick Skill Template
```markdown
# [Skill Name] Skill

## Stack
- Dependency: version

## Cuándo Usar
- ✅ Caso 1
- ✅ Caso 2

---

## 1. MAIN PATTERN

### ✅ CORRECTO
```typescript
// Working example
```

### ❌ INCORRECTO
```typescript
// Anti-pattern
```

---

## CHECKLIST

- [ ] ✅ Action item 1
- [ ] ✅ Action item 2

---

## COMANDOS

```bash
# Useful command
command here
```
```

---

## EJEMPLO COMPLETO: CREAR UN SKILL NUEVO

### Caso: Quieres crear "Push Notifications Skill"

#### 1. Crear estructura
```bash
mkdir -p .claude/skills/push-notifications
cd .claude/skills/push-notifications
touch SKILL.md
mkdir examples
```

#### 2. Investigar código existente
```bash
# Buscar uso de notificaciones
grep -r "expo-notifications" ../../

# Ver dependencias
cat ../../package.json | grep notifications
```

#### 3. Escribir SKILL.md
```markdown
# Push Notifications Skill

## Stack
- expo-notifications: 0.XX.X
- Firebase Cloud Messaging
- Supabase: Almacenar tokens

## Cuándo Usar
- ✅ Configurar push notifications
- ✅ Manejar notificaciones en foreground/background
- ✅ Programar notificaciones locales

---

## 1. CONFIGURACIÓN INICIAL

### Instalación
```bash
npx expo install expo-notifications
```

### app.json
```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "sounds": ["./assets/notification.wav"]
        }
      ]
    ]
  }
}
```

---

## 2. SOLICITAR PERMISOS

### ✅ CORRECTO
```typescript
import * as Notifications from 'expo-notifications';

export const useNotificationPermissions = () => {
  const requestPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    
    if (status !== 'granted') {
      const { status: newStatus } = 
        await Notifications.requestPermissionsAsync();
      return newStatus === 'granted';
    }
    
    return true;
  };
  
  return { requestPermissions };
};
```

---

## 3. REGISTRAR DEVICE TOKEN

### ✅ CORRECTO
```typescript
export const useDeviceToken = () => {
  const registerToken = async (userId: string) => {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id',
    });
    
    // Guardar en Supabase
    await supabase
      .from('push_tokens')
      .upsert({
        user_id: userId,
        token: token.data,
        platform: Platform.OS,
      });
    
    return token.data;
  };
  
  return { registerToken };
};
```

---

## CHECKLIST

- [ ] ✅ Permisos solicitados en momento apropiado
- [ ] ✅ Token registrado en backend
- [ ] ✅ Handlers configurados para foreground/background
- [ ] ✅ Deep linking configurado
- [ ] ✅ Notificaciones testeadas en iOS y Android

---

## COMANDOS

```bash
# Testear notificación local
npx expo start --dev-client

# Build para testing
eas build --platform ios --profile preview
```
```

---

## CHECKLIST PARA CREAR UN SKILL

- [ ] ✅ Nombre descriptivo y específico
- [ ] ✅ Stack con versiones documentado
- [ ] ✅ Al menos 3 casos de uso claros
- [ ] ✅ Mínimo 2 secciones principales
- [ ] ✅ Ejemplos de código ✅ CORRECTO vs ❌ INCORRECTO
- [ ] ✅ Explicaciones del "por qué"
- [ ] ✅ Checklist accionable
- [ ] ✅ Comandos útiles
- [ ] ✅ Testeado con código real del proyecto
- [ ] ✅ Markdown bien formateado

---

## RECURSOS

- **Skill Creator Docs:** https://docs.claude.com/skills
- **Markdown Guide:** https://www.markdownguide.org/
- **Este proyecto:** Usa los 7 skills existentes como referencia
