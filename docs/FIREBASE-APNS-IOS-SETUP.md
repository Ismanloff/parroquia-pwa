# iOS (Safari PWA) + Firebase Push (APNs) — Guía rápida

En iOS, las notificaciones push **solo funcionan** si la PWA está **instalada** (modo _standalone_) y en **iOS 16.4+**.

Este proyecto usa **Firebase Cloud Messaging (FCM)** y unifica **PWA + Push** en **un solo Service Worker**: `public/sw.js` (generado por Serwist en build).

## 1) Variables de entorno (cliente)

Configura en `.env.local` / Vercel:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
```

## 2) VAPID Key (Web Push)

En Firebase Console:

1. **Project settings → Cloud Messaging**
2. **Web Push certificates**
3. Genera un **key pair** y copia la **Public key** en `NEXT_PUBLIC_FIREBASE_VAPID_KEY`

## 3) APNs (necesario si quieres recibir push en iOS)

Para iOS, FCM termina entregando notificaciones vía **APNs**, así que necesitas credenciales de Apple:

1. En Apple Developer:
   - **Certificates, Identifiers & Profiles → Keys**
   - Crea una key con **Apple Push Notifications service (APNs)**
   - Descarga el archivo `.p8` y guarda **Key ID** y **Team ID**
2. En Firebase Console:
   - **Project settings → Cloud Messaging → Apple app configuration / APNs**
   - Sube el `.p8` e ingresa **Key ID** y **Team ID**

## 4) Variables de entorno (servidor, para enviar)

Para que el backend pueda enviar notificaciones (admin panel y self-test), configura:

```bash
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 5) Cómo probar en iPhone/iPad

1. Abre el sitio en **Safari**
2. **Compartir → Añadir a pantalla de inicio**
3. Abre la app **desde el icono** (standalone)
4. Ve a **Ajustes → Notificaciones** dentro de la app y activa permisos
5. Usa `\/diagnostico\/notificaciones` para revisar el flujo y enviar un **self-test**

## Troubleshooting rápido

- No aparece el prompt: la PWA no está instalada o el usuario ya negó permisos.
- iOS < 16.4: no hay soporte.
- Token no se obtiene: revisa `NEXT_PUBLIC_FIREBASE_VAPID_KEY` y la configuración del proyecto en Firebase.
- Envío falla: revisa `FIREBASE_*` y que el reloj/entorno de Vercel esté bien configurado.
