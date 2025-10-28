// Firebase Admin SDK - Para enviar notificaciones desde el servidor
// Usa Service Account en lugar de Server Key (legacy)

import * as admin from 'firebase-admin';

// Inicializar Firebase Admin SDK (solo una vez)
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

export const messaging = admin.messaging();
export default admin;
