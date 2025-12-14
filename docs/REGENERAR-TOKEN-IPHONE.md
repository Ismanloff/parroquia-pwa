# Guía: Regenerar Token FCM en iPhone

Esta guía te ayudará a regenerar el token FCM (Firebase Cloud Messaging) de tu iPhone cuando las notificaciones dejen de funcionar.

## ⚠️ ¿Cuándo necesitas regenerar el token?

Debes regenerar el token del iPhone en los siguientes casos:

- ❌ Las notificaciones funcionaban antes pero ahora no llegan
- ❌ Ves el error "Requested entity was not found" en los logs del servidor
- ❌ El token aparece como inválido en la página de gestión de tokens
- ❌ Reinstalaste la PWA desde una URL diferente (localhost → producción, o viceversa)
- ❌ Cambiaste de red WiFi o IP local durante el desarrollo
- ❌ Revocaste y volviste a otorgar permisos de notificaciones

## 📱 Pasos para Regenerar el Token

### Paso 1: Desinstalar la PWA del iPhone

1. **Localiza el ícono de la PWA** en tu pantalla de inicio
2. **Mantén presionado** el ícono hasta que aparezca el menú contextual
3. **Toca "Eliminar app"**
4. **Confirma** que quieres eliminar la app

![Eliminar PWA](https://support.apple.com/library/content/dam/edam/applecare/images/en_US/iOS/ios-17-iphone-14-pro-delete-app-home-screen.png)

---

### Paso 2: Limpiar Datos de Safari (Opcional pero Recomendado)

Esto asegura que no haya datos en caché que puedan causar problemas:

1. **Abre "Ajustes"** en tu iPhone
2. **Ve a Safari → Avanzado → Datos de sitios web**
3. **Busca** `parroquia-pwa.vercel.app` (o la URL de tu PWA)
4. **Desliza a la izquierda** y toca "Eliminar"
5. Alternativamente, puedes tocar **"Eliminar todos los datos"** (esto eliminará datos de todos los sitios)

![Limpiar datos Safari](https://support.apple.com/library/content/dam/edam/applecare/images/en_US/iOS/ios-17-iphone-14-pro-safari-advanced-website-data.png)

---

### Paso 3: Reinstalar la PWA

1. **Abre Safari** en tu iPhone
2. **Navega a la URL de producción** de tu PWA:

   ```
   https://parroquia-pwa.vercel.app
   ```

   ⚠️ **IMPORTANTE**: Usa SIEMPRE la URL de producción (Vercel), NO uses:
   - `localhost:3000`
   - `192.168.x.x:3000`
   - Direcciones IP locales

   Los tokens generados desde URLs locales no funcionan en producción.

3. **Toca el botón de "Compartir"** (el ícono de cuadrado con flecha hacia arriba)

4. **Desplázate hacia abajo** y toca **"Añadir a pantalla de inicio"**

5. **Personaliza el nombre** (opcional) y toca **"Añadir"**

![Añadir a pantalla de inicio](https://support.apple.com/library/content/dam/edam/applecare/images/en_US/iOS/ios-17-iphone-14-pro-safari-add-to-home-screen.png)

---

### Paso 4: Abrir la PWA Instalada

⚠️ **MUY IMPORTANTE**: Debes abrir la app desde el ícono en la pantalla de inicio, NO desde Safari.

1. **Busca el ícono de la PWA** en tu pantalla de inicio
2. **Toca el ícono** para abrir la app
3. Espera a que la app cargue completamente
4. Verifica que estás en modo "standalone" (sin barras de Safari visible)

---

### Paso 5: Activar Notificaciones

Ahora que tienes la PWA instalada, activa las notificaciones:

1. **Dentro de la PWA**, ve a **Configuración** o **Ajustes**

2. **Busca la sección de "Notificaciones"**

3. **Activa las notificaciones** tocando el botón/switch

4. Cuando aparezca el **diálogo de permisos de iOS**, toca **"Permitir"**

   ![Permisos iOS](https://developer.apple.com/design/human-interface-guidelines/images/app-programming/notifications/notifications-intro_2x.png)

5. Espera a que veas el mensaje de confirmación: "Notificaciones activadas"

---

### Paso 6: Verificar el Nuevo Token

Para confirmar que el token se generó correctamente:

1. **Ve a la página de diagnóstico** dentro de la PWA:

   ```
   /diagnostico/notificaciones
   ```

2. **Toca "Iniciar Diagnóstico"**

3. **Revisa los logs** paso a paso:
   - ✅ Service Worker registrado
   - ✅ Token FCM obtenido
   - ✅ Token guardado en Supabase
   - ✅ Notificación de prueba enviada

4. **Deberías ver una notificación de prueba** en tu iPhone en unos segundos

---

### Paso 7: Eliminar el Token Antiguo (Desde Admin)

Si tienes acceso al panel de administración:

1. **Ve a** `/admin/tokens`

2. **Identifica el token antiguo** del iPhone (probablemente el que tiene más días de inactividad)

3. **Toca "Eliminar"** en el token antiguo

   O bien:

4. **Toca "Limpiar tokens inválidos"** para eliminar automáticamente todos los tokens que no funcionan

---

## 🎯 Verificación Final

Para confirmar que todo funciona:

### Opción A: Desde el Panel de Notificaciones

1. **Ve a** `/admin/notifications`
2. **Escribe un mensaje de prueba**
3. **Envía la notificación**
4. **Verifica que llegue a tu iPhone** en unos segundos

### Opción B: Revisar Logs del Servidor

Si tienes acceso a los logs de Vercel:

```bash
vercel logs https://parroquia-pwa.vercel.app
```

Deberías ver:

```
✅ [iOS] Token xxx... - Enviado exitosamente
```

En lugar de:

```
❌ [iOS] Token xxx... - Error: Requested entity was not found
```

---

## ❓ Preguntas Frecuentes

### ¿Por qué se invalidó mi token anterior?

Los tokens FCM pueden invalidarse por varias razones:

- **Desinstalación**: Cuando desinstalas la PWA
- **Revocación de permisos**: Si denegaste y luego permitiste notificaciones nuevamente
- **Cambio de URL**: Si instalaste desde localhost y luego usas producción
- **Expiración**: Los tokens pueden expirar después de cierto tiempo de inactividad
- **Cambios en el servidor**: Modificaciones en la configuración de Firebase

### ¿Puedo tener múltiples tokens del mismo dispositivo?

Sí, técnicamente puedes tener múltiples tokens si:

- Instalas y desinstalas la PWA repetidamente
- Cambias entre URLs diferentes (localhost ↔ producción)
- El token antiguo no se elimina de la base de datos

**Recomendación**: Usa el botón "Limpiar tokens inválidos" en `/admin/tokens` para eliminar tokens obsoletos.

### ¿Qué diferencia hay entre instalar desde localhost vs producción?

- **Desde localhost/IP local**: El token generado solo funciona en tu red local
- **Desde producción (Vercel)**: El token funciona globalmente

⚠️ **IMPORTANTE**: Siempre instala la PWA desde la URL de producción para usuarios finales.

### ¿El token es seguro de compartir?

**NO**. El token FCM es como una "llave" para enviar notificaciones a ese dispositivo específico.

- ✅ Está bien guardarlo en tu base de datos (Supabase)
- ❌ No lo compartas públicamente
- ❌ No lo incluyas en repos públicos
- ✅ Usa HTTPS para transmitirlo

### ¿Con qué frecuencia debo regenerar tokens?

**No es necesario regenerarlos regularmente**. Solo regenera un token cuando:

- Dejes de recibir notificaciones
- Veas errores en los logs del servidor
- Cambies la configuración de APNs en Firebase

---

## 🔗 Enlaces Útiles

- **Página de diagnóstico**: `/diagnostico/notificaciones`
- **Gestión de tokens (Admin)**: `/admin/tokens`
- **Panel de notificaciones (Admin)**: `/admin/notifications`

---

## 📞 Troubleshooting

Si después de seguir todos los pasos las notificaciones aún no funcionan:

1. **Verifica APNs en Firebase Console** → [Ver guía](VERIFICAR-APNS-FIREBASE.md)
2. **Revisa los logs de Vercel** para ver errores específicos
3. **Ejecuta el diagnóstico completo** en `/diagnostico/notificaciones`
4. **Verifica la versión de iOS** (mínimo iOS 16.4)

---

**Última actualización**: 29 Octubre 2025
