# PROPUESTAS DE MEJORA: SISTEMA INTELIGENTE DE IA

## 🎯 RESUMEN EJECUTIVO

Dos propuestas para mejorar la experiencia del chatbot:

1. **Respuestas Graduales con Botón "Más Info"** ⭐⭐⭐ ALTAMENTE RECOMENDADO
2. **Precarga Predictiva de Respuestas** ⚠️ COMPLEJO, ANALIZAR COSTO/BENEFICIO

---

## 📋 PROPUESTA 1: RESPUESTAS GRADUALES CON BOTÓN "MÁS INFO"

### ✅ Ventajas:
- **UX mejorada:** Usuario controla nivel de detalle
- **Ahorro de tokens:** Solo genera respuesta completa si usuario lo solicita
- **Velocidad:** Respuesta breve llega en < 1s desde cache
- **Menor scroll:** UI más limpia con info esencial primero
- **Mejor conversión:** Usuario activamente pide más info = mayor engagement

### Cómo Funciona:

#### Flujo 1: Pregunta Simple
```
Usuario: "Qué es Eloos?"
   ↓
Quick Endpoint (cache) < 1s
   ↓
Respuesta: "Eloos es un grupo de jóvenes que sirve a personas en situación de calle. Salen los viernes a las 19:00h desde Nuestra Señora de la Soledad."
   ↓
[Sin botón - respuesta completa]
```

#### Flujo 2: Pregunta Compleja (Bautismo)
```
Usuario: "Qué documentos necesito para bautizar a mi hijo?"
   ↓
Quick Endpoint detecta: isExpandable = true, topic = "bautismo_documentos"
   ↓
Respuesta BREVE (cache):
"Para bautizar necesitas:
• Certificado de matrimonio religioso (padres)
• DNI de ambos padres
• Certificado de nacimiento del menor
• Libro de familia

Los padrinos necesitan certificados de bautismo y confirmación."

+ metadata: { hasMoreInfo: true, expandTopic: "bautismo_documentos" }
   ↓
UI muestra: [Respuesta breve] + [Botón: "📄 Ver lista completa de documentos"]
   ↓
Usuario toca botón
   ↓
Envía: "EXPAND:bautismo_documentos"
   ↓
Full Endpoint (AI Agent)
   ↓
Respuesta DETALLADA:
"📋 DOCUMENTACIÓN COMPLETA PARA BAUTISMO

👨‍👩‍👧 PADRES:
✓ Certificado de matrimonio religioso (original reciente)
✓ DNI o pasaporte vigente de AMBOS padres
✓ Certificado de nacimiento literal del menor
✓ Libro de familia completo

🧑‍🤝‍🧑 PADRINOS (mínimo 1, máximo 2):
✓ Certificado de bautismo (validez 6 meses)
✓ Certificado de confirmación
✓ Mayor de 16 años
✓ Soltero/a o casado por la Iglesia

📝 INFORMACIÓN GENEALÓGICA:
✓ Datos completos de abuelos paternos y maternos
  - Ciudad o pueblo de nacimiento
  - Provincia/departamento
  - País de origen

⚠️ CASOS ESPECIALES:
• Padres no casados religiosamente: consultar con párroco
• Niño mayor de 5 años: requiere catequesis previa
• Padrinos divorciados: NO pueden ser padrinos
• Formulario: Descargable en soledadtransfiguracion.com/solicitud-bautismo

📅 FECHAS:
• Transfiguración: 2º sábados 18:00h
• Soledad: 4º sábados 12:30h
• Entregar solicitud MÍNIMO 1 mes antes

🎒 DÍA DEL BAUTISMO traer:
• Vela (para la ceremonia)
• Vestido o pañuelo blanco
• Sobre-ofrenda voluntaria

📞 CONTACTO:
• Transfiguración: 91 475 18 75
• Soledad: 91 792 42 45"

+ attachments: [
  { title: "Formulario Solicitud Bautismo", url: "...", type: "pdf" }
]
```

### Implementación:

#### 1. Hook de Detección ([useExpandableDetector.ts](hooks/useExpandableDetector.ts))

Ya creado ✅. Detecta 10+ temas expandibles:
- `bautismo_documentos`
- `bautismo_padrinos`
- `bautismo_procedimiento`
- `matrimonio_documentos`
- `matrimonio_expediente`
- `confirmacion_requisitos`
- `inscripcion_grupos`
- etc.

#### 2. Componente UI ([ExpandButton.tsx](components/chat/ExpandButton.tsx))

Ya creado ✅. Tres variantes:
- `default`: Botón genérico azul
- `documents`: Botón verde para documentos
- `details`: Botón morado para detalles

#### 3. Modificar Backend Quick Endpoint

