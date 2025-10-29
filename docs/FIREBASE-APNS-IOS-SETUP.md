# Configuración de APNs para Notificaciones Push en iOS

## IMPORTANTE: Por qué necesitas esto

Firebase Cloud Messaging **NO PUEDE** enviar notificaciones a iOS Safari/PWA sin configurar APNs (Apple Push Notification service).

Sin esta configuración:

- ❌ El token FCM no se genera en dispositivos iOS
- ❌ Las notificaciones NO llegarán a iPhones/iPads
- ✅ Android/Chrome funcionarán normalmente

---

## Requisitos

### Opción A: Cuenta Apple Developer de Pago ($99 USD/año)

- ✅ Certificados de producción
- ✅ Sin límites
- ✅ Apps en App Store

### Opción B: Cuenta Apple Developer Gratuita

- ✅ Certificados de desarrollo
- ⚠️ Solo para testing
- ⚠️ Limitado a 10 dispositivos
- ⚠️ Certificados expiran cada 7 días

**Para tu PWA parroquial**: Si tienes muchos usuarios iOS, necesitas la cuenta de pago. Si solo son pocos usuarios para probar, la gratuita funciona.

---

## Parte 1: Crear Apple Developer Account

### Si ya tienes cuenta de pago:

Salta a **Parte 2**

### Si NO tienes cuenta:

1. Ve a https://developer.apple.com/
2. Click en "Account" (esquina superior derecha)
3. Inicia sesión con tu Apple ID
4. Acepta los términos y condiciones

**Para cuenta de PAGO**: 5. Click en "Join the Apple Developer Program" 6. Completar registro y pagar $99 USD 7. Esperar confirmación (1-2 días)

**Para cuenta GRATUITA**: 5. Ya puedes continuar con la configuración 6. Solo podrás probar con certificados de desarrollo

---

## Parte 2: Generar APNs Authentication Key (.p8)

### Paso 1: Acceder a Certificates, Identifiers & Profiles

1. Ve a https://developer.apple.com/account/
2. Click en "Certificates, Identifiers & Profiles"

### Paso 2: Crear App Identifier

1. En el menú lateral, click en "Identifiers"
2. Click en botón "+" (agregar)
3. Seleccionar "App IDs" → Continue
4. Seleccionar "App" → Continue
5. Llenar:
   - **Description**: "Parroquia PWA"
   - **Bundle ID**: Seleccionar "Explicit"
   - **Bundle ID value**: `com.tudominio.parroquia` (reemplazar con tu dominio)
   - Ejemplo: `com.parroquia-pwa.app`
6. En "Capabilities", marcar:
   - ✅ **Push Notifications**
7. Click "Continue" → "Register"

### Paso 3: Generar APNs Authentication Key

1. En el menú lateral, click en "Keys"
2. Click en botón "+" (agregar nueva key)
3. Llenar:
   - **Key Name**: "t"
4. Marcar:
   - ✅ **Apple Push Notifications service (APNs)**
5. Click "Continue"
6. Click "Register"
7. **MUY IMPORTANTE**: Click "Download"
   - Se descarga un archivo `.p8` (ej: `AuthKey_ABC123XYZ.p8`)
   - ⚠️ **SOLO SE PUEDE DESCARGAR UNA VEZ** - Guárdalo en lugar seguro
   - Si lo pierdes, debes crear una nueva key

8. **Anotar estos valores**:
   - **Key ID**: Código de 10 caracteres (ej: `ABC123XYZ`)
   - **Team ID**: Está en la esquina superior derecha de la página
     - O ve a: Account > Membership > Team ID

---

## Parte 3: Subir APNs Key a Firebase

### Paso 1: Ir a Firebase Console

1. Ve a https://console.firebase.google.com/
2. Selecciona tu proyecto: "app-parro-pwa"
3. Click en ⚙️ (Settings) → "Project settings"
4. Click en tab "Cloud Messaging"

### Paso 2: Configurar iOS App (si no existe)

1. Scroll hasta "iOS app configuration"
2. Si NO tienes una app iOS registrada:
   - Volver al Dashboard
   - Click en ícono de iOS (🍎)
   - **Apple bundle ID**: Usar el mismo que creaste antes
     - Ejemplo: `com.parroquia-pwa.app`
   - **App nickname**: "Parroquia PWA iOS"
   - Click "Register app" → "Continue" → "Continue" → "Continue to console"

### Paso 3: Subir APNs Authentication Key

1. De vuelta en "Project settings" → "Cloud Messaging"
2. Buscar sección "APNs authentication key"
3. Click "Upload" o botón de carga
4. Llenar el formulario:
   - **APNs auth key (.p8 file)**: Click "Browse" y seleccionar tu archivo `.p8`
   - **Key ID**: Tu Key ID de 10 caracteres (ej: `ABC123XYZ`)
   - **Team ID**: Tu Team ID de Apple Developer
5. Click "Upload"

**Si todo está correcto**:

- ✅ Verás mensaje: "APNs certificate uploaded successfully"
- ✅ Verás tu Key ID y fecha de subida

---

## Parte 4: Verificar Configuración

### En Firebase Console:

1. Project Settings → Cloud Messaging
2. Verificar:
   - ✅ **Web Push certificates**: VAPID key generada
   - ✅ **iOS app configuration**: Bundle ID registrado
   - ✅ **APNs authentication key**: Key ID subida

### En tu código:

Todo el código ya está listo. No necesitas cambiar nada en:

