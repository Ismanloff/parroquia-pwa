// Firebase Cloud Messaging - Push Notifications
// Funciones para solicitar permisos, obtener tokens y escuchar notificaciones

import { getMessagingInstance } from './config';
import { getToken, onMessage } from 'firebase/messaging';
import { supabase } from '@/lib/supabase';

/**
 * Detecta si el dispositivo es iOS (iPhone, iPad, iPod)
 */
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

/**
 * Detecta si es iOS Safari en modo PWA (standalone)
 */
export const isIOSPWA = (): boolean => {
  if (typeof window === 'undefined') return false;

  return isIOS() && window.matchMedia('(display-mode: standalone)').matches;
};

/**
 * Verifica la versión de iOS (requiere iOS 16.4+ para notificaciones)
 */
export const getIOSVersion = (): number | null => {
  if (!isIOS()) return null;

  const match = window.navigator.userAgent.match(/OS (\d+)_/);
  return match && match[1] ? parseInt(match[1], 10) : null;
};

/**
 * Solicita permiso para mostrar notificaciones push
 * Retorna el token FCM del dispositivo si el usuario acepta
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    // Detección de plataforma
    const isiOS = isIOS();
    const isiOSPWA = isIOSPWA();
    const iosVersion = getIOSVersion();

    console.log('📱 Información del dispositivo:', {
      isiOS,
      isiOSPWA,
      iosVersion,
      userAgent: navigator.userAgent,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    });

    // Verificar si el navegador soporta notificaciones
    if (!('Notification' in window)) {
      console.warn('❌ Este navegador no soporta notificaciones');
      return null;
    }

    // Verificar versión de iOS
    if (isiOS && iosVersion && iosVersion < 16) {
      console.warn(
        `❌ iOS ${iosVersion} no soporta notificaciones. Se requiere iOS 16.4 o superior`
      );
      return null;
    }

    // Advertencia para iOS no standalone
    if (isiOS && !isiOSPWA) {
      console.warn(
        '⚠️ iOS Safari: Las notificaciones solo funcionan si la PWA está instalada (Agregar a pantalla de inicio)'
      );
    }

    // Pedir permiso al usuario
    console.log('🔔 Solicitando permiso de notificaciones...');
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.log('❌ Usuario rechazó permisos de notificaciones');
      return null;
    }

    console.log('✅ Permiso de notificaciones concedido');

    // Asegurar Service Worker principal (PWA) - Push y caché comparten el mismo SW
    console.log('⚙️ Asegurando Service Worker principal...');
    const registration = await navigator.serviceWorker.register('/sw.js', {
      updateViaCache: 'none',
    });
    await registration.update();
    await navigator.serviceWorker.ready;
    console.log('✅ Service Worker listo:', registration.scope);

    // Obtener instancia de messaging
    console.log('🔥 Obteniendo instancia de Firebase Messaging...');
    const messaging = await getMessagingInstance();
    if (!messaging) {
      console.error('❌ No se pudo obtener instancia de messaging');

      if (isiOS) {
        console.error(
          '⚠️ iOS: Verifica que APNs esté configurado en Firebase Console. Ver docs/FIREBASE-APNS-IOS-SETUP.md'
        );
      }
      return null;
    }

    console.log('✅ Messaging instance obtenida');

    // Obtener token FCM único del dispositivo
    console.log('🔑 Obteniendo token FCM...');
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    if (!vapidKey) {
      console.error('❌ VAPID key no configurada en variables de entorno');
      return null;
    }

    console.log('✅ VAPID key encontrada:', vapidKey.substring(0, 20) + '...');

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.error('❌ No se pudo obtener token FCM');

      if (isiOS) {
        console.error('⚠️ iOS: Posibles causas:');
        console.error('  1. APNs no configurado en Firebase (MÁS PROBABLE)');
        console.error('  2. Bundle ID incorrecto en Firebase');
        console.error('  3. APNs Authentication Key expirado o inválido');
        console.error('  📖 Ver guía: docs/FIREBASE-APNS-IOS-SETUP.md');
      }

      return null;
    }

    console.log('✅ Token FCM obtenido:', token.substring(0, 30) + '...');
    console.log('📏 Longitud del token:', token.length, 'caracteres');

    return token;
  } catch (error: any) {
    console.error('❌ Error al solicitar permiso de notificaciones:', error);
    console.error('Tipo de error:', error?.name);
    console.error('Mensaje:', error?.message);
    console.error('Stack:', error?.stack);

    if (isIOS()) {
      console.error('⚠️ Error en iOS. Posibles causas:');
      console.error('  1. APNs no configurado en Firebase Console (MÁS COMÚN)');
      console.error('  2. Service Worker no soportado');
      console.error('  3. iOS < 16.4 (no soportado)');
      console.error('  4. PWA no instalada (Safari normal no soporta push)');
      console.error('  📖 Ver guía completa: docs/FIREBASE-APNS-IOS-SETUP.md');
    }

    return null;
  }
};

/**
 * Guarda el token FCM en Supabase
 * Necesario para enviar notificaciones después
 */
export const savePushToken = async (token: string): Promise<boolean> => {
  try {
    console.log('💾 Guardando token en Supabase...');

    if (!supabase) {
      console.error('❌ Supabase cliente no configurado');
      return false;
    }

    const userAgent = navigator.userAgent;
    const isiOS = isIOS();
    const isiOSPWA = isIOSPWA();

    console.log('📝 Datos a guardar:', {
      tokenLength: token.length,
      tokenPreview: token.substring(0, 30) + '...',
      userAgent,
      isiOS,
      isiOSPWA,
    });

    const { data, error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          token,
          user_agent: userAgent,
          last_used: new Date().toISOString(),
        } as any,
        {
          onConflict: 'token',
        }
      )
      .select();

    if (error) {
      console.error('❌ Error al guardar token en Supabase:', error);
      console.error('Código de error:', error.code);
      console.error('Mensaje:', error.message);
      console.error('Detalles:', error.details);

      if (error.code === '42501') {
        console.error('⚠️ Error de permisos: Verifica RLS policies en Supabase');
        console.error('   La tabla push_tokens debe permitir INSERT desde anon role');
      }

      return false;
    }

    console.log('✅ Token guardado en Supabase exitosamente');
    console.log('📊 Respuesta de Supabase:', data);

    return true;
  } catch (error: any) {
    console.error('❌ Error inesperado al guardar token:', error);
    console.error('Tipo:', error?.name);
    console.error('Mensaje:', error?.message);
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
