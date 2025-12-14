# 🚀 ¿Qué hacer AHORA para arreglar las notificaciones?

Esta guía te dice exactamente qué hacer en este momento para resolver el problema de notificaciones en tu iPhone.

---

## ⏱️ Tiempo estimado: 10-15 minutos

---

## 📱 Paso 1: Identifica el token inválido (2 minutos)

### Desde tu computadora:

1. **Abre el navegador** y ve a:

   ```
   https://parroquia-pwa.vercel.app/admin/tokens
   ```

2. **Busca dispositivos iOS**:
   - Mira la columna "Plataforma"
   - Identifica los que dicen "iOS" o tienen el emoji 📱

3. **Revisa "Último uso"**:
   - Los tokens con "Hace X días (inactivo)" probablemente están inválidos
   - Anota cuántos tokens de iOS tienes

4. **Limpia tokens inválidos**:
   - Click en el botón rojo **"Limpiar tokens inválidos"**
   - Espera 10-20 segundos (verifica cada token con Firebase)
   - Verás cuántos tokens fueron eliminados

✅ **Resultado esperado**: El token inválido del iPhone debe ser eliminado automáticamente.

---

## 🔧 Paso 2: Verifica APNs en Firebase (3 minutos)

### Desde tu computadora:

1. **Ve a Firebase Console**:

   ```
   https://console.firebase.google.com/project/app-parro-pwa/settings/cloudmessaging
   ```

2. **Busca la sección "Apple app configuration"**

3. **Verifica que hay un archivo .p8 subido**:
   - Debe mostrar una tabla con Key ID, Team ID, etc.
   - Si NO hay nada, significa que APNs NO está configurado

4. **Si APNs NO está configurado**:
   - 🔴 **DETENTE AQUÍ**
   - Sigue la guía: [VERIFICAR-APNS-FIREBASE.md](VERIFICAR-APNS-FIREBASE.md)
   - Necesitas configurar APNs primero antes de continuar

5. **Si APNs SÍ está configurado**:
   - ✅ Continúa al siguiente paso

---

## 📲 Paso 3: Reinstala la PWA en tu iPhone (5 minutos)

### Desde tu iPhone:

1. **Desinstala la PWA**:
   - Busca el ícono de la app en tu pantalla de inicio
   - Mantén presionado el ícono
   - Toca "Eliminar app"
   - Confirma

2. **Abre Safari** en tu iPhone

3. **Ve a la URL de PRODUCCIÓN** (¡IMPORTANTE!):

   ```
   https://parroquia-pwa.vercel.app
   ```

   ⚠️ **NO uses**:
   - `localhost:3000`
   - `192.168.x.x:3000`
   - Ninguna IP local

4. **Instala la PWA**:
   - Toca el botón de "Compartir" (cuadrado con flecha ↑)
   - Desplázate y toca "Añadir a pantalla de inicio"
   - Toca "Añadir"

5. **IMPORTANTE**: Abre la app desde el ícono instalado, NO desde Safari

---

## 🔔 Paso 4: Activa notificaciones (2 minutos)

### Desde la PWA instalada en tu iPhone:

1. **Dentro de la app**, ve a Configuración/Ajustes

2. **Busca la sección de Notificaciones**

3. **Activa las notificaciones**:
   - Toca el botón/switch
   - Cuando aparezca el diálogo de iOS, toca **"Permitir"**

4. **Espera el mensaje de confirmación**:
   - Debe decir "Notificaciones activadas" o similar

---

## 🧪 Paso 5: Ejecuta el diagnóstico (3 minutos)

### Desde la PWA instalada en tu iPhone:

1. **Dentro de la app**, ve a:

   ```
   /diagnostico/notificaciones
   ```

2. **Toca "Iniciar Diagnóstico"**

3. **Observa los logs paso a paso**:
   - Deben aparecer varios pasos con ✅ verde
   - Al final, debe enviar una notificación de prueba

4. **¿Recibiste la notificación de prueba?**
   - ✅ **SÍ** → ¡Perfecto! Las notificaciones funcionan. Ve al Paso 6.
   - ❌ **NO** → Toma screenshots de los logs y ve a "Troubleshooting" más abajo.

---

