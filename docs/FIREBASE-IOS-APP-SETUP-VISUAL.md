# Guía Visual: Registrar App iOS en Firebase y Subir APNs

## Problema Común

La sección "APNs authentication key" **NO aparece** hasta que registres una app iOS en Firebase.

---

## Paso 1: Verificar si tienes app iOS registrada

1. Ve a **Firebase Console**: https://console.firebase.google.com/
2. Selecciona tu proyecto: **app-parro-pwa**
3. En el Dashboard principal, busca la sección "Your apps" o "Tus aplicaciones"

**¿Ves algo como esto?**

```
Your apps:
  📱 iOS app     ← SI VES ESTO, salta al Paso 3
  🌐 Web app (PWA Parroquia)
```

**Si NO ves "iOS app", continúa con Paso 2**

---

## Paso 2: Registrar App iOS en Firebase

### 2.1 Click en agregar app iOS

En el Dashboard principal:

1. Busca el ícono de iOS (🍎 o símbolo de Apple)
2. O click en "Add app" → Seleccionar iOS

### 2.2 Llenar formulario de registro

**Información requerida:**

1. **iOS bundle ID** (OBLIGATORIO):
   - Formato: `com.tudominio.nombre`
   - Ejemplo: `com.parroquia-pwa.app`
   - Debe coincidir con el Bundle ID que creaste en Apple Developer Portal

   **¿No recuerdas tu Bundle ID?**
   - Ve a: https://developer.apple.com/account/resources/identifiers/list
   - Inicia sesión
   - Busca tu App ID
   - Copia el "Bundle ID" exacto

2. **App nickname** (opcional):
   - Ejemplo: "Parroquia PWA iOS"
   - Solo para identificar la app en Firebase Console

3. **App Store ID** (opcional):
   - Déjalo en blanco (solo si publicas en App Store)

### 2.3 Registrar la app

1. Click en "Register app"
2. Verás pantalla de "Download config file" → Click "Next" (no necesitamos descargar nada)
3. Click "Next" en todas las pantallas siguientes
4. Click "Continue to console"

**Listo! Ya tienes la app iOS registrada**

---

## Paso 3: Ahora SÍ verás la sección APNs

### 3.1 Ir a configuración del proyecto

1. Click en ⚙️ (Settings/Configuración) arriba a la izquierda
2. Seleccionar "Project settings"
3. Click en tab "Cloud Messaging"

### 3.2 Scroll hasta encontrar tu app iOS

Verás algo como:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Web configuration
  Web Push certificates
    [Tu VAPID key aquí]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
iOS app configuration              ← AQUÍ ESTÁ

  App: Parroquia PWA iOS
  Bundle ID: com.parroquia-pwa.app

  APNs authentication key           ← LO QUE BUSCAS
    [ Upload ] ← ESTE BOTÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3.3 Subir APNs Authentication Key

1. Click en botón "Upload" en la sección "APNs authentication key"

2. **Formulario que aparecerá:**

   ```
   Upload APNs authentication key

   APNs authentication key (.p8)
   [Browse...] ← Selecciona tu archivo AuthKey_XXXXX.p8

   Key ID
   [________] ← Tu Key ID de 10 caracteres (ej: ABC123XYZ)

   Team ID
   [________] ← Tu Team ID de Apple Developer

   [ Cancel ]  [ Upload ]
   ```

3. **Llenar los campos:**

   **APNs auth key (.p8 file)**:
   - Click "Browse"
   - Selecciona el archivo `.p8` que descargaste de Apple Developer
   - Nombre típico: `AuthKey_ABC123XYZ.p8`

   **Key ID**:
   - El código de 10 caracteres
   - Está en el nombre del archivo: AuthKey\_**ABC123XYZ**.p8
   - También está visible en Apple Developer Portal → Certificates, Identifiers & Profiles → Keys

   **Team ID**:
   - Está en Apple Developer Portal
   - Esquina superior derecha de cualquier página
   - O ve a: Account → Membership → Team ID
   - Formato: 10 caracteres alfanuméricos (ej: `AB1CD2EF3G`)

4. Click "Upload"

**Si todo está correcto:**

- ✅ Mensaje: "APNs authentication key uploaded successfully"
- ✅ Verás tu Key ID y fecha de subida
- ✅ Estado: "APNs authentication key configured"

---

## Paso 4: Verificar configuración completa

En "Project settings" → "Cloud Messaging" deberías ver:

```
✅ Web Push certificates: Configured
✅ iOS app configuration: Configured
✅ APNs authentication key: Uploaded
```

---

## Troubleshooting

### "No encuentro la sección iOS app configuration"

**Causa**: No registraste la app iOS

**Solución**:

1. Volver al Paso 2
2. Registrar app iOS con Bundle ID correcto
3. Refrescar la página
4. Volver a Project Settings → Cloud Messaging

---

### "Error: Invalid APNs certificate"

**Causa**: Archivo .p8 corrupto o incorrecto

**Solución**:

1. Descargar nuevamente el archivo .p8 de Apple Developer (usar Safari)
2. NO editar el archivo
3. Verificar que la extensión sea `.p8` (no `.txt` o `.p8.txt`)
4. Intentar nuevamente

---

### "Error: Key ID or Team ID is invalid"

**Causa**: Key ID o Team ID incorrectos

**Solución**:

1. **Key ID**: Verificar en Apple Developer Portal → Keys → Tu key
2. **Team ID**: Account → Membership → Team ID
3. Copiar y pegar exactamente (sin espacios)
4. Verificar que sean los valores correctos para esa key

---

### "No veo el botón Upload"

**Posibles causas**:

1. **Ya subiste una key**:
   - Verás "APNs authentication key configured"
   - Para cambiarla: Click en los 3 puntos (⋮) → "Replace key"

2. **No tienes permisos**:
   - Solo Owner y Editor pueden subir keys
   - Pide acceso al admin del proyecto Firebase

3. **Navegador/Cache**:
   - Refrescar página (Cmd+R / Ctrl+R)
   - Probar en modo incógnito
   - Probar en otro navegador

---

## Resumen Visual del Flujo

```
1. Dashboard Firebase
   ↓
2. ¿Hay app iOS registrada?
   ├─ NO → Agregar app iOS (Paso 2)
   └─ SÍ → Continuar
   ↓
3. ⚙️ Settings → Project settings
   ↓
4. Tab "Cloud Messaging"
   ↓
5. Scroll hasta "iOS app configuration"
   ↓
6. Sección "APNs authentication key"
   ↓
7. Click "Upload"
   ↓
8. Llenar formulario:
   - .p8 file
   - Key ID (10 caracteres)
   - Team ID (10 caracteres)
   ↓
9. Click "Upload"
   ↓
10. ✅ Listo!
```

---

## Siguiente Paso

Una vez que veas "APNs authentication key: Configured":

1. ✅ Configuración completada
2. ✅ Esperar 5-10 minutos para que Firebase propague los cambios
3. ✅ Abrir PWA en iPhone
4. ✅ Ir a `/configuracion/notificaciones`
5. ✅ Activar notificaciones
6. ✅ Verificar en consola que ahora SÍ se genera el token FCM

---

## ¿Necesitas ayuda adicional?

**Si sigues sin ver la sección**:

1. Comparte screenshot de tu Firebase Console → Project Settings → Cloud Messaging
2. Verifica que estás en el proyecto correcto: **app-parro-pwa**
3. Verifica tu rol en el proyecto: Owner o Editor (no Viewer)

**Si no has creado el Bundle ID en Apple Developer**:

1. Primero completa Apple Developer Portal setup
2. Luego registra app iOS en Firebase
3. Luego sube APNs key