```typescript
// backend/app/api/chat/quick/route.ts
import { detectExpandable } from './utils/expandableDetector';

export async function POST(request: NextRequest) {
  const { message } = await request.json();

  // 1. Detectar si es expandible
  const expandInfo = detectExpandable(message);

  // 2. Si es expandible, usar respuesta breve del template
  if (expandInfo.isExpandable) {
    return NextResponse.json({
      message: expandInfo.shortAnswerTemplate,
      attachments: null,
      fromCache: true,
      hasMoreInfo: true,           // ⭐ NUEVO
      expandTopic: expandInfo.topic, // ⭐ NUEVO
    });
  }

  // 3. Si NO es expandible, flujo normal (cache o AI)
  // ...
}
```

#### 4. Modificar MessageBubble

```tsx
// components/chat/MessageBubble.tsx
import { ExpandButton } from './ExpandButton';

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  isUser,
  attachments,
  hasMoreInfo,      // ⭐ NUEVO
  expandTopic,      // ⭐ NUEVO
  onExpand,         // ⭐ NUEVO
}) => {
  return (
    <View>
      <Markdown>{text}</Markdown>

      {/* Attachments existentes */}
      {attachments?.map(...)}

      {/* ⭐ NUEVO: Botón de expansión */}
      {hasMoreInfo && (
        <ExpandButton
          topic={expandTopic}
          variant={expandTopic.includes('documento') ? 'documents' : 'default'}
          onExpand={() => onExpand(expandTopic)}
        />
      )}
    </View>
  );
};
```

#### 5. Modificar Chat Screen

```tsx
// app/(tabs)/chat.tsx
const handleExpand = (topic: string) => {
  // Enviar mensaje especial al backend
  sendMessage(`EXPAND:${topic}`);
};
```

#### 6. Modificar Backend Full Endpoint

```typescript
// backend/app/api/chat/message/route.ts
export async function POST(request: NextRequest) {
  const { message } = await request.json();

  // Detectar si es solicitud de expansión
  if (message.startsWith('EXPAND:')) {
    const topic = message.replace('EXPAND:', '');
    const expandInfo = getExpandInfo(topic);

    // Usar prompt específico para expansión
    const systemPrompt = `Usuario pidió información COMPLETA sobre: ${topic}

    ${expandInfo.expandPrompt}

    Responde de forma EXHAUSTIVA con:
    1. Lista completa de documentos/requisitos
    2. Casos especiales y excepciones
    3. Contactos específicos
    4. Enlaces a formularios (usa get_resources)
    5. Plazos y fechas importantes

    Formato: Usa emojis, negritas, listas claras.`;

    // Ejecutar agente con instrucciones específicas
    // ...
  }

  // Flujo normal...
}
```

### Métricas de Éxito:

**Antes (actual):**
- Pregunta bautismo → 300 tokens de respuesta → 2-3s
- Usuario scroll largo para encontrar info específica
- Costo: $0.0002 por pregunta

**Después (con expansión):**
- Pregunta bautismo → 100 tokens breve → < 1s (cache)
- Usuario lee esencial, decide si ampliar
- Si expande → 500 tokens detallados → 3s
- **Ahorro estimado: 60% de usuarios NO expanden → Ahorro 60% tokens/costos**

### Casos de Uso Ideales:

1. **Sacramentos:** Bautismo, matrimonio, confirmación
2. **Documentación:** Papeles, requisitos, formularios
3. **Procedimientos:** Cómo hacer X paso a paso
4. **Horarios completos:** Todas las misas vs horario básico
5. **Inscripciones:** Info rápida vs proceso completo

---

## 🚀 PROPUESTA 2: PRECARGA PREDICTIVA DE RESPUESTAS

### Concepto:
Mientras el usuario lee la respuesta actual, la IA **predice y precarga** posibles preguntas de seguimiento.

### Ejemplo:

```
Usuario: "Qué es Eloos?"
   ↓
Backend responde:
"Eloos es un grupo de jóvenes..."
   ↓
SIMULTÁNEAMENTE (background):
Backend predice follow-ups:
  - "Horario de Eloos" → Precarga respuesta A
  - "Cómo apuntarme a Eloos" → Precarga respuesta B
  - "Qué llevar a Eloos" → Precarga respuesta C
   ↓
Guarda en Redis con TTL 5 min
   ↓
Usuario pregunta: "Cómo me apunto?"
   ↓
¡Respuesta instantánea desde cache! (< 50ms)
```

### Arquitectura:

