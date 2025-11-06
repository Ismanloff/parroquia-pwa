# 🚀 Guía Rápida: Configurar WhatsApp con Kapso en Resply

**Tu API Key**: `c58a272297ecdeed7c7227aeb17aba6309ef109282a41fc87ec793fd97b8c778`

---

## ✅ PASO 1: Aplicar Migración de Base de Datos

Primero, necesitas agregar el campo `metadata` a la tabla `messages`:

```sql
-- Conecta a Supabase y ejecuta este SQL
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Crear índice para búsquedas rápidas por whatsapp_message_id
CREATE INDEX IF NOT EXISTS idx_messages_metadata_whatsapp_id
ON messages ((metadata->>'whatsapp_message_id'));

-- Comentar el campo
COMMENT ON COLUMN messages.metadata IS 'Metadata adicional del mensaje (WhatsApp IDs, timestamps, etc.)';
```

**Cómo ejecutar:**
1. Ve a Supabase Dashboard → SQL Editor
2. Pega el SQL de arriba
3. Click en "Run"

---

## 📱 PASO 2: Obtener Phone Number ID en Kapso

1. Ve a https://kapso.ai/dashboard
2. Inicia sesión con tu cuenta
3. En el dashboard principal, busca "**Phone Numbers**" o "**Números de Teléfono**"
4. Si no tienes un número:
   - Click en "**Get Phone Number**" o "**Obtener Número**"
   - Selecciona tu región (USA recomendado)
   - Espera ~1-2 minutos para que Kapso provisione el número
5. Una vez que tengas el número, copia el **Phone Number ID**
   - Se ve algo como: `123456789012345`
   - Aparece debajo del número de teléfono

**Ejemplo visual:**
```
📞 +1 (555) 123-4567
   Phone Number ID: 123456789012345  ← Copia este
   Status: Active ✅
```

---

## 🔐 PASO 3: Crear Webhook Secret

El Webhook Secret lo defines tú. Es una contraseña segura para verificar webhooks.

**Generar un secret seguro:**
```bash
# Opción 1: Usando Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Opción 2: Usando OpenSSL
openssl rand -hex 32

# Opción 3: Crear uno manualmente (mínimo 16 caracteres)
# Ejemplo: mysecurewebhooksecret2024
```

**Guárdalo de forma segura** - lo necesitarás en el siguiente paso.

---

## ⚙️ PASO 4: Configurar Variables de Entorno

Edita tu archivo `.env.local`:

```bash
# WhatsApp Integration (Kapso)
WHATSAPP_PROVIDER=kapso
KAPSO_API_KEY=c58a272297ecdeed7c7227aeb17aba6309ef109282a41fc87ec793fd97b8c778
KAPSO_WEBHOOK_SECRET=tu_webhook_secret_aqui  # Del paso 3
NEXT_PUBLIC_APP_URL=https://tu-dominio.com  # O http://localhost:3000 para dev
```

**Si estás en desarrollo local** y quieres probar webhooks, usa **ngrok**:
```bash
# Terminal 1: Inicia tu app
npm run dev

# Terminal 2: Inicia ngrok
ngrok http 3000

# Copia la URL de ngrok (ej: https://abc123.ngrok.io)
# Úsala como NEXT_PUBLIC_APP_URL
```

---

## 🔗 PASO 5: Conectar WhatsApp desde el Dashboard

1. **Inicia tu aplicación:**
   ```bash
   npm run dev
   ```

2. **Ve a tu dashboard:**
   - Abre http://localhost:3000/dashboard/channels
   - O https://tu-dominio.com/dashboard/channels

3. **Click en "Conectar WhatsApp"**

4. **Llena el formulario:**
   - **Provider**: Selecciona "Kapso (Recomendado)"
   - **Channel Name**: "WhatsApp Principal" (o cualquier nombre)
   - **Kapso API Key**: `c58a272297ecdeed7c7227aeb17aba6309ef109282a41fc87ec793fd97b8c778`
   - **Phone Number ID**: El que copiaste en el Paso 2
   - **Webhook Secret**: El que creaste en el Paso 3

5. **Click "Conectar Canal"**

6. **Copia la Webhook URL** que aparece (algo como):
   ```
   https://tu-dominio.com/api/whatsapp/webhooks?channelId=xxx-xxx-xxx
   ```

---

