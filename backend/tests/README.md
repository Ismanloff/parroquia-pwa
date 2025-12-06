# 🧪 Tests del Chatbot Parroquial

Sistema de testing para verificar la calidad y precisión de las respuestas del chatbot.

## 📁 Archivos

### `chatbot-manual-test.ts`
Script para ejecutar tests manuales con preguntas predefinidas.

**Categorías de preguntas:**
- 📅 **Horarios de Misa** - Verifica que responda correctamente sobre horarios
- 📞 **Contacto** - Verifica teléfonos y direcciones
- 👥 **Grupos Parroquiales** - Verifica info de Eloos, catequesis, etc.
- ⛪ **Información Parroquial** - Verifica conocimiento general
- 📆 **Eventos** - Verifica integración con Google Calendar
- 🙏 **Sacramentos** - Verifica info sobre confesión, bautismo, etc.
- ❌ **Preguntas Fuera de Tema** - Verifica que se bloqueen
- ✅ **Respuestas Genéricas** - Verifica que sean rápidas

### `agent-evaluation.test.ts`
Tests automatizados con Jest para CI/CD.

## 🚀 Cómo Ejecutar

### Opción 1: Script Rápido (Recomendado)

```bash
# Desde la raíz del proyecto
./backend/test-chatbot.sh
```

### Opción 2: Manual

```bash
# 1. Asegúrate de que el backend esté corriendo
cd backend
npm run dev

# 2. En otra terminal, ejecuta los tests
npx ts-node backend/tests/chatbot-manual-test.ts
```

### Opción 3: Con Jest

```bash
cd backend
npm test
```

## 📊 Resultados Esperados

### ✅ Indicadores de Calidad

| Métrica | Objetivo | Descripción |
|---------|----------|-------------|
| **Tasa de éxito** | >95% | Porcentaje de respuestas sin errores |
| **Tiempo promedio** | <3s | Velocidad de respuesta |
| **Respuestas genéricas** | <500ms | Respuestas a "gracias", "ok", etc. |
| **Attachments correctos** | 100% | Recursos deben incluir archivos |
| **Bloqueo de irrelevantes** | 100% | Preguntas fuera de tema bloqueadas |

### 📈 Ejemplo de Salida

```
🧪 ========================================
   TEST MANUAL DEL CHATBOT PARROQUIAL
========================================

🔗 Backend: http://localhost:3000
📊 Total de preguntas: 32

📂 📅 Horarios de Misa
──────────────────────────────────────────────────

✅ Pregunta: "¿A qué hora son las misas?"
   Tiempo: 1850ms
   Respuesta: Las misas en nuestra parroquia son los domingos a las 10:00...
   📎 Con archivos adjuntos

✅ Pregunta: "¿Cuándo es la misa del domingo?"
   Tiempo: 1620ms
   Respuesta: La misa dominical es a las 10:00 y 12:00...

...

📊 ========================================
   RESUMEN DE RESULTADOS
========================================

✅ Exitosas: 30/32
❌ Fallidas: 2/32
⚡ Genéricas: 5
🚫 Bloqueadas: 4
📎 Con adjuntos: 8
⏱️  Tiempo promedio: 2150ms

📈 Análisis de Calidad:
   🚀 Rápidas (<2s): 18
   🐢 Medias (2-5s): 10
   🐌 Lentas (>5s): 2
```

## 🔧 Personalizar Tests

### Agregar Nuevas Preguntas

Edita `chatbot-manual-test.ts` y agrega preguntas al array `testQuestions`:

```typescript
{
  category: '🆕 Nueva Categoría',
  questions: [
    'Tu pregunta aquí',
    'Otra pregunta',
  ],
}
```

### Cambiar Backend

Por defecto usa `http://localhost:3000`. Para cambiar:

```bash
API_BASE=https://tu-backend.vercel.app npx ts-node backend/tests/chatbot-manual-test.ts
```

## 🐛 Troubleshooting

### Error: "Backend no está corriendo"

**Solución:** Inicia el backend primero:
```bash
cd backend
npm run dev
```

### Error: "Module not found"

**Solución:** Instala dependencias:
```bash
cd backend
npm install
```

### Respuestas muy lentas (>5s)

**Posibles causas:**
- Backend en Vercel (cold start)
- OpenAI API lenta
- Muchas herramientas siendo llamadas

**Solución:** Verifica logs del backend para ver qué está tardando.

## 📝 Agregar Tests al CI/CD

Agrega esto a tu `.github/workflows/test.yml`:

```yaml
- name: Test Chatbot
  run: |
    cd backend
    npm run dev &
    sleep 10  # Esperar a que el backend inicie
    npm test
```

## 💡 Tips

1. **Ejecuta tests después de cambios importantes** en el agente
2. **Revisa el tiempo de respuesta** - debe ser <3s promedio
3. **Verifica que attachments se envíen** cuando corresponde
4. **Monitorea bloqueos incorrectos** - preguntas válidas bloqueadas
5. **Actualiza preguntas** según feedback de usuarios reales

## 📚 Recursos

- [Documentación OpenAI Agents](https://platform.openai.com/docs/agents)
- [Guía de Testing Jest](https://jestjs.io/docs/getting-started)
- [Documentación del Proyecto](../../README.md)

---

✅ **Última actualización:** 2025-10-17
🔗 **Backend en Vercel:** [Ver deployment](https://vercel.com)
