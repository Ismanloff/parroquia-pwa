# 🔔 Configuración de Firebase Cloud Messaging

Esta guía te ayudará paso a paso a configurar Firebase para enviar notificaciones push a tu PWA.

---

## 📋 Requisitos Previos

- Cuenta de Google
- Acceso a https://console.firebase.google.com/
- Acceso a tu proyecto en Supabase

---

## 🚀 Parte 1: Crear Proyecto Firebase

### Paso 1: Acceder a Firebase Console

1. Ve a https://console.firebase.google.com/
2. Inicia sesión con tu cuenta de Google

### Paso 2: Crear Nuevo Proyecto

1. Click en "Agregar proyecto" o "Create a project"
2. **Nombre del proyecto**: "App Parroquial" (o el que prefieras)
3. Click "Continuar"
4. **Google Analytics**:
   - ✅ ACTIVAR (recomendado para ver estadísticas de notificaciones)
   - Seleccionar cuenta existente o crear nueva
5. Click "Crear proyecto"
6. Esperar 30-60 segundos mientras se crea
7. Click "Continuar"

---

## 🌐 Parte 2: Agregar App Web

### Paso 1: Registrar App Web

1. En el Dashboard de Firebase, busca el botón con ícono `</>`
2. Click en "Web" (icono con símbolo de HTML)
3. **Apodo de la app**: "PWA Parroquia"
4. ✅ **IMPORTANTE**: Marcar "También configurar Firebase Hosting"
5. Click "Registrar app"

### Paso 2: Copiar Configuración

Verás un código como este:

```javascript
const firebaseConfig = {
  apiKey: 'AIzaSyBxxxxxxxxxxxxxxxxxxxxxx',
  authDomain: 'app-parroquial.firebaseapp.com',
  projectId: 'app-parroquial',
  storageBucket: 'app-parroquial.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef123456',
  measurementId: 'G-XXXXXXXXXX',
};
```

⚠️ **GUARDA ESTOS VALORES** - Los necesitarás en el siguiente paso.

---

## 🔔 Parte 3: Habilitar Cloud Messaging

### Paso 1: Activar Servicio

1. En el menú lateral izquierdo, busca "Messaging" o "Mensajería"
2. Si pregunta "¿Empezar?", click en "Empezar" o "Get Started"
3. Ya está listo para recibir/enviar notificaciones

### Paso 2: Generar Clave VAPID

1. Click en ⚙️ (Settings/Configuración) en la parte superior
2. Seleccionar "Configuración del proyecto" o "Project settings"
3. Click en tab "Cloud Messaging"
4. Buscar sección "Web Push certificates" o "Certificados Web Push"
5. Click "Generar par de claves" o "Generate key pair"
6. **Copiar la clave que aparece** (algo como: `BNxxx...xxx`)

### Paso 3: Obtener Server Key (Legacy)

1. Sigue en tab "Cloud Messaging"
2. Buscar sección "Cloud Messaging API (Legacy)"
3. Si dice "Cloud Messaging API (Legacy) is disabled":
   - Click en los 3 puntitos (⋮) al lado
   - Seleccionar "Manage API in Google Cloud Console"
   - Click "ENABLE" (Habilitar)
   - Volver a Firebase Console
4. Copiar "Server key"

⚠️ **IMPORTANTE**: Esta Server Key es SECRETA. No la compartas ni la subas a Git.

---

## 📝 Parte 4: Actualizar Variables de Entorno

### Archivo: `.env.local`

Abre tu archivo `.env.local` y actualiza las siguientes variables:

```env
# Firebase Cloud Messaging (Push Notifications)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=app-parroquial.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=app-parroquial
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=app-parroquial.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BNxxx...xxx

# Firebase Server Key (Legacy) - MANTENER EN SECRETO
FIREBASE_SERVER_KEY=AAAAxxxx...xxxx
```

**Reemplaza todos los valores** con los que copiaste de Firebase Console.

---

## 🔧 Parte 5: Actualizar Service Worker

### Archivo: `public/firebase-messaging-sw.js`

Abre el archivo `public/firebase-messaging-sw.js` y actualiza la configuración (líneas 13-19):

```javascript
firebase.initializeApp({
  apiKey: 'AIzaSyBxxxxxxxxxxxxxxxxxxxxxx',
  authDomain: 'app-parroquial.firebaseapp.com',
  projectId: 'app-parroquial',
  storageBucket: 'app-parroquial.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef123456',
});
```

**⚠️ IMPORTANTE**: Deben ser los MISMOS valores que pusiste en `.env.local`.

---

## 💾 Parte 6: Crear Tabla en Supabase

### Paso 1: Abrir SQL Editor

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Click en "SQL Editor" en el menú lateral

### Paso 2: Ejecutar SQL

1. Click en "New Query" o "+ New query"
2. Copiar TODO el contenido del archivo `supabase/push_tokens_table.sql`
3. Pegar en el editor
4. Click "Run" o "Ejecutar"
5. Deberías ver: "Success. No rows returned"

### Paso 3: Verificar Tabla

1. Click en "Table Editor" en el menú lateral
2. Deberías ver la tabla `push_tokens` en la lista
3. Columnas:
   - `id` (uuid)
   - `token` (text)
   - `user_agent` (text)
   - `created_at` (timestamptz)
   - `last_used` (timestamptz)

---

## ✅ Parte 7: Verificar Configuración

### Checklist de Configuración

