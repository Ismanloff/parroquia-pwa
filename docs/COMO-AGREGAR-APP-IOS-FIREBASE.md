# Cómo Agregar App iOS en Firebase Console - Guía Paso a Paso

## Problema

No encuentras dónde registrar/agregar la app iOS en Firebase Console.

---

## Solución: 2 Formas de Hacerlo

### FORMA 1: Desde el Dashboard Principal (MÁS FÁCIL)

#### Paso 1: Ir al Dashboard

1. Ve a: https://console.firebase.google.com/
2. Selecciona tu proyecto: **app-parro-pwa**
3. Deberías estar en el **Dashboard** (página principal)

#### Paso 2: Buscar sección "Get started by adding Firebase to your app"

En el centro de la página verás algo como:

```
┌─────────────────────────────────────────────────────┐
│ Get started by adding Firebase to your app         │
│                                                     │
│  [</>]    [🍎]    [🤖]    [⊕]                     │
│   Web     iOS   Android  Unity                     │
│                                                     │
│  Or view your registered apps below                │
└─────────────────────────────────────────────────────┘
```

**O si ya tienes apps registradas, verás:**

```
┌─────────────────────────────────────────────────────┐
│ Your apps                                           │
│                                                     │
│  🌐 PWA Parroquia (Web)                            │
│                                                     │
│  [+ Add app]                                        │
└─────────────────────────────────────────────────────┘
```

#### Paso 3A: Si ves los íconos (Web, iOS, Android)

1. **Click en el ícono de iOS** (🍎 símbolo de Apple)
2. Te llevará al formulario de registro

#### Paso 3B: Si ves "Your apps" con lista de apps

1. **Click en el botón "+ Add app"**
2. Aparecerá un menú popup:

   ```
   Select a platform to get started

   [🍎 iOS]
   [🤖 Android]
   [🌐 Web]
   [⊕  Unity]
   [⊕  C++]
   ```

3. **Click en "iOS"** (el ícono de Apple)

---

### FORMA 2: Desde Project Settings (ALTERNATIVA)

#### Paso 1: Ir a configuración

1. Click en ⚙️ (Settings/Configuración) en la esquina superior izquierda
2. Seleccionar **"Project settings"**

#### Paso 2: Ir a la sección de apps

1. Deberías estar en tab **"General"** (el primero)
2. Scroll hacia abajo hasta la sección **"Your apps"**

#### Paso 3: Agregar app iOS

Verás una lista de tus apps registradas:

```
Your apps
─────────────────────────────
🌐 Web app
   App nickname: PWA Parroquia
   [⋮]

─────────────────────────────
```

**Abajo de la lista, verás botones:**

```
[+ Add app]  o  [Select a platform to get started]
```

1. **Click en uno de esos botones**
2. Aparecerá menú con opciones: iOS, Android, Web, Unity
3. **Click en "iOS"** (🍎)

---

## Formulario de Registro iOS

Una vez que hagas click en el ícono/botón de iOS, verás este formulario:

```
┌──────────────────────────────────────────────────┐
│ Add Firebase to your Apple app                  │
├──────────────────────────────────────────────────┤
│                                                  │
│ 1. Register app                                  │
│                                                  │
│ Apple bundle ID (required) *                     │
│ [________________________________]               │
│ Example: com.company.productname                 │
│                                                  │
│ App nickname (optional)                          │
│ [________________________________]               │
│ This is only visible to you in the Console      │
│                                                  │
│ App Store ID (optional)                          │
│ [________________________________]               │
│ Enter your 9-digit iTunes Connect App ID        │
│                                                  │
│         [ Cancel ]  [ Register app ]             │
└──────────────────────────────────────────────────┘
```

### Cómo Llenarlo

**1. Apple bundle ID** (OBLIGATORIO):

- Formato: `com.nombredominio.nombreapp`
- **Para tu PWA**: `com.parroquia-pwa.app`
- **IMPORTANTE**: Debe coincidir con el Bundle ID que creaste en Apple Developer Portal

**¿No recuerdas tu Bundle ID de Apple Developer?**

- Ve a: https://developer.apple.com/account/resources/identifiers/list
- Busca tu App ID
- Copia el "Identifier" exacto

**Si AÚN NO has creado el Bundle ID en Apple Developer:**

- Usa: `com.parroquia-pwa.app`
- O: `com.tudominio.parroquia`
- Luego usarás el MISMO en Apple Developer Portal