## 🎯 Paso 6: Prueba final (2 minutos)

### Desde tu computadora:

1. **Ve al panel de notificaciones**:

   ```
   https://parroquia-pwa.vercel.app/admin/notifications
   ```

2. **Escribe un mensaje de prueba**:
   - Título: "Prueba final"
   - Mensaje: "Si ves esto, todo funciona!"

3. **Envía la notificación**

4. **Verifica en tu iPhone**:
   - ¿Llegó la notificación?
   - ✅ **SÍ** → ¡ÉXITO! El problema está resuelto.
   - ❌ **NO** → Ve a "Troubleshooting" más abajo.

---

## ✅ ¡Listo!

Si seguiste todos los pasos y la notificación llegó a tu iPhone, el problema está **resuelto**.

### ¿Qué puedes hacer ahora?

- ✅ Enviar notificaciones a todos tus usuarios desde `/admin/notifications`
- ✅ Ver estadísticas de tokens en `/admin/tokens`
- ✅ Usar el diagnóstico `/diagnostico/notificaciones` si alguien reporta problemas

---

## 🆘 Troubleshooting: Si algo falló

### ❌ El diagnóstico falló en el paso "Token FCM"

**Problema**: No se pudo obtener el token FCM.

**Soluciones**:

1. Verifica que APNs está configurado en Firebase (Paso 2)
2. Asegúrate de que abriste la PWA desde el ícono instalado, NO desde Safari
3. Verifica que tu iPhone tiene iOS 16.4 o superior (Settings → General → About)

---

### ❌ La notificación de prueba del diagnóstico no llegó

**Problema**: El token se creó pero la notificación no llegó.

**Soluciones**:

1. Verifica APNs en Firebase siguiendo: [VERIFICAR-APNS-FIREBASE.md](VERIFICAR-APNS-FIREBASE.md)
2. Espera 1-2 minutos (a veces hay retraso)
3. Verifica que no silenciaste las notificaciones en Settings de iOS

---

### ❌ La notificación de prueba llegó del diagnóstico, pero no desde `/admin/notifications`

**Problema**: Hay un problema con el servidor o los logs.

**Soluciones**:

1. Abre la consola del navegador (F12) en `/admin/notifications`
2. Busca errores en rojo
3. Verifica los logs de Vercel:
   ```bash
   vercel logs https://parroquia-pwa.vercel.app
   ```
4. Busca mensajes como: `❌ [iOS] Token xxx... - Error: ...`

---

### ❌ En `/admin/tokens` veo el token del iPhone pero dice "inactivo"

**Problema**: El token está registrado pero no se está usando.

**Soluciones**:

1. Repite el Paso 3 (reinstalar PWA)
2. Asegúrate de instalar desde la URL de producción (NO localhost)
3. Después de reinstalar, limpia tokens inválidos en `/admin/tokens`

---

### ❌ No veo ningún token de iOS en `/admin/tokens`

**Problema**: El token no se guardó en Supabase.

**Soluciones**:

1. Verifica que activaste notificaciones en la PWA (Paso 4)
2. Ejecuta el diagnóstico (Paso 5) y revisa el paso "Guardando en Supabase"
3. Verifica que las RLS policies de Supabase permiten INSERT en la tabla `push_tokens`

---

## 📚 Guías Detalladas

Si necesitas más información:

- **Regenerar token del iPhone**: [REGENERAR-TOKEN-IPHONE.md](REGENERAR-TOKEN-IPHONE.md)
- **Verificar APNs en Firebase**: [VERIFICAR-APNS-FIREBASE.md](VERIFICAR-APNS-FIREBASE.md)
- **Resumen completo del debug**: [DEBUG-NOTIFICACIONES-RESUMEN.md](DEBUG-NOTIFICACIONES-RESUMEN.md)

---

## 💬 ¿Necesitas ayuda?

Si después de seguir todos los pasos el problema persiste:

1. Ejecuta el diagnóstico completo en tu iPhone
2. Toma screenshots de cada paso
3. Revisa los logs de Vercel: `vercel logs https://parroquia-pwa.vercel.app`
4. Comparte los errores específicos que ves

---

**¡Buena suerte! 🚀**

---

**Creado**: 29 Octubre 2025
