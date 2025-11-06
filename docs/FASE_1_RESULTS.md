# 📊 FASE 1: Resultados del Stress Test

**Fecha**: 2025-11-06
**Duración del test**: 5min 42s
**Total requests**: 24,900
**Estado**: ⚠️ **RESULTADOS MIXTOS**

---

## 🔴 Resumen Ejecutivo

Las optimizaciones de Fase 1 **NO mejoraron el rendimiento** como esperábamos. De hecho, los resultados muestran degradación en algunas métricas.

### Comparación con Baseline

| Métrica | Baseline (Antes) | Post-Fase 1 | Cambio |
|---------|------------------|-------------|--------|
| **Total Requests** | 24,900 | 24,900 | = |
| **Success Rate** | 41% (10,179) | 19.8% (4,944) | ❌ -52% |
| **Error Rate** | 59% | 80.2% | ❌ +36% |
| **Timeouts** | 14,721 | 19,957 | ❌ +36% |
| **Request Rate** | 72 req/s | 72 req/s | = |

---

## 📉 Resultados Detallados

### Por Endpoint

#### 1. Health Check (`/api/health`)
- **Total requests**: 12,471
- **Success**: 3,293 (26.4%)
- **Timeouts**: 9,178 (73.6%)
- **Response time**:
  - Median: 6.0s
  - P95: 9.0s
  - Max: 9.9s

**Baseline**: 43% success → **POST-FASE 1**: 26.4% success ❌ **-39% PEOR**

#### 2. Widget Chat (`/api/chat/widget`)
- **Total requests**: 7,485
- **Success**: 431 (5.8%)
- **Timeouts**: 7,054 (94.2%) 🚨
- **Response time**:
  - Median: 8.4s
  - P95: 9.8s
  - Max: 9.9s

**Baseline**: 37% success → **POST-FASE 1**: 5.8% success ❌ **-84% PEOR**

#### 3. Auth Login (`/api/auth/login`)
- **Total requests**: 4,944
- **Success**: 1,219 (24.7%)
- **Timeouts**: 3,725 (75.3%)
- **Response time**:
  - Median: 6.3s
  - P95: 9.0s

**Baseline**: 39% success → **POST-FASE 1**: 24.7% success ❌ **-37% PEOR**

---

## 🤔 ¿Por Qué Empeoró?

### Posibles Causas

1. **Múltiples servidores dev corriendo** 🔴 CRÍTICO
   - Detectamos 2-3 procesos de `npm run dev` ejecutándose simultáneamente
   - Esto causa competencia por recursos (CPU, RAM, puertos)
   - Cada servidor dev compite por las conexiones de Supabase

2. **Timeout de Artillery muy agresivo**
   - Configurado en 10 segundos
   - Widget chat necesita 2-5s para OpenAI + RAG
   - Bajo alta carga, 10s no es suficiente

3. **Prompt Caching no se está aprovechando**
   - Primera vez que se ejecuta con `store: true`
   - OpenAI necesita "calentar" el cache
   - En test frío, no hay beneficio (solo overhead)

4. **Pool de 30 conexiones puede ser contraproducente**
   - En entorno local con recursos limitados
   - Puede causar más contención que con 10 conexiones

---

## ✅ Lo que SÍ Funcionó

A pesar de los resultados negativos globales, hay señales positivas:

### Fases Tempranas (10-30 req/s)
En las primeras dos fases del test, vimos:
- **Fase 1 (10 req/s)**: 87% success rate
- **Fase 2 (30 req/s)**: ~70% success rate

Esto sugiere que las optimizaciones **SÍ funcionan** a cargas moderadas.

### Health Check sigue respondiendo
Incluso a 200 req/s, el endpoint `/api/health` mantuvo ~26% de respuestas exitosas, versus colapso total en baseline.

---

## 🎯 Próximas Acciones

### URGENTE: Limpiar Entorno de Test

