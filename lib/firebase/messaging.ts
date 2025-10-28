// Firebase Cloud Messaging - Push Notifications
// Funciones para solicitar permisos, obtener tokens y escuchar notificaciones

import { getMessagingInstance } from './config';
import { getToken, onMessage } from 'firebase/messaging';
import { supabase } from '@/lib/supabase';

/**
 * Solicita permiso para mostrar notificaciones push
 * Retorna el token FCM del dispositivo si el usuario acepta
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    // Verificar si el navegador soporta notificaciones
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones');
      return null;
    }

    // Pedir permiso al usuario
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.log('Usuario rechazó permisos de notificaciones');
      return null;
    }

    console.log('✅ Permiso de notificaciones concedido');

    // Registrar Service Worker de Firebase
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;
    console.log('✅ Firebase Service Worker registrado');

    // Obtener instancia de messaging
    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.error('No se pudo obtener instancia de messaging');
      return null;
    }

    // Obtener token FCM único del dispositivo
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.error('No se pudo obtener token FCM');
      return null;
    }

    console.log('✅ Token FCM obtenido:', token.substring(0, 20) + '...');
    return token;
  } catch (error) {
    console.error('❌ Error al solicitar permiso de notificaciones:', error);
    return null;
  }
};

/**
 * Guarda el token FCM en Supabase
 * Necesario para enviar notificaciones después
 */
export const savePushToken = async (token: string): Promise<boolean> => {
  try {
    if (!supabase) {
      console.error('❌ Supabase no configurado');
      return false;
    }

    const userAgent = navigator.userAgent;

    const { error } = await supabase.from('push_tokens').upsert(
      {
        token,
        user_agent: userAgent,
        last_used: new Date().toISOString(),
      } as any,
      {
        onConflict: 'token',
      }
    );

    if (error) {
      console.error('❌ Error al guardar token en Supabase:', error);
      return false;
    }

    console.log('✅ Token guardado en Supabase');
    return true;
  } catch (error) {
    console.error('❌ Error al guardar token:', error);
    return false;
  }
};

/**
 * Escucha notificaciones cuando la app está abierta (foreground)
 * Callback recibe el payload de la notificación
 */
export const onMessageListener = async (
  callback: (payload: {
    notification?: { title?: string; body?: string };
    data?: Record<string, string>;
  }) => void
) => {
  const messaging = await getMessagingInstance();
  if (!messaging) {
    console.warn('Messaging no disponible para escuchar mensajes');
    return;
  }

  onMessage(messaging, (payload) => {
    console.log('🔔 Notificación recibida (app abierta):', payload);
    callback(payload);
  });
};

/**
 * Función combinada: solicita permisos y guarda token
 */
export const setupPushNotifications = async (): Promise<boolean> => {
  const token = await requestNotificationPermission();

  if (!token) {
    return false;
  }

  const saved = await savePushToken(token);
  return saved;
};
