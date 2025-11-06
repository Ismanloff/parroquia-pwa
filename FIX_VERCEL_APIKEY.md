# 🔧 ARREGLAR: API Key con Salto de Línea en Vercel

**Urgencia:** 🔴 CRÍTICO
**Problema:** WebSocket/Realtime de Supabase está fallando por API key corrupta
**Síntomas:** CHANNEL_ERROR, TIMED_OUT, WebSocket connection failed

---

## 🐛 El Problema

Tu `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Vercel tiene un **salto de línea (`\n`)** al final:

```
apikey=...U1hEP2PbBs2hBOrOVrDTyxPvGWELtF0M-RFIW1kUv-8%0A
                                                    ^^^^
                                                   Newline
```

Esto rompe:
- ❌ WebSocket connections
- ❌ Supabase Realtime
- ❌ Conexiones en tiempo real
- ❌ Subscriptions

---

## ✅ SOLUCIÓN (5 minutos)

### Paso 1: Ir a Vercel Dashboard

1. Abre: https://vercel.com/chatbot-parros-projects/resply
2. Ve a **Settings** (⚙️ en el menú superior)
3. Haz click en **Environment Variables** en el sidebar izquierdo

### Paso 2: Encontrar el API Key Problemático

Busca estas variables:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`

### Paso 3: Editar la Variable

1. Haz click en los **3 puntos (⋮)** al lado de `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Selecciona **Edit**
3. **COPIA** el valor actual
4. **PÉGALO** en un editor de texto (VS Code, Notepad, etc.)
5. **ELIMINA** cualquier espacio en blanco o salto de línea al inicio/final
6. El valor debe verse así (1 sola línea, sin espacios):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4b3hqYmZpcnp5Ynh6bGxha2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMDE2NzMsImV4cCI6MjA3NzY3NzY3M30.U1hEP2PbBs2hBOrOVrDTyxPvGWELtF0M-RFIW1kUv-8
   ```
7. **COPIA** el valor limpio
8. **PÉGALO** de vuelta en Vercel
9. Haz click en **Save**

### Paso 4: Hacer lo Mismo con URL

Repite el proceso con `NEXT_PUBLIC_SUPABASE_URL`:

1. Edit `NEXT_PUBLIC_SUPABASE_URL`
2. Eliminar espacios/newlines
3. Debe verse así:
   ```
   https://vxoxjbfirzybxzllakjr.supabase.co
   ```
4. Save

### Paso 5: Verificar TODAS las Env Vars

Revisa que **ninguna** variable tenga espacios o saltos de línea:

```bash
# ❌ INCORRECTO (con newline)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
                                        ← (salto de línea invisible)

# ✅ CORRECTO (sin espacios)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...
```

Variables críticas a revisar:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `PINECONE_API_KEY`
- ✅ `VOYAGE_API_KEY`
- ✅ `OPENAI_API_KEY`

### Paso 6: Re-deploy

Después de guardar los cambios:

1. Ve a la pestaña **Deployments**
2. Haz click en **Redeploy** en el último deployment
3. Selecciona **Use existing build cache** ✅
4. Haz click en **Redeploy**

O desde terminal:
```bash
cd "/Users/admin/Movies/Proyecto SaaS/resply"
vercel --prod --yes
```

---

## 🧪 VERIFICAR QUE FUNCIONA

### 1. Verificar en Browser Console

Abre la app en producción:
```
https://resply.vercel.app
```

Abre DevTools (F12) → Console

**Antes del fix (❌):**
```
WebSocket connection to 'wss://...apikey=...%0A' failed
[Realtime] Subscription status: CHANNEL_ERROR
```

**Después del fix (✅):**
```
[Realtime] Subscription status: SUBSCRIBED
[Realtime] Connection established
```

### 2. Verificar Network Tab

En DevTools → Network → WS (WebSocket):

- Busca conexión a `realtime/v1/websocket`
- Status debe ser **101 Switching Protocols** ✅
- NO debe decir **Failed** ❌

### 3. Testear Realtime

1. Sube un documento en `/dashboard/documents`
2. Deberías ver **actualización en tiempo real** cuando se procese
3. Sin errores en consola ✅

---

## 🔍 CAUSA RAÍZ

### ¿Cómo se Introdujo el Newline?

Probablemente al copiar/pegar el API key desde:
- Archivo `.env` con espacio al final
- Email con formato HTML
- Dashboard de Supabase con selección incorrecta
- Terminal con `\n` al final

### Prevención Futura

**Al copiar API keys:**
1. ✅ Usa selección precisa (doble click en el token)
2. ✅ Verifica en editor de texto antes de pegar
3. ✅ Usa `trim()` o elimina espacios manualmente
4. ❌ NO copies directamente desde terminal con echo
5. ❌ NO copies de archivos con trailing newlines

---

## 🚨 SI EL PROBLEMA PERSISTE

### Opción 1: Regenerar las Keys

Si limpiar no funciona, regenera las keys:

1. Ve a Supabase Dashboard: https://supabase.com/dashboard
2. Settings → API
3. Click en **Reset anon/public key**
4. Copia la **nueva key**
5. Actualiza en Vercel
6. Redeploy

### Opción 2: Verificar con `curl`

```bash
# Test API key directly
curl -I "https://vxoxjbfirzybxzllakjr.supabase.co/rest/v1/" \
  -H "apikey: TU_API_KEY_AQUI"

# Should return: HTTP/2 200
```

Si retorna error 401: la key está incorrecta.

### Opción 3: Crear .env desde Cero

```bash
cd "/Users/admin/Movies/Proyecto SaaS/resply"

# Backup old env
cp .env.local .env.local.backup

# Create new clean env
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=https://vxoxjbfirzybxzllakjr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4b3hqYmZpcnp5Ynh6bGxha2pyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMDE2NzMsImV4cCI6MjA3NzY3NzY3M30.U1hEP2PbBs2hBOrOVrDTyxPvGWELtF0M-RFIW1kUv-8
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
EOF

# Copy to Vercel
vercel env pull
```

---

## ✅ CHECKLIST

Marca cuando completes cada paso:

- [ ] Abrir Vercel Settings → Environment Variables
- [ ] Editar `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Eliminar espacios/newlines al inicio y final
- [ ] Guardar cambio
- [ ] Editar `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Eliminar espacios/newlines
- [ ] Guardar cambio
- [ ] Revisar otras env vars (PINECONE, VOYAGE, etc.)
- [ ] Redeploy desde Vercel Dashboard
- [ ] Abrir app en producción
- [ ] Verificar console (NO debe haber WebSocket errors)
- [ ] Verificar Network tab (WebSocket debe conectar)
- [ ] Testear realtime subiendo documento

---

## 📞 SOPORTE

Si después de seguir estos pasos el problema persiste:

1. Verifica logs de Vercel:
   ```bash
   vercel logs resply-pjlfmntz4-chatbot-parros-projects.vercel.app
   ```

2. Verifica que las env vars estén en **Production**:
   - En Vercel Settings → Environment Variables
   - Cada variable debe tener checkbox en "Production" ✅

3. Limpia browser cache:
   - Chrome: Ctrl+Shift+Delete → Clear cache
   - Recarga con Ctrl+Shift+R (hard reload)

---

**Tiempo estimado:** 5 minutos
**Impacto:** CRÍTICO (arregla WebSocket/Realtime)
**Dificultad:** Fácil