**2. App nickname** (opcional):

- Ejemplo: `Parroquia PWA iOS`
- Solo para identificar en Firebase Console

**3. App Store ID** (opcional):

- Déjalo **en blanco**
- Solo necesitas esto si publicas en App Store

### Click en "Register app"

1. Click en botón azul **"Register app"**
2. Te llevará a pantalla "Download config file"
   - Puedes hacer click en **"Next"** (no necesitas descargar nada)
3. Siguiente pantalla "Add initialization code"
   - Click **"Next"** (ya lo tenemos configurado)
4. Siguiente pantalla "Install SDK"
   - Click **"Next"**
5. Última pantalla de verificación
   - Click **"Continue to console"**

**¡Listo! Ya tienes la app iOS registrada**

---

## Verificar que se registró correctamente

### Opción 1: Desde Dashboard

Ve al Dashboard principal y deberías ver:

```
Your apps
─────────────────────────
🌐 PWA Parroquia (Web)
🍎 Parroquia PWA iOS (iOS)  ← NUEVO
```

### Opción 2: Desde Project Settings

1. ⚙️ Settings → Project settings
2. Tab "General"
3. Scroll hasta "Your apps"
4. Deberías ver tu app iOS listada

---

## Ahora SÍ puedes configurar APNs

Una vez registrada la app iOS:

1. ⚙️ Settings → **Project settings**
2. Tab **"Cloud Messaging"**
3. Scroll hacia abajo
4. Ahora SÍ verás:

```
──────────────────────────────────────
iOS app configuration

  App: Parroquia PWA iOS
  Bundle ID: com.parroquia-pwa.app

  APNs authentication key
    [ Upload ]                ← AHORA SÍ APARECE
──────────────────────────────────────
```

---

## Troubleshooting

### "No veo ningún ícono de iOS en el Dashboard"

**Posibles causas:**

1. **Ya registraste todas las apps que Firebase permite ver en dashboard**
   - Usa FORMA 2 (Project Settings → General → Your apps → Add app)

2. **No estás en el Dashboard correcto**
   - Verifica que estás en: Firebase Console → [Tu Proyecto] → Overview
   - La URL debe ser: `console.firebase.google.com/project/app-parro-pwa/overview`

3. **Tienes rol Viewer (solo lectura)**
   - Solo Owner y Editor pueden agregar apps
   - Pide acceso al dueño del proyecto

### "No veo el botón + Add app"

**Solución:**

1. Refresca la página (Cmd+R / Ctrl+R)
2. Cierra sesión y vuelve a entrar
3. Prueba en modo incógnito
4. Prueba en otro navegador (Chrome recomendado)

### "Me dice: Bundle ID already in use"

**Causa:** Ese Bundle ID ya está registrado en otro proyecto Firebase

**Solución:**

1. Usa un Bundle ID diferente:
   - `com.parroquia-pwa.app2`
   - `com.tudominio.parroquia-ios`
2. O verifica si ya está registrado en este proyecto
3. O elimina el Bundle ID del otro proyecto (si es tuyo)

---

## Resumen Visual

```
Firebase Console
    ↓
Proyecto: app-parro-pwa
    ↓
Dashboard (Overview)
    ↓
Buscar: "Get started by adding Firebase to your app"
    ↓
Click ícono iOS (🍎)
    ↓
Formulario:
  - Bundle ID: com.parroquia-pwa.app
  - Nickname: Parroquia PWA iOS
    ↓
Register app → Next → Next → Continue
    ↓
✅ App iOS registrada
    ↓
Settings → Project settings → Cloud Messaging
    ↓
Scroll → iOS app configuration
    ↓
APNs authentication key → Upload
    ↓
✅ Listo
```

---

## Siguiente Paso

Una vez que veas tu app iOS registrada:

1. Ve a: Settings → Project settings → Cloud Messaging
2. Scroll hasta "iOS app configuration"
3. Sigue la guía: [FIREBASE-APNS-IOS-SETUP.md](./FIREBASE-APNS-IOS-SETUP.md) desde "Parte 3: Subir APNs Key"

---

## ¿Sigues sin encontrarlo?

Comparte:

1. Una captura de pantalla de tu Dashboard de Firebase
2. O dime qué ves exactamente en tu pantalla

Te ayudaré a encontrar exactamente dónde está el botón.
