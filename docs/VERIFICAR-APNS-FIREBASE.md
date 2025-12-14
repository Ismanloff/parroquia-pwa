# Guía: Verificar APNs en Firebase Console

Esta guía te ayudará a verificar que Apple Push Notification service (APNs) está correctamente configurado en Firebase para que las notificaciones funcionen en iOS.

## 🎯 ¿Por qué es importante APNs?

En iOS, Firebase no puede enviar notificaciones directamente. En su lugar:

1. Tu servidor → Firebase Cloud Messaging (FCM)
2. FCM → **Apple Push Notification service (APNs)** ← Necesitas configurar esto
3. APNs → iPhone del usuario

Si APNs no está configurado o tiene problemas, las notificaciones nunca llegarán a dispositivos iOS.

---

## 🔍 Paso 1: Acceder a Firebase Console

1. **Ve a**: https://console.firebase.google.com/

2. **Inicia sesión** con tu cuenta de Google

3. **Selecciona tu proyecto**: `app-parro-pwa` (o el nombre de tu proyecto)

![Firebase Console](https://firebase.google.com/static/images/brand-guidelines/logo-standard.png)

---

## ⚙️ Paso 2: Ir a Cloud Messaging Settings

1. En el menú lateral izquierdo, haz clic en el **ícono de engranaje ⚙️**

2. Selecciona **"Project settings"** (Configuración del proyecto)

3. Ve a la pestaña **"Cloud Messaging"**

4. Desplázate hasta la sección **"Apple app configuration"**

![Cloud Messaging Settings](https://firebase.google.com/docs/cloud-messaging/images/fcm-architecture-diagram.png)

---

## 📋 Paso 3: Verificar Configuración de APNs

En la sección "Apple app configuration", verifica lo siguiente:

### 🔑 APNs Authentication Key

Deberías ver una tabla con:

| App ID      | Key ID    | Team ID   | Upload Date  |
| ----------- | --------- | --------- | ------------ |
| (Bundle ID) | ABC123XYZ | DEF456GHI | Oct 15, 2025 |

#### ✅ Qué verificar:

- **Key ID**: Debe ser una cadena de 10 caracteres alfanuméricos (ej: `ABC123XYZ`)
- **Team ID**: Debe ser tu Apple Developer Team ID (10 caracteres, ej: `DEF456GHI`)
- **Upload Date**: ¿Cuándo se subió la key? Si es muy antigua, podría estar expirada
- **Bundle ID**: Debe coincidir con el Bundle ID de tu PWA

#### ❌ Si NO ves ninguna key:

APNs **NO está configurado**. Necesitas:

1. Generar un APNs Authentication Key en Apple Developer
2. Subirlo a Firebase

👉 **Sigue la guía completa**: [FIREBASE-APNS-IOS-SETUP.md](FIREBASE-APNS-IOS-SETUP.md)

---

### 📱 Bundle ID

El **Bundle ID** (App ID) debe coincidir con el que configuraste en:

- Tu archivo `manifest.json` o configuración de PWA
- Apple Developer Portal (si tienes una app nativa también)

**Formatos comunes**:

```
com.tuempresa.pwa
com.parroquia.pwa
com.ejemplo.app
```

⚠️ **IMPORTANTE**: El Bundle ID debe ser exactamente igual (case-sensitive). Si hay una diferencia mínima, las notificaciones fallarán.

---

## 🔧 Paso 4: Verificar que la Key es Válida

### Opción A: Revisar la Fecha de Subida

Las APNs Authentication Keys de Apple **no expiran**, pero pueden ser revocadas manualmente.

1. **Anota la fecha de subida** de tu key en Firebase
2. **Ve a Apple Developer** → [Keys](https://developer.apple.com/account/resources/authkeys/list)
3. **Verifica que la key sigue activa** (debe aparecer en la lista)

Si la key fue revocada en Apple Developer, debes generar una nueva.

---

### Opción B: Enviar una Notificación de Prueba

La forma más segura de verificar es enviar una notificación de prueba:

1. **En tu PWA instalada en iPhone**, ve a `/diagnostico/notificaciones`

2. **Ejecuta el diagnóstico completo**

3. **Observa el paso de "Token FCM"**:
   - ✅ Si obtienes un token → APNs está configurado
   - ❌ Si falla → APNs no está configurado o está mal configurado

4. **Observa la notificación de prueba**:
   - ✅ Si llega → APNs funciona correctamente
   - ❌ Si no llega → Hay un problema con APNs

---

### Opción C: Revisar Logs de Vercel

Si enviaste notificaciones desde `/admin/notifications`:

```bash
vercel logs https://parroquia-pwa.vercel.app
```

**Busca estos mensajes**:

✅ **Notificación exitosa**:

```
✅ [iOS] Token xxx... - Enviado exitosamente
```

❌ **Error de APNs**:

```
❌ [iOS] Token xxx... - Error: Requested entity was not found
```

Este error indica que el token es inválido (probablemente porque APNs no puede procesarlo).

---

## 🔄 Paso 5: Re-configurar APNs (Si es necesario)

Si APNs no está configurado o tiene problemas, sigue estos pasos:

### 1. Genera una nueva APNs Authentication Key

Ve a Apple Developer: https://developer.apple.com/account/resources/authkeys/add

1. **Marca "Apple Push Notifications service (APNs)"**
2. **Haz clic en "Continue"**
3. **Dale un nombre descriptivo** (ej: "Firebase APNs Key - Parroquia PWA")
4. **Haz clic en "Register"**
5. **Descarga el archivo `.p8`** (solo puedes descargarlo UNA vez)
6. **Anota el Key ID** (ej: `ABC123XYZ`)

⚠️ **MUY IMPORTANTE**: Guarda el archivo `.p8` en un lugar seguro. No podrás descargarlo nuevamente.

---

### 2. Sube la Key a Firebase

1. **Ve a Firebase Console** → Project Settings → Cloud Messaging

2. En la sección **"Apple app configuration"**, haz clic en **"Upload"**

3. **Sube el archivo `.p8`** que descargaste

4. **Ingresa**:
   - **Key ID**: El Key ID que anotaste (ej: `ABC123XYZ`)
   - **Team ID**: Tu Apple Developer Team ID ([Encuéntralo aquí](https://developer.apple.com/account/#/membership))
   - **Bundle ID**: El Bundle ID de tu PWA (ej: `com.parroquia.pwa`)

5. **Haz clic en "Upload"**

6. Espera a que Firebase confirme que la key fue subida exitosamente

---

### 3. Verifica la Configuración

Después de subir la nueva key:

1. **Espera 5-10 minutos** para que Firebase propague los cambios

2. **Ve a tu iPhone** y sigue la [Guía de Regenerar Token](REGENERAR-TOKEN-IPHONE.md):
   - Desinstala la PWA
   - Reinstala desde producción
   - Activa notificaciones

3. **Envía una notificación de prueba** desde `/admin/notifications`

4. **Verifica que llegue** al iPhone

---

## 📊 Checklist de Verificación

Usa este checklist para asegurarte de que todo está configurado correctamente:

- [ ] Accediste a Firebase Console → Project Settings → Cloud Messaging
- [ ] Ves una APNs Authentication Key subida en "Apple app configuration"
- [ ] El Key ID tiene exactamente 10 caracteres alfanuméricos
- [ ] El Team ID coincide con tu Apple Developer Team ID
- [ ] El Bundle ID coincide con el de tu PWA
- [ ] La key NO fue revocada en Apple Developer Portal
- [ ] Enviaste una notificación de prueba y llegó al iPhone
- [ ] Los logs de Vercel muestran "✅ [iOS] Token xxx... - Enviado exitosamente"

Si **todos** los items están marcados ✅, tu configuración de APNs es correcta.

---

## ❓ Preguntas Frecuentes

### ¿La APNs Authentication Key expira?

**NO**, las APNs Authentication Keys de Apple no expiran automáticamente. Sin embargo, pueden ser **revocadas manualmente**:

- Por ti en Apple Developer Portal
- Por el administrador de tu cuenta de Apple Developer
- Si cambias de Apple Developer Account

### ¿Puedo tener múltiples keys para diferentes apps?

**SÍ**, puedes crear hasta **2 APNs Authentication Keys** por Apple Developer Account. Puedes usar la misma key para múltiples apps o crear keys separadas.

### ¿Qué diferencia hay entre APNs Auth Key y APNs Certificate?

Hay dos métodos para configurar APNs:

| Método                       | Expira           | Recomendado       |
| ---------------------------- | ---------------- | ----------------- |
| **Authentication Key (.p8)** | ❌ NO            | ✅ SÍ (más fácil) |
| **APNs Certificate (.p12)**  | ✅ SÍ (cada año) | ❌ NO (legacy)    |

Firebase recomienda usar **Authentication Keys** porque no expiran y son más fáciles de gestionar.

### ¿Qué pasa si subo una key incorrecta?

Firebase validará la key al subirla. Si es incorrecta:

- ❌ No se subirá
- ⚠️ Verás un mensaje de error

Si Firebase acepta la key pero las notificaciones no funcionan:

- Verifica que el **Team ID** y **Bundle ID** sean correctos
- Asegúrate de que la key no fue revocada en Apple Developer

### ¿Necesito configurar APNs para Android?

**NO**. APNs es exclusivo de iOS. Para Android, Firebase usa su propio sistema (FCM) que funciona automáticamente sin configuración adicional.

---

## 🆘 Troubleshooting

### Problema: "Requested entity was not found"

**Causa probable**: El token FCM del dispositivo iOS no puede ser procesado por APNs.

**Soluciones**:

1. Verifica que APNs está configurado en Firebase
2. Verifica que el Bundle ID es correcto
3. Regenera el token del iPhone ([ver guía](REGENERAR-TOKEN-IPHONE.md))
4. Revisa que la key no fue revocada en Apple Developer

---

### Problema: "No APNs key configured"

**Causa**: APNs no está configurado en Firebase.

**Solución**: Sigue el [Paso 5](#-paso-5-re-configurar-apns-si-es-necesario) de esta guía.

---

### Problema: Las notificaciones llegan a Android pero no a iOS

**Causa**: Configuración de APNs incorrecta o token inválido.

**Solución**:

1. Verifica APNs en Firebase (esta guía)
2. Regenera el token del iPhone ([ver guía](REGENERAR-TOKEN-IPHONE.md))
3. Usa el diagnóstico completo en `/diagnostico/notificaciones`

---

## 🔗 Enlaces Útiles

- **Firebase Console**: https://console.firebase.google.com/
- **Apple Developer Keys**: https://developer.apple.com/account/resources/authkeys/list
- **Apple Developer Membership**: https://developer.apple.com/account/#/membership (para encontrar Team ID)
- **Guía completa de APNs**: [FIREBASE-APNS-IOS-SETUP.md](FIREBASE-APNS-IOS-SETUP.md)
- **Regenerar token iPhone**: [REGENERAR-TOKEN-IPHONE.md](REGENERAR-TOKEN-IPHONE.md)

---

## 📞 ¿Necesitas más ayuda?

Si después de seguir esta guía las notificaciones aún no funcionan en iOS:

1. **Ejecuta el diagnóstico completo**: `/diagnostico/notificaciones`
2. **Revisa los logs de Vercel**: `vercel logs https://parroquia-pwa.vercel.app`
3. **Verifica la gestión de tokens**: `/admin/tokens`
4. **Consulta los logs de Firebase Console**: https://console.firebase.google.com/project/app-parro-pwa/logs

---

**Última actualización**: 29 Octubre 2025
