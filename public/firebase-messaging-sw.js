// Firebase Cloud Messaging Service Worker (compatibilidad)
//
// La app usa UN solo Service Worker (/sw.js) para:
// - Caché/offline (Serwist)
// - Push notifications (Firebase Messaging)
//
// Este archivo se mantiene para instalaciones antiguas o integraciones que aún
// intenten registrar /firebase-messaging-sw.js.
importScripts('/sw.js');