```typescript
// backend/app/api/chat/utils/predictiveCache.ts

interface PredictiveContext {
  lastTopic: string;           // "eloos", "bautismo", etc.
  likelyFollowUps: string[];   // Preguntas probables
}

// Configuración de follow-ups por topic
const FOLLOWUP_MAP = {
  eloos: {
    keywords: ['eloos', 'grupo jovenes', 'servicio calle'],
    likelyFollowUps: [
      { query: "horario eloos", priority: 1 },
      { query: "como apuntarme eloos", priority: 1 },
      { query: "que hace eloos", priority: 2 },
      { query: "donde se reune eloos", priority: 2 },
      { query: "contacto eloos", priority: 3 },
    ],
  },

  bautismo: {
    keywords: ['bautismo', 'bautizar', 'bautizo'],
    likelyFollowUps: [
      { query: "documentos bautismo", priority: 1 },
      { query: "requisitos padrinos bautismo", priority: 1 },
      { query: "cuando bautizos", priority: 2 },
      { query: "formulario bautismo", priority: 2 },
      { query: "cuanto cuesta bautismo", priority: 3 },
    ],
  },

  matrimonio: {
    keywords: ['matrimonio', 'boda', 'casarse'],
    likelyFollowUps: [
      { query: "documentos matrimonio", priority: 1 },
      { query: "expediente matrimonial donde", priority: 1 },
      { query: "curso prematrimonial", priority: 2 },
      { query: "cuanto cuesta boda iglesia", priority: 3 },
    ],
  },

  // ... más topics
};

/**
 * Predice y precarga follow-ups basado en el topic actual
 */
export async function predictAndPrecache(
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  // 1. Detectar topic de la conversación
  const topic = detectTopic(userMessage, assistantResponse);
  if (!topic) return;

  // 2. Obtener follow-ups probables
  const config = FOLLOWUP_MAP[topic];
  if (!config) return;

  // 3. Precarga solo los de priority 1 (los MÁS probables)
  const priorityFollowUps = config.likelyFollowUps.filter(f => f.priority === 1);

  console.log(`🔮 Precargando ${priorityFollowUps.length} follow-ups para topic: ${topic}`);

  // 4. Generar y cachear respuestas en background (NO bloquear)
  for (const followUp of priorityFollowUps) {
    // Fire-and-forget: NO await
    precacheResponse(followUp.query, topic).catch(err => {
      console.error('Error precaching:', err);
    });
  }
}

/**
 * Genera y cachea una respuesta en background
 */
async function precacheResponse(query: string, topic: string): Promise<void> {
  try {
    // 1. Verificar si ya está en cache
    const cached = await semanticCache.get(query);
    if (cached) {
      console.log(`✅ Ya en cache: ${query}`);
      return;
    }

    // 2. Generar respuesta con AI (modelo rápido)
    const response = await generateQuickResponse(query, {
      temperature: 0.3, // Más determinista
      maxTokens: 200,   // Respuesta breve
    });

    // 3. Cachear con TTL corto (5 min)
    await semanticCache.set(query, response, {
      ttl: 60 * 5, // 5 minutos
      tags: ['predictive', topic],
    });

    console.log(`🔮 Precacheado: ${query.substring(0, 50)}...`);
  } catch (error) {
    console.error(`Error precaching "${query}":`, error);
  }
}
```

### Integración en Quick Endpoint:

```typescript
// backend/app/api/chat/quick/route.ts
export async function POST(request: NextRequest) {
  const { message } = await request.json();

  // 1. Generar respuesta normal
  const response = await generateQuickResponse(message);

  // 2. Predecir y precachear follow-ups (background, NO bloquear)
  predictAndPrecache(message, response).catch(err => {
    console.error('Predictive cache error:', err);
  });

  // 3. Retornar respuesta inmediatamente
  return NextResponse.json({
    message: response,
    fromCache: false,
  });
}
```

### ⚠️ ANÁLISIS CRÍTICO:

#### Ventajas:
- ⚡ Follow-ups responden en < 50ms (desde cache)
- 📈 Mejora percepción de velocidad
- 🎯 UX premium: "Sabe lo que voy a preguntar"

#### Desventajas:
- 💰 **Costo:** Genera 3-5 respuestas por cada pregunta (3-5x más tokens)
- 📊 **Hit rate bajo:** Solo 20-30% de usuarios hacen follow-up exacto
- 🔥 **Desperdicio:** 70-80% de respuestas precacheadas nunca se usan
- ⚙️ **Complejidad:** Mantener FOLLOWUP_MAP actualizado
- 🐛 **Edge cases:** Predicciones incorrectas confunden

#### Cálculo de Costo:

**Sin precarga:**
- 100 usuarios preguntan "qué es eloos"
- 100 respuestas generadas
- Costo: 100 × $0.0002 = **$0.02**

**Con precarga (3 follow-ups):**
- 100 usuarios preguntan "qué es eloos"
- 100 respuestas + 300 follow-ups precacheados
- Costo: 400 × $0.0002 = **$0.08** (+300% costo)
- Solo 25 usuarios hacen follow-up real
- Hit rate: 25/300 = 8.3% de follow-ups usados
- **Desperdicio: 275 respuestas generadas pero nunca usadas**

