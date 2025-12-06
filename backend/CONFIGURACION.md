# 🎛️ Configuración del Chatbot

## ✅ Cómo cambiar la configuración SIN tocar código

Ahora puedes cambiar la personalidad, nombre y comportamiento del chatbot **sin necesidad de programar**. Solo necesitas editar variables de entorno en Vercel.

---

## 📝 Variables configurables

### 1. **AGENT_NAME**
**Qué hace:** Cambia el nombre interno del agente
```
AGENT_NAME=Asistente Parroquial San José
```

### 2. **AGENT_INSTRUCTIONS**
**Qué hace:** Controla la personalidad y comportamiento del bot
```
AGENT_INSTRUCTIONS="Eres un chatbot amigable y cercano de la parroquia..."
```

**Ejemplos de personalidades:**

**Formal:**
```
"Eres un asistente formal de la parroquia. Responde con respeto y protocolo eclesiástico."
```

**Cercano:**
```
"Eres un asistente muy cercano y amigable. Usa un tono cálido y acogedor, como hablaría un sacerdote joven."
```

**Breve:**
```
"Responde de forma ultra breve y directa. Máximo 2 frases por respuesta."
```

### 3. **OPENAI_AGENT_MODEL**
**Qué hace:** Cambia el modelo de IA
```
OPENAI_AGENT_MODEL=gpt-4o        # Más inteligente, más caro
OPENAI_AGENT_MODEL=gpt-4o-mini   # Rápido y económico (actual)
```

### 4. **OPENAI_VECTOR_STORE_ID**
**Qué hace:** Cambia la base de conocimiento (documentos de la parroquia)
```
OPENAI_VECTOR_STORE_ID=vs_nuevo_id_aqui
```

### 5. **GOOGLE_CALENDAR_ICS_URL**
**Qué hace:** Cambia la URL del calendario de Google que el chatbot puede consultar
```
GOOGLE_CALENDAR_ICS_URL=https://calendar.google.com/calendar/ical/tu_calendario/public/basic.ics
```

**⚠️ Nota:** Esta variable permite que el chatbot responda preguntas sobre eventos del calendario como "¿Qué eventos hay esta semana?" o "¿Cuándo es la próxima misa?". Sin esta variable configurada, el chatbot no podrá consultar el calendario.

---

## 🚀 Cómo cambiar en Vercel

### Paso 1: Ir a Vercel Dashboard
1. Ve a https://vercel.com
2. Entra a tu proyecto: `chat-app-parroquias`

### Paso 2: Editar variables
1. Click en **Settings** (arriba)
2. Click en **Environment Variables** (menú izquierdo)
3. Busca la variable que quieres cambiar (ej: `AGENT_INSTRUCTIONS`)
4. Click en los **3 puntitos** → **Edit**
5. Pega el nuevo valor
6. Click en **Save**

### Paso 3: Redesplegar
1. Ve a **Deployments** (arriba)
2. Click en el último deployment
3. Click en **⋯** (3 puntitos) → **Redeploy**
4. Espera 2-3 minutos

### Paso 4: Probar
1. Abre tu app móvil
2. Recarga (shake → Reload)
3. Envía un mensaje de prueba

---

## 💡 Ejemplos de cambios comunes

### Cambiar el tono a más juvenil
```
AGENT_INSTRUCTIONS="Eres un chatbot juvenil y moderno de la parroquia. Usa lenguaje cercano y actual, pero siempre respetuoso. Puedes usar emojis ocasionalmente 😊"
```

### Hacerlo más directo y conciso
```
AGENT_INSTRUCTIONS="Eres un asistente directo. Responde en máximo 3 frases cortas. Ve al grano sin rodeos."
```

### Cambiar para enfocarse solo en horarios
```
AGENT_INSTRUCTIONS="Te especializas en horarios de misa y confesiones. Para otras consultas, deriva a la recepción parroquial."
```

---

## ⚠️ Importante

- **Siempre haz backup** del texto anterior antes de cambiar
- **Prueba en Preview** antes de aplicar a Production
- **Los cambios tardan 2-3 minutos** en aplicarse después del redeploy
- **Si algo falla**, simplemente vuelve al valor anterior

---

## 🆘 Solución de problemas

### "El bot no responde"
- Verifica que `OPENAI_API_KEY` esté configurada
- Revisa que el redeploy haya terminado (debe decir "Ready")

### "Las instrucciones no cambian"
- Asegúrate de haber hecho redeploy
- Verifica que la variable esté en **Production** (no solo Preview)
- Recarga la app móvil

### "Quiero volver a como estaba"
Usa estas instrucciones originales:
```
AGENT_INSTRUCTIONS="Eres un chatbot parroquial que informa y orienta a personas interesadas en la parroquia. Tu función es responder de forma clara, breve y respetuosa. Puedes dar información sobre horarios de misas, grupos, actividades, eventos especiales, voluntariado y contacto con la parroquia. Si no tienes la información exacta, indica cómo la persona puede obtenerla (por ejemplo: teléfono, correo, o recepción parroquial). Mantén un tono acogedor, pastoral y directo. Usa la herramienta 'fileSearch' para encontrar información específica en los documentos que te han proporcionado. Usa la herramienta 'get_calendar_events' cuando el usuario pregunte sobre eventos, horarios de misas, actividades programadas, o qué hay en el calendario."
```

### "El chatbot no puede ver el calendario"
- Verifica que `GOOGLE_CALENDAR_ICS_URL` esté configurada en Vercel
- La URL debe ser pública (formato: `.../public/basic.ics`)
- Haz redeploy después de añadir la variable
```

---

## 📞 Contacto

Si necesitas ayuda o quieres hacer cambios más complejos, contacta al desarrollador.