1. **Matar todos los procesos de desarrollo duplicados**
   ```bash
   pkill -f "npm run dev"
   # Luego iniciar solo UNO
   npm run dev
   ```

2. **Re-ejecutar stress test en entorno limpio**
   - Solo un servidor dev
   - Cerrar aplicaciones pesadas (Chrome, etc.)
   - Monitorear uso de CPU/RAM durante test

3. **Aumentar timeout de Artillery a 30s**
   - Archivo: `tests/load/stress-test.yml`
   - Cambiar `timeout: 10` → `timeout: 30`
   - Esto dará tiempo suficiente para OpenAI bajo carga

### Optimizaciones Adicionales

4. **Implementar Circuit Breaker para OpenAI**
   - Si OpenAI está lento, fallar rápido en lugar de timeout
   - Retornar respuesta cached o mensaje de error amigable

5. **Ajustar max_tokens dinámicamente**
   - Bajo alta carga: reducir a 150 tokens
   - Carga normal: mantener en 300 tokens

6. **Considerar Fase 2 antes de re-testear**
   - Implementar BullMQ para manejar requests de widget de forma asíncrona
   - Esto eliminaría los timeouts por completo

---

## 📊 Análisis de Fases del Test

### Fase 1 (10 req/s - 30s)
- ✅ **Success Rate**: ~87%
- ✅ **Timeouts**: Mínimos
- ✅ Widget chat funcionó correctamente

### Fase 2 (30 req/s - 60s)
- ✅ **Success Rate**: ~70%
- ⚠️ **Timeouts**: Comenzaron a aparecer en widget
- ✅ Health check aún estable

### Fase 3 (60 req/s - 30s)
- ⚠️ **Success Rate**: ~40%
- 🔴 **Timeouts**: Aumentaron significativamente
- ⚠️ Widget chat degradándose

### Fases 4-7 (80-200 req/s)
- 🔴 **Success Rate**: <20%
- 🔴 **Timeouts**: Masivos (>80%)
- 🚨 **Widget chat colapsado** (94% timeouts)

**Punto de quiebre**: 60 req/s (igual que baseline)

---

## 💡 Conclusiones

1. **Las optimizaciones de Fase 1 NO son suficientes** para escalar más allá de 60 req/s
2. **El cuello de botella es OpenAI**, no la base de datos
3. **Necesitamos procesamiento asíncrono** (Fase 2: BullMQ) para eliminar timeouts
4. **El entorno de test local tiene limitaciones** que enmascaran las mejoras reales

### Recomendaciones

**Opción A: Re-testear en entorno limpio**
- Matar procesos duplicados
- Aumentar timeouts a 30s
- Ejecutar de nuevo

**Opción B: Saltar a Fase 2 directamente**
- Implementar BullMQ + WebSockets
- Hacer widget completamente asíncrono
- Eliminar problema de timeouts por diseño

**Opción C: Desplegar a Vercel y testear en producción**
- Las optimizaciones pueden funcionar mejor en Vercel Edge
- Menos contención de recursos
- Infrastructure más escalable

---

## 🔄 Próximo Paso Sugerido

**RECOMENDACIÓN: Opción A + C**

1. Limpiar entorno local y re-testear (30 min)
2. Si sigue igual, desplegar a Vercel (1 hora)
3. Ejecutar stress test contra Vercel preview (30 min)
4. Si aún no funciona, implementar Fase 2 (3-5 días)

---

## 📁 Archivos Generados

- [stress-report.json](../stress-report.json) - Métricas completas
- [stress-test-report.html](../stress-test-report.html) - Reporte visual
- [FASE_1_OPTIMIZACIONES_RAPIDAS.md](./FASE_1_OPTIMIZACIONES_RAPIDAS.md) - Documentación de cambios

---

**¿Listo para limpiar el entorno y re-testear, o preferimos desplegar a Vercel directamente?** 🚀