### 🎯 RECOMENDACIÓN:

**NO implementar precarga predictiva** por ahora por:
1. Costo/beneficio desfavorable (300% más caro para 8% hit rate)
2. Complejidad de mantenimiento alta
3. Alternativa mejor: **Respuestas graduales** logra mismo objetivo con 0 desperdicio

**ALTERNATIVA INTELIGENTE:**
En lugar de precachear respuestas, **precachear SOLO si el usuario hace hover/scroll lento** (señal de interés):

```typescript
// Frontend: Detector de intención
const [userStillReading, setUserStillReading] = useState(false);

useEffect(() => {
  // Si el usuario pasa >3s leyendo la respuesta
  const timer = setTimeout(() => {
    setUserStillReading(true);
    // AHORA SÍ, precachear follow-ups
    prefetchFollowups(lastTopic);
  }, 3000);

  return () => clearTimeout(timer);
}, [lastMessage]);
```

Esto reduce desperdicio de ~70% a ~30%.

---

## 📊 COMPARACIÓN FINAL

| Feature | Respuestas Graduales | Precarga Predictiva |
|---------|---------------------|---------------------|
| **Implementación** | ⭐⭐⭐ Simple | ⭐ Compleja |
| **Costo** | ⭐⭐⭐ -60% tokens | ❌ +300% tokens |
| **UX** | ⭐⭐⭐ Control usuario | ⭐⭐ Magia IA |
| **Desperdicio** | ⭐⭐⭐ 0% | ❌ 70-80% |
| **Mantenimiento** | ⭐⭐⭐ Mínimo | ⭐ Alto |
| **Hit rate** | ⭐⭐⭐ 100% | ⭐ 8-30% |

**Ganador claro: Respuestas Graduales** ✅

---

## 🛠️ PLAN DE IMPLEMENTACIÓN

### Fase 1: Respuestas Graduales (2-3 días)

**Día 1:**
- [x] Crear `useExpandableDetector.ts` ✅
- [x] Crear `ExpandButton.tsx` ✅
- [ ] Modificar `backend/app/api/chat/quick/route.ts`
- [ ] Añadir respuestas breves a memoryCache

**Día 2:**
- [ ] Modificar `MessageBubble.tsx` para mostrar botón
- [ ] Modificar `chat.tsx` para manejar expansiones
- [ ] Modificar `backend/app/api/chat/message/route.ts` para EXPAND requests
- [ ] Testing en dev

**Día 3:**
- [ ] Testing E2E con usuarios reales
- [ ] Ajustar templates de respuestas breves
- [ ] Monitorear métricas (% de expansiones)
- [ ] Deploy a producción

### Fase 2: Precarga Predictiva (OPCIONAL - Evaluar después)

Solo implementar SI:
- Métricas muestran >50% de usuarios hacen follow-ups
- Presupuesto permite 300% más de tokens
- Hit rate proyectado >40%

**Implementación condicional:**
```typescript
// Solo precachear si usuario muestra señales de interés
if (userReadingTime > 3000 && scrolledToBottom) {
  await prefetchFollowups(topic);
}
```

---

## 📈 MÉTRICAS A MONITOREAR

### Respuestas Graduales:

1. **Tasa de expansión:** % de usuarios que tocan "Ver más"
   - Target: 30-40%
   - Si >60%: Respuestas breves muy cortas
   - Si <20%: Respuestas breves ya completas

2. **Ahorro de tokens:**
   - Tokens breves vs tokens completos
   - Target: 50-70% ahorro

3. **Tiempo de lectura:**
   - ¿Usuarios leen breve antes de expandir?
   - Target: >2s antes de expandir

### Precarga Predictiva (si se implementa):

1. **Hit rate:** % de follow-ups precacheados que se usan
   - Target: >40% para justificar costo
   - Si <20%: Desactivar

2. **Latencia follow-ups:**
   - Con cache: <100ms
   - Sin cache: 2-3s

3. **Costo adicional:**
   - Tokens desperdiciados / Tokens útiles
   - Target: Ratio <2:1

---

## ✅ CONCLUSIÓN

**Implementa Respuestas Graduales AHORA** porque:
- Simple de implementar
- Mejora UX inmediatamente
- Ahorra 50-70% de tokens
- 0% desperdicio
- Usuario controla profundidad

**NO implementes Precarga Predictiva** porque:
- Muy costoso (300% más tokens)
- Hit rate bajo (8-30%)
- Complejo de mantener
- Alternativa (Respuestas Graduales) es mejor

**Si REALMENTE quieres precarga:** Espera a tener métricas reales de follow-ups, luego implementa versión condicional (solo si usuario muestra interés).

🎯 **Próximo paso:** ¿Quieres que implemente el sistema de Respuestas Graduales completo?