- [ ] Proyecto Firebase creado
- [ ] App Web registrada en Firebase
- [ ] Cloud Messaging habilitado
- [ ] Clave VAPID generada
- [ ] Server Key obtenida
- [ ] `.env.local` actualizado con 9 variables
- [ ] `public/firebase-messaging-sw.js` actualizado
- [ ] Tabla `push_tokens` creada en Supabase

---

## 🧪 Parte 8: Probar en Desarrollo

### Paso 1: Reiniciar Servidor

```bash
# Detener servidor si está corriendo (Ctrl+C)
npm run dev
```

### Paso 2: Abrir la App

1. Abrir navegador en `http://localhost:3000`
2. Esperar 5 segundos
3. Debería aparecer banner morado: "Activa las notificaciones"
4. Click en "Activar"
5. El navegador pedirá permiso → Click "Permitir"

**Si funciona**:

- ✅ Verás toast verde: "Notificaciones activadas"
- ✅ En consola del navegador: "Token FCM obtenido: ..."
- ✅ En Supabase → Table Editor → `push_tokens` → deberías ver 1 registro nuevo

**Si NO funciona**:

- ❌ Ver sección de Troubleshooting abajo

---

## 📤 Parte 9: Enviar Primera Notificación

### Opción A: Desde Panel Admin (Fácil)

1. Ir a `http://localhost:3000/admin/notifications`
2. Llenar formulario:
   - **Título**: "Prueba de notificación"
   - **Mensaje**: "¡Funciona!"
   - **URL destino**: `/` (Inicio)
3. Click "Enviar a todos"
4. Deberías ver notificación en tu dispositivo

### Opción B: Desde Firebase Console

1. Ir a Firebase Console → Messaging
2. Click "New campaign" → "Notifications"
3. Llenar:
   - **Notification title**: "Prueba"
   - **Notification text**: "Mensaje de prueba"
4. Click "Next"
5. En "Target", seleccionar tu app web
6. Click "Review" → "Publish"

---

## 🚨 Troubleshooting

### Error: "Push notifications no soportadas en este navegador"

**Causa**: Navegador no soporta notificaciones
**Solución**: Usar Chrome, Edge, Firefox, Safari 16.4+

### Error: "No se pudo obtener token FCM"

**Causa**: Credenciales Firebase incorrectas o VAPID key inválida
**Solución**:

1. Verificar que `.env.local` tiene valores correctos
2. Verificar que `public/firebase-messaging-sw.js` tiene valores correctos
3. Reiniciar servidor (`npm run dev`)

### Error: "Service Worker registration failed"

**Causa**: Error en `public/firebase-messaging-sw.js`
**Solución**:

1. Abrir DevTools → Console
2. Ver error específico
3. Verificar sintaxis del archivo
4. Verificar que Firebase config no tiene comillas mal cerradas

### Banner no aparece

**Causa**: Varios posibles
**Solución**:

1. Verificar que pasaron 5 segundos
2. Verificar que NO tienes permiso YA concedido
3. Abrir DevTools → Application → Clear site data
4. Recargar página

### Notificaciones no llegan

**Causa**: Token no guardado en BD
**Solución**:

1. Verificar tabla en Supabase tiene registros
2. Ver consola del navegador buscando errores
3. Verificar FIREBASE_SERVER_KEY en `.env.local`

---

## 📱 Parte 10: Deploy a Producción

### Paso 1: Agregar Variables a Vercel

```bash
# En tu terminal
vercel env add FIREBASE_SERVER_KEY

# Pegar tu Server Key cuando lo pida
# Seleccionar: Production, Preview, Development
```

Las variables `NEXT_PUBLIC_FIREBASE_*` ya están en `.env.local` y se subirán automáticamente.

### Paso 2: Deploy

```bash
git add .
git commit -m "feat: Agregar Push Notifications con Firebase"
git push
```

Vercel detectará el push y deployará automáticamente.

### Paso 3: Probar en Producción

1. Abrir tu dominio en producción (ej: `https://tu-app.vercel.app`)
2. Instalar la PWA si no lo hiciste antes
3. Banner de notificaciones debería aparecer después de 5s
4. Activar notificaciones
5. Ir a `/admin/notifications` y enviar una prueba

---

## 🎯 Siguientes Pasos

Una vez configurado Firebase, puedes:

1. **Enviar notificaciones manuales**:
   - Acceder a `/admin/notifications`
   - Usar plantillas rápidas
   - Personalizar título, mensaje y URL

2. **Automatizar notificaciones** (opcional):
   - Cuando agregas evento nuevo → enviar notificación
   - Recordatorios de misas importantes
   - Anuncios parroquiales

3. **Ver estadísticas en Firebase**:
   - Firebase Console → Analytics
   - Ver cuántas notificaciones se abrieron
   - Tasa de conversión

---

## 📚 Recursos Adicionales

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications Guide](https://web.dev/push-notifications-overview/)
- [Service Workers MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

## ⚠️ Importante para iOS

**iOS 16.4+** soporta notificaciones push en PWAs, pero con limitaciones:

- ✅ Solo funciona si la PWA está instalada (ícono en pantalla de inicio)
- ✅ Usuario debe dar permisos explícitos
- ❌ No funciona en Safari normal (solo en PWA instalada)
- ❌ No hay sonido personalizado
- ❌ No hay vibración personalizada

**Android** tiene soporte completo sin limitaciones.

---

**¿Problemas?** Revisa la sección de Troubleshooting arriba o abre un issue en GitHub.
