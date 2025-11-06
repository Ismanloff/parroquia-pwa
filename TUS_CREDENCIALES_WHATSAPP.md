# 🔐 TUS CREDENCIALES DE WHATSAPP - RESPLY

## ✅ YA CONFIGURADO AUTOMÁTICAMENTE

### ✅ Paso 1: Migración SQL - COMPLETADA ✨
- Campo `metadata` agregado a tabla `messages`
- Índices creados para búsquedas rápidas
- Base de datos lista para WhatsApp

### ✅ Paso 3: Webhook Secret - GENERADO ✨
```
4218c0a1622dff53df5a88015ad8f479bd228cb532f9efa95e546d2985307431
```

### ✅ Paso 4: Variables de Entorno - CONFIGURADAS ✨

Tu archivo `.env.local` ya tiene:
```bash
WHATSAPP_PROVIDER=kapso
KAPSO_API_KEY=c58a272297ecdeed7c7227aeb17aba6309ef109282a41fc87ec793fd97b8c778
KAPSO_WEBHOOK_SECRET=4218c0a1622dff53df5a88015ad8f479bd228cb532f9efa95e546d2985307431
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📝 LO QUE TÚ NECESITAS HACER

### 🔴 Paso 2: Obtener Phone Number ID de Kapso

**Ve a tu Kapso Dashboard:**
1. Abre: https://kapso.ai/dashboard
2. Inicia sesión con tu cuenta
3. Busca sección **"Phone Numbers"** o **"Números"**
4. Si no tienes número:
   - Click en **"Get Phone Number"** o **"Obtener Número"**
   - Selecciona región (USA recomendado)
   - Espera 1-2 minutos
5. **Copia el Phone Number ID**
   - Se ve como: `123456789012345`
   - Está debajo del número de teléfono

**Ejemplo visual:**
```
📞 +1 (555) 123-4567
   Phone Number ID: 123456789012345  ← COPIA ESTE
   Status: Active ✅
```

---

### ⚙️ Paso 5: Conectar Canal desde Dashboard

Una vez que tengas el Phone Number ID:

1. **Inicia tu app:**
   ```bash
   cd /Users/admin/Movies/Proyecto\ SaaS/resply
   npm run dev
   ```

2. **Abre el dashboard:**
   http://localhost:3000/dashboard/channels

3. **Click en "Conectar WhatsApp"**

4. **Llena el formulario:**
   - **Provider**: Kapso (Recomendado) ✅
   - **Channel Name**: "WhatsApp Principal"
   - **Kapso API Key**: `c58a272297ecdeed7c7227aeb17aba6309ef109282a41fc87ec793fd97b8c778`
   - **Phone Number ID**: `[EL QUE COPIASTE EN PASO 2]`
   - **Webhook Secret**: `4218c0a1622dff53df5a88015ad8f479bd228cb532f9efa95e546d2985307431`

5. **Click "Conectar Canal"**

6. **Copia la Webhook URL** que aparece:
   ```
   http://localhost:3000/api/whatsapp/webhooks?channelId=xxx-xxx-xxx
   ```

---

### 🔔 Paso 6: Configurar Webhook en Kapso

1. **Ve a Kapso Dashboard** → https://kapso.ai/dashboard
2. Busca **"Webhooks"** o **"Configuración"**
3. Click **"Add Webhook"** o **"Agregar Webhook"**
4. **Llena el formulario:**
   - **URL**: La que copiaste en Paso 5
   - **Events**: Selecciona:
     - ✅ `messages` (mensajes entrantes)
     - ✅ `message_status` (estado de mensajes)
   - **Secret**: `4218c0a1622dff53df5a88015ad8f479bd228cb532f9efa95e546d2985307431`
5. **Guarda**
6. **Test** (si hay botón de test)

---

### ✅ Paso 7: ¡PRUEBA!

**Prueba de recepción:**
1. Desde tu teléfono, abre WhatsApp
2. Envía mensaje al número de Kapso (del Paso 2)
3. Ve a: http://localhost:3000/dashboard
4. Ve a "Conversaciones"
5. Deberías ver tu mensaje ✅

**Prueba de envío:**
1. Abre la conversación
2. Escribe una respuesta
3. Envía
4. Verifica que llegue a tu WhatsApp ✅

---

## 🆘 SI USAS NGROK (desarrollo local)

Si quieres probar webhooks en localhost, usa ngrok:

```bash
# Terminal 1: Tu app
npm run dev

# Terminal 2: Ngrok
ngrok http 3000

# Copia la URL de ngrok (ej: https://abc123.ngrok.io)
```

Luego actualiza en `.env.local`:
```bash
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```

Y en Kapso usa esta webhook URL:
```
https://abc123.ngrok.io/api/whatsapp/webhooks?channelId=xxx
```

---

## 📚 DOCUMENTACIÓN COMPLETA

- 📖 **Guía Rápida**: [`KAPSO_QUICKSTART.md`](KAPSO_QUICKSTART.md)
- 📘 **Guía Técnica**: [`WHATSAPP_SETUP.md`](WHATSAPP_SETUP.md)
- 📗 **Resumen Implementación**: [`WHATSAPP_IMPLEMENTATION_SUMMARY.md`](WHATSAPP_IMPLEMENTATION_SUMMARY.md)

---

## 🎯 CHECKLIST COMPLETO

- [x] ✅ Migración SQL ejecutada (metadata en messages)
- [x] ✅ Webhook Secret generado
- [x] ✅ Variables de entorno configuradas
- [ ] 🔴 **Obtener Phone Number ID de Kapso** ← TÚ HACES ESTO
- [ ] 🟡 Conectar canal desde dashboard
- [ ] 🟡 Configurar webhook en Kapso
- [ ] 🟢 Probar recepción de mensajes
- [ ] 🟢 Probar envío de mensajes

---

## 📞 RESUMEN DE CREDENCIALES

**API Key (Kapso):**
```
c58a272297ecdeed7c7227aeb17aba6309ef109282a41fc87ec793fd97b8c778
```

**Webhook Secret:**
```
4218c0a1622dff53df5a88015ad8f479bd228cb532f9efa95e546d2985307431
```

**Phone Number ID:**
```
[OBTÉNLO DE KAPSO DASHBOARD - PASO 2]
```

---

**¡TODO LISTO!** Solo necesitas obtener el Phone Number ID y seguir los pasos 5-7. 🚀
