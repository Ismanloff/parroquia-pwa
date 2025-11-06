# 🔍 PROMPT PARA KODEX - Revisión Exhaustiva y Testing

## Contexto del Proyecto

**Resply** es un SaaS multi-tenant de chatbot inteligente con RAG (Retrieval-Augmented Generation). Stack: Next.js 14, Supabase, Pinecone, OpenAI/Anthropic. Progreso actual: **92% completo**.

## Tu Misión (3 partes)

### PARTE 1: Revisión de Documentación Crítica 📋

Lee estos archivos en orden de prioridad y crea un **índice consolidado** de problemas conocidos, pending tasks, y estado actual:

**Alta Prioridad:**

1. `SESSION_2025-11-06_COMPLETED.md` - Última sesión completada (4h trabajo)
2. `ESTADO_ACTUAL.md` - Estado del proyecto
3. `docs/WEEK_4_ADMIN_DASHBOARD_COMPLETED.md` - Week 4 completado
4. `docs/WEEK_5_SUPPORT_KNOWLEDGE_BASE_PLAN.md` - Plan Week 5 (parcialmente completado)
5. `SENTRY_VERCEL_SETUP.md` - Pendiente: configuración Sentry

**Media Prioridad:** 6. `README.md` - Overview general 7. `MIGRATION_TODO.md` - Roadmap de fases 8. Cualquier archivo `*_COMPLETED.md` o `*_PLAN.md` en `/docs`

**Salida esperada Parte 1:**

```markdown
## 📊 Estado Consolidado

- **Progreso Global**: X%
- **Issues Críticos Abiertos**: [lista con archivos:línea]
- **Pending Tasks**: [lista priorizada]
- **Configuraciones Pendientes**: [lista]
- **Warnings/TODOs en código**: [resumen si encuentras]
```

---

### PARTE 2: Análisis de Testing Feasibility 🧪

Revisa **configuración de testing actual**:

- `package.json` - Scripts de test (busca "test", "vitest", "playwright")
- `vitest.config.ts` o similar
- `playwright.config.ts` o similar
- Directorio `/tests` o `/__tests__` si existe

Analiza **cobertura de testing**:

- ¿Cuántos tests existen actualmente? (busca archivos `*.test.ts`, `*.spec.ts`)
- ¿Qué librerías de testing están instaladas?
- ¿Está configurado CI/CD para tests?

**Identifica oportunidades de testing** en estas áreas:

1. **Utils/Helpers** (alta prioridad - fáciles de testear):
   - `lib/utils/*.ts`
   - `lib/services/*.ts`
   - `lib/security/*.ts`

2. **API Routes** (media prioridad - integration tests):
   - `app/api/**/*.ts`
   - Especialmente: auth, documents, chat, webhooks

3. **Components** (media prioridad - component tests):
   - `components/ui/*.tsx`
   - `components/layout/*.tsx`

4. **Critical Paths** (alta prioridad - E2E tests):
   - Flujo de signup/login
   - Upload de documentos
   - Widget de chat
   - WhatsApp integration

**Salida esperada Parte 2:**

```markdown
## 🧪 Estado de Testing

### Actual

- Tests escritos: X archivos
- Cobertura estimada: X%
- Frameworks disponibles: [lista]

### Recomendaciones (orden de prioridad)

1. **Unit Tests** (2-3h esfuerzo):
   - `lib/utils/crypto.ts` - Funciones de encriptación
   - `lib/utils/validation.ts` - Validadores
   - [lista 5-7 archivos más testables]

2. **Integration Tests** (5-7h esfuerzo):
   - `app/api/auth/signup/route.ts`
   - `app/api/documents/upload/route.ts`
   - [lista 3-5 APIs críticas]

3. **E2E Tests** (10-15h esfuerzo):
   - Flujo completo de signup → upload doc → chat
   - [lista 2-3 flujos críticos]

### Blockers para Testing

- [Lista de dependencias faltantes]
- [Issues de configuración]
```

---

### PARTE 3: Quick Wins Identification 🎯

Basado en tu análisis, identifica **3-5 "quick wins"** que se puedan implementar en la próxima sesión (<2h cada uno):

**Criterios:**

- Alto impacto (seguridad, UX, o funcionalidad crítica)
- Bajo esfuerzo (<2h)
- No requieren decisiones de arquitectura complejas

**Formato:**

```markdown
## ⚡ Quick Wins Recomendados

1. **[Título]** (Xh)
   - **Problema**: [descripción breve]
   - **Solución**: [pasos específicos]
   - **Impacto**: [beneficio claro]
   - **Archivos**: [paths exactos]

[Repetir para 3-5 items]
```

---

## 📋 Checklist para tu Review

- [ ] Leí todos los archivos de documentación listados
- [ ] Identifiqué issues críticos sin resolver
- [ ] Revisé configuración de testing actual
- [ ] Analicé feasibility de testing por área
- [ ] Identifiqué 3-5 quick wins específicos
- [ ] Mi respuesta es **concisa** (máx 500 líneas)

---

## 🎯 Entregable Final

Un solo mensaje con **3 secciones** (usa los templates de "Salida esperada" arriba):

1. Estado Consolidado
2. Estado de Testing + Recomendaciones
3. Quick Wins Recomendados

**Nota importante**: Si encuentras discrepancias entre documentos (ej: un TODO marcado como pendiente en un doc pero completado en otro), señálalo en "Estado Consolidado" → "Discrepancias encontradas".

---

**Ready? Empieza tu análisis. No necesitas confirmar, ve directo a la revisión.**
