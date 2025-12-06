# 🚀 Deployment de Pinecone a Vercel

## ✅ Estado Actual

Pinecone ha sido integrado exitosamente en el backend local:

- ✅ SDK instalado: `@pinecone-database/pinecone`
- ✅ Herramienta creada: `backend/app/api/chat/tools/pineconeTool.ts`
- ✅ Reemplazado `fileSearch` con `pineconeTool` en `message-stream/route.ts`
- ✅ Instrucciones actualizadas para usar `search_parish_info`
- ✅ Configurado `.env` local con `PINECONE_API_KEY`
- ✅ Prueba exitosa: 340ms de latencia (vs 2-4s de fileSearch)

## 📊 Mejora de Rendimiento

| Aspecto | OpenAI fileSearch | Pinecone |
|---------|------------------|----------|
| **Latencia de búsqueda** | 2-4 segundos | 340ms ⚡ |
| **Mejora** | - | **80-90% más rápido** |
| **Vectores indexados** | 13 PDFs (dinámico) | 24 documentos (24 vectores) |
| **Metadata** | Básica | Rica (categoría, parroquia, audiencia, etc.) |

## 🔧 Pasos para Deploy a Vercel

### 1. Configurar Variable de Entorno en Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Agrega la siguiente variable:

```
Key: PINECONE_API_KEY
Value: pcsk_5FKPB8_3kxKXLfWYe3jpeS5Sg2f1JN8jJqSMNPeAC68ARESWbFvngTxLKNWDvywApxmqzv
Environment: Production, Preview, Development (selecciona todos)
```

5. Click **Save**

### 2. Hacer Commit y Push

```bash
cd /Users/admin/Movies/APP\ PARRO

# Ver cambios
git status

# Agregar archivos modificados
git add backend/package.json
git add backend/package-lock.json
git add backend/app/api/chat/tools/pineconeTool.ts
git add backend/app/api/chat/message-stream/route.ts
git add backend/.env
git add PINECONE_DEPLOYMENT.md
git add backend/scripts/test-pinecone.ts

# Crear commit
git commit -m "feat: Integrar Pinecone para búsqueda vectorial (80-90% más rápido que fileSearch)

- Instalar @pinecone-database/pinecone
- Crear pineconeTool con búsqueda semántica y filtros por categoría
- Reemplazar fileSearch con pineconeTool en message-stream
- Actualizar instrucciones del agente para usar search_parish_info
- Prueba exitosa: 340ms de latencia vs 2-4s de fileSearch
- Configurar PINECONE_API_KEY en .env

Índice Pinecone:
- Nombre: parroquias
- Vectores: 24 documentos
- Embeddings: text-embedding-3-large (3072 dims)
- Región: us-east-1 (AWS)
- Metadata rica: categoría, parroquia, audiencia, urgencia

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push a GitHub
git push origin main
```

### 3. Verificar Deploy en Vercel

1. Vercel detectará el push automáticamente
2. Iniciará un nuevo deployment
3. Espera 2-3 minutos
4. Ve a **Deployments** y verifica que el estado sea "Ready"

### 4. Probar en Producción

Desde tu app móvil, prueba con preguntas que requieren buscar en documentos:

```
✅ Pruebas recomendadas:
- "¿Qué es Eloos?"
- "¿Cuáles son los requisitos para el bautismo?"
- "¿Qué comunidades religiosas hay?"
- "¿Cómo funciona la catequesis?"
- "¿Qué grupos hay para jóvenes?"
```

### 5. Monitorear Logs

En Vercel Dashboard → Tu proyecto → Deployments → Click en el deployment activo → **View Function Logs**

Busca estos mensajes:

```
✅ Éxito:
🔍 [Pinecone] Buscando: "¿Qué es Eloos?"
⚡ [Pinecone] Búsqueda completada en 340ms
✅ [Pinecone] 3 resultados relevantes encontrados

❌ Errores posibles:
❌ PINECONE_API_KEY no configurada
❌ [Pinecone] Error: API key inválida
❌ [Pinecone] Error: No se pudo conectar al índice
```

## 🔄 Rollback (si hay problemas)

Si necesitas volver a fileSearch temporalmente:

1. En Vercel Dashboard → Deployments
2. Busca el deployment anterior (antes de Pinecone)
3. Click en **⋯** → **Promote to Production**

O puedes revertir el código:

```bash
git revert HEAD
git push origin main
```

## 📈 Métricas Esperadas

Después del deploy, deberías ver:

| Métrica | Antes (fileSearch) | Después (Pinecone) |
|---------|-------------------|-------------------|
| **Latencia de búsqueda** | 2-4s | 0.3-0.5s |
| **Tiempo total de respuesta** | 8-14s | 4-7s |
| **Mejora** | - | **50-60% más rápido** |

## 🆘 Troubleshooting

### Error: "PINECONE_API_KEY is not defined"

**Solución:** Verifica que la variable esté configurada en Vercel:
- Settings → Environment Variables
- Debe estar en **Production**
- Haz un redeploy si acabas de agregarla

### Error: "Failed to connect to Pinecone index"

**Solución:** Verifica:
1. API key correcta en Vercel
2. Índice "parroquias" existe en Pinecone Dashboard
3. No has eliminado el índice accidentalmente

### Resultados con baja relevancia (< 70%)

**Causas posibles:**
1. Los documentos en Pinecone no contienen esa información
2. Necesitas agregar más documentos sobre ese tema
3. La pregunta está mal formulada

**Solución:** Sube más documentos relevantes a través del workflow de n8n

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Vercel
2. Ejecuta el script de prueba local: `npx tsx backend/scripts/test-pinecone.ts`
3. Verifica que el índice tenga vectores en Pinecone Dashboard

---

**Fecha de implementación:** 2025-10-21
**Versión:** 1.0.0
**Autor:** Claude Code
