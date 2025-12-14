// Firebase Admin SDK - Para enviar notificaciones desde el servidor
// Usa Service Account en lugar de Server Key (legacy)
// Inicialización LAZY para evitar errores de build cuando faltan variables de entorno

import * as admin from 'firebase-admin';

let initialized = false;

/**
 * Verifica si Firebase Admin está correctamente configurado
 */
export function isFirebaseAdminConfigured(): boolean {
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
}

/**
 * Inicializa Firebase Admin SDK de forma lazy (solo cuando se necesita)
 * Retorna true si se inicializó correctamente, false si faltan variables
 */
function initializeFirebaseAdmin(): boolean {
  if (initialized) return true;

  if (!isFirebaseAdminConfigured()) {
    console.warn(
      '⚠️ Firebase Admin no configurado. Agrega FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY a tu .env'
    );
    return false;
  }

  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
  }

  initialized = true;
  return true;
}

/**
 * Obtiene la instancia de Firebase Messaging (inicializa si es necesario)
 * @throws Error si Firebase Admin no está configurado
 */
export function getMessaging(): admin.messaging.Messaging {
  if (!initializeFirebaseAdmin()) {
    throw new Error(
      'Firebase Admin no está configurado. Agrega las variables de entorno FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY.'
    );
  }
  return admin.messaging();
}

// Export para compatibilidad con código existente
// NOTA: Ahora usa getter lazy en lugar de inicialización directa
export const messaging = {
  send: async (...args: Parameters<admin.messaging.Messaging['send']>) => {
    return getMessaging().send(...args);
  },
};

export default admin;