- `lib/firebase/config.ts`
- `lib/firebase/messaging.ts`
- `public/firebase-messaging-sw.js`

Firebase automáticamente detecta iOS y usa APNs en lugar de Web Push.

---

## Parte 5: Probar en iOS

### Paso 1: Desplegar a producción

```bash
# Si ya hiciste cambios locales
git add .
git commit -m "docs: Agregar configuración APNs para iOS"
git push
```

### Paso 2: Abrir PWA en iPhone

1. Abre Safari en tu iPhone
2. Ve a: https://parroquia-pwa.vercel.app
3. Si NO está instalada:
   - Compartir → "Agregar a pantalla de inicio"
   - Click "Agregar"
4. Abre la PWA desde el ícono en pantalla de inicio

### Paso 3: Activar notificaciones

1. Espera 5 segundos o ve a: `/configuracion/notificaciones`
2. Click "Activar notificaciones"
3. iOS pedirá permiso → Click "Permitir"

**Si funciona**:

- ✅ Verás toast verde: "Notificaciones activadas"
- ✅ En `/admin/notifications` verás "1 dispositivo registrado"

**Si NO funciona**:

1. Abre Safari en Mac
2. Conecta tu iPhone con cable
3. Safari (Mac) → Develop → [Tu iPhone] → [Parroquia PWA]
4. Ve a consola y busca errores

### Paso 4: Enviar notificación de prueba

1. Desde otro dispositivo (o Mac)
2. Ve a: https://parroquia-pwa.vercel.app/admin/notifications
3. Llenar:
   - **Título**: "Prueba iOS"
   - **Mensaje**: "Si ves esto, funciona!"
   - **URL destino**: `/`
4. Click "Enviar a todos"

**Deberías ver la notificación en tu iPhone**:

- Banner en la parte superior
- Sonido (si no está en silencio)
- Click en la notificación → abre la PWA

---

## Troubleshooting

### Error: "No se pudo obtener token FCM" en iOS

**Causa**: APNs no configurado o Key incorrecta

**Solución**:

1. Verificar en Firebase Console que APNs key está subida
2. Verificar que Key ID y Team ID son correctos
3. Verificar que el Bundle ID coincide

### Error: "APNs certificate expired"

**Causa**: Estás usando certificado de desarrollo (cuenta gratuita)

**Solución**:

1. Los certificados de desarrollo expiran cada 7 días
2. Debes generar nueva APNs key cada semana
3. O actualizar a cuenta de pago para certificados permanentes

### Notificaciones funcionan en Android pero no en iOS

**Causa**: APNs no configurado

**Solución**:

1. Seguir esta guía completa
2. Verificar que subiste el archivo .p8 correctamente
3. Esperar 5-10 minutos después de subir (Firebase puede tardar en propagarse)

### Error: "Bundle ID already registered"

**Causa**: Ya registraste ese Bundle ID antes

**Solución**:

1. Usar el mismo Bundle ID existente
2. O crear uno nuevo con sufijo (ej: `com.parroquia-pwa.app2`)

---

## Alternativa: Certificado .p12 (Método Legacy)

Si prefieres usar certificados .p12 en lugar de .p8:

### Ventajas de .p8 (recomendado):

- ✅ No expira
- ✅ Se puede usar en múltiples apps
- ✅ Más fácil de mantener

### Ventajas de .p12:

- ✅ Más compatible con servicios antiguos
- ⚠️ Expira cada año
- ⚠️ Más complejo de generar

**Recomendación**: Usa .p8 (AuthKey) como describe esta guía.

---

## FAQ

### ¿Necesito esto para desarrollo local?

No, solo para que funcione en dispositivos iOS reales. Chrome/Android funcionan sin APNs.

### ¿Los certificados expiran?

- **APNs Authentication Key (.p8)**: NO expira (recomendado)
- **APNs Certificate (.p12)**: Expira cada año

### ¿Puedo usar la misma key para múltiples proyectos?

Sí, una APNs key puede usarse para múltiples apps del mismo Team ID.

### ¿Qué pasa si no configuro APNs?

- Android/Chrome: ✅ Funciona normal
- iOS Safari/PWA: ❌ No funcionan las notificaciones

### ¿Funciona con cuenta Apple gratuita?

Sí, pero solo para desarrollo/testing con limitaciones:

- Máximo 10 dispositivos
- Certificados expiran cada 7 días
- No apto para producción con muchos usuarios

---

## Resumen de archivos necesarios

Después de completar esta guía, deberías tener:

1. ✅ **AuthKey_XXXXX.p8**: Archivo descargado (guardado en lugar seguro)
2. ✅ **Key ID**: Código de 10 caracteres
3. ✅ **Team ID**: Tu Team ID de Apple Developer
4. ✅ **Bundle ID**: ID único de tu app (ej: `com.parroquia-pwa.app`)
5. ✅ APNs key subida a Firebase Console

---

## Siguiente paso

Una vez configurado APNs, las notificaciones deberían funcionar en iOS. Si tienes problemas:

1. Ejecutar script de diagnóstico (ver `IOS-DEBUG.md`)
2. Verificar logs en consola de Safari
3. Verificar que el Bundle ID coincide en todos lados
4. Esperar 10 minutos después de subir APNs key a Firebase

---

**¿Dudas?** Contacta al desarrollador o revisa:

- [Firebase iOS Setup](https://firebase.google.com/docs/cloud-messaging/ios/client)
- [Apple Push Notifications](https://developer.apple.com/documentation/usernotifications)