## 🔔 PASO 6: Configurar Webhook en Kapso Dashboard

1. Ve a https://kapso.ai/dashboard
2. Busca la sección "**Webhooks**" o "**Configuración**"
3. Click en "**Add Webhook**" o "**Agregar Webhook**"
4. Llena el formulario:
   - **URL**: La webhook URL del Paso 5
   - **Events/Eventos**: Selecciona:
     - ✅ `messages` (Mensajes entrantes)
     - ✅ `message_status` (Estado de mensajes)
   - **Secret**: El mismo webhook secret del Paso 3
5. Click "**Save**" o "**Guardar**"
6. **Test el webhook** (botón "Test" si está disponible)

---

## ✅ PASO 7: ¡Prueba!

### Prueba 1: Enviar mensaje de WhatsApp

1. Desde tu teléfono, abre WhatsApp
2. Envía un mensaje al número de Kapso (del Paso 2)
3. Espera 2-3 segundos
4. Ve a tu Dashboard → Conversaciones
5. Deberías ver la conversación nueva ✅

### Prueba 2: Responder desde Resply

1. Ve a la conversación
2. Escribe una respuesta
3. Click en "Enviar"
4. Verifica que llegue a tu WhatsApp ✅

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### ❌ No recibo mensajes en Resply

**Verifica:**
1. ✅ Webhook URL está bien configurada en Kapso
2. ✅ Webhook Secret es el mismo en .env y en Kapso
3. ✅ El canal está activo (status: 'active' en DB)
4. ✅ Los logs no muestran errores: `tail -f .next/server.log`

**Debug:**
```bash
# Ver logs de webhooks
grep "Webhook" .next/server.log

# Probar webhook manualmente
curl -X POST "http://localhost:3000/api/whatsapp/webhooks?channelId=TU_CHANNEL_ID" \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: SIGNATURE" \
  -d '{"test": true}'
```

### ❌ No puedo enviar mensajes

**Verifica:**
1. ✅ KAPSO_API_KEY es correcta
2. ✅ Phone Number ID es correcto
3. ✅ El número de destino tiene formato válido (+123456789)
4. ✅ El cliente no te ha bloqueado

**Debug:**
```bash
# Ver errores de Kapso
grep "Kapso" .next/server.log
```

### ❌ Error "Channel not found"

**Verifica:**
1. ✅ Ejecutaste la conexión del canal correctamente
2. ✅ El channelId en la webhook URL es correcto
3. ✅ El canal existe en la tabla `channels`

**Query para verificar:**
```sql
SELECT id, name, type, status, whatsapp_phone_number_id
FROM channels
WHERE type = 'whatsapp';
```

### ❌ Ngrok no funciona (desarrollo local)

**Alternativas:**
1. **Localtunnel**: `npx localtunnel --port 3000`
2. **Cloudflare Tunnel**: `cloudflared tunnel --url http://localhost:3000`
3. **Serveo**: `ssh -R 80:localhost:3000 serveo.net`

---

## 📊 VERIFICACIÓN FINAL

Checklist completo:

- [ ] Migración SQL ejecutada (campo `metadata` agregado)
- [ ] Variables de entorno configuradas
- [ ] Phone Number ID obtenido de Kapso
- [ ] Webhook Secret generado
- [ ] Canal conectado desde Resply Dashboard
- [ ] Webhook configurado en Kapso Dashboard
- [ ] Prueba de recepción exitosa (WhatsApp → Resply)
- [ ] Prueba de envío exitosa (Resply → WhatsApp)

---

## 🎯 PRÓXIMOS PASOS

Una vez que todo funcione:

1. **Personaliza tu perfil de WhatsApp Business**
2. **Configura respuestas automáticas**
3. **Integra con IA para respuestas inteligentes**
4. **Monitorea métricas de conversación**
5. **Considera migrar a Meta Direct API** cuando tengas >10k mensajes/mes

---

## 🆘 ¿NECESITAS AYUDA?

- **Kapso Docs**: https://docs.kapso.ai
- **Kapso Support**: support@kapso.ai
- **GitHub Issues**: https://github.com/gokapso/whatsapp-cloud-api-js/issues
- **Resply Docs**: Ver [WHATSAPP_SETUP.md](./WHATSAPP_SETUP.md)

---

**Generated with ❤️ by Resply Team**
