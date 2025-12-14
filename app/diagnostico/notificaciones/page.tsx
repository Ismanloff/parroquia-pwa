'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  ArrowLeft,
  Smartphone,
  Wifi,
  Database,
  Key,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { setupPushNotifications, isIOS, isIOSPWA, getIOSVersion } from '@/lib/firebase/messaging';
import { useInstallPrompt } from '@/lib/hooks/useInstallPrompt';
import Link from 'next/link';

interface DiagnosticLog {
  step: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  timestamp: Date;
}

export default function NotificationsDiagnosticPage() {
  const { isInstalled } = useInstallPrompt();
  const [logs, setLogs] = useState<DiagnosticLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs appear
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (log: Omit<DiagnosticLog, 'timestamp'>) => {
    setLogs((prev) => [...prev, { ...log, timestamp: new Date() }]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    clearLogs();

    try {
      // Step 1: Verificar soporte del navegador
      setCurrentStep('Verificando navegador...');
      addLog({
        step: '1. Navegador',
        status: 'info',
        message: 'Iniciando diagnóstico de notificaciones push',
      });

      await sleep(500);

      if (!('Notification' in window)) {
        addLog({
          step: '1. Navegador',
          status: 'error',
          message: 'Este navegador NO soporta notificaciones',
          details: 'Prueba con Chrome, Firefox, Edge o Safari (iOS 16.4+)',
        });
        setIsRunning(false);
        return;
      }

      addLog({
        step: '1. Navegador',
        status: 'success',
        message: 'El navegador soporta notificaciones',
      });

      // Step 2: Detectar plataforma
      setCurrentStep('Detectando plataforma...');
      await sleep(500);

      const isiOS = isIOS();
      const isiOSPWA = isIOSPWA();
      const iosVersion = getIOSVersion();

      addLog({
        step: '2. Plataforma',
        status: 'info',
        message: `Plataforma detectada: ${isiOS ? 'iOS' : 'Android/Desktop'}`,
        details: JSON.stringify(
          {
            iOS: isiOS,
            'iOS PWA': isiOSPWA,
            'iOS Version': iosVersion,
            'User Agent': navigator.userAgent,
            Standalone: window.matchMedia('(display-mode: standalone)').matches,
          },
          null,
          2
        ),
      });

      // Step 3: Verificar instalación de PWA
      setCurrentStep('Verificando PWA...');
      await sleep(500);

      if (isiOS && !isiOSPWA) {
        addLog({
          step: '3. PWA',
          status: 'error',
          message: 'En iOS, las notificaciones SOLO funcionan si la PWA está instalada',
          details:
            'Ve a Safari → Compartir → Añadir a pantalla de inicio. Luego abre la app desde el ícono.',
        });
        setIsRunning(false);
        return;
      }

      if (!isInstalled) {
        addLog({
          step: '3. PWA',
          status: 'warning',
          message: 'La PWA no está instalada en este dispositivo',
          details: 'Instala la app para acceder a las notificaciones push',
        });
      } else {
        addLog({
          step: '3. PWA',
          status: 'success',
          message: 'PWA instalada correctamente',
        });
      }

      // Step 4: Verificar versión de iOS
      if (isiOS) {
        setCurrentStep('Verificando versión de iOS...');
        await sleep(500);

        if (iosVersion && iosVersion < 16) {
          addLog({
            step: '4. iOS Version',
            status: 'error',
            message: `iOS ${iosVersion} no soporta notificaciones push`,
            details: 'Se requiere iOS 16.4 o superior. Actualiza tu dispositivo.',
          });
          setIsRunning(false);
          return;
        }

        addLog({
          step: '4. iOS Version',
          status: 'success',
          message: `iOS ${iosVersion || '?'} soporta notificaciones`,
        });
      }

      // Step 5: Verificar Service Worker
      setCurrentStep('Verificando Service Worker...');
      await sleep(500);

      if (!('serviceWorker' in navigator)) {
        addLog({
          step: '5. Service Worker',
          status: 'error',
          message: 'Service Worker no soportado',
          details: 'Tu navegador no soporta Service Workers, necesarios para notificaciones push',
        });
        setIsRunning(false);
        return;
      }

      addLog({
        step: '5. Service Worker',
        status: 'success',
        message: 'Service Worker soportado',
      });

      // Step 6: Verificar variables de entorno
      setCurrentStep('Verificando configuración de Firebase...');
      await sleep(500);

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

      if (!vapidKey || !projectId) {
        addLog({
          step: '6. Configuración',
          status: 'error',
          message: 'Variables de entorno de Firebase faltantes',
          details: `VAPID Key: ${vapidKey ? 'OK' : 'FALTANTE'}, Project ID: ${projectId ? 'OK' : 'FALTANTE'}`,
        });
        setIsRunning(false);
        return;
      }

      addLog({
        step: '6. Configuración',
        status: 'success',
        message: 'Configuración de Firebase OK',
        details: `Project ID: ${projectId}\nVAPID Key: ${vapidKey.substring(0, 20)}...`,
      });

      // Step 7: Solicitar permisos
      setCurrentStep('Solicitando permisos...');
      await sleep(500);

      addLog({
        step: '7. Permisos',
        status: 'info',
        message: 'Solicitando permiso al usuario...',
      });

      const currentPermission = Notification.permission;

      if (currentPermission === 'denied') {
        addLog({
          step: '7. Permisos',
          status: 'error',
          message: 'Permisos de notificaciones denegados',
          details:
            'Ve a configuración del navegador → Notificaciones → Permite notificaciones para este sitio',
        });
        setIsRunning(false);
        return;
      }

      if (currentPermission === 'granted') {
        addLog({
          step: '7. Permisos',
          status: 'success',
          message: 'Permisos ya concedidos',
        });
      } else {
        addLog({
          step: '7. Permisos',
          status: 'warning',
          message: 'Acepta el permiso en el diálogo del navegador',
        });
      }

      // Step 8: Ejecutar setup completo
      setCurrentStep('Configurando notificaciones...');
      await sleep(1000);

      addLog({
        step: '8. Setup',
        status: 'info',
        message: 'Ejecutando configuración completa...',
      });

      // Interceptar console.log para capturar logs de Firebase
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;

      console.log = (...args) => {
        originalLog(...args);
        const message = args.join(' ');
        if (message.includes('✅')) {
          addLog({
            step: '8. Setup',
            status: 'success',
            message: message.replace(/✅/g, '').trim(),
          });
        } else if (message.includes('🔔') || message.includes('⚙️') || message.includes('🔥')) {
          addLog({
            step: '8. Setup',
            status: 'info',
            message: message.replace(/[🔔⚙️🔥🔑📱📏💾📝📊]/g, '').trim(),
          });
        }
      };

      console.error = (...args) => {
        originalError(...args);
        const message = args.join(' ');
        addLog({
          step: '8. Setup',
          status: 'error',
          message: message.replace(/❌/g, '').trim(),
        });
      };

      console.warn = (...args) => {
        originalWarn(...args);
        const message = args.join(' ');
        addLog({
          step: '8. Setup',
          status: 'warning',
          message: message.replace(/⚠️/g, '').trim(),
        });
      };

      const success = await setupPushNotifications();

      // Restaurar console.log
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;

      await sleep(500);

      if (success) {
        addLog({
          step: '9. Resultado',
          status: 'success',
          message: '¡Notificaciones configuradas correctamente! 🎉',
          details: 'Token guardado en Supabase. Ahora puedes recibir notificaciones push.',
        });

        // Step 10: Enviar notificación de prueba
        setCurrentStep('Enviando notificación de prueba...');
        await sleep(500);

        addLog({
          step: '10. Test',
          status: 'info',
          message: 'Enviando notificación de prueba...',
        });

        try {
          const testResponse = await fetch('/api/notifications/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Prueba de notificaciones',
              body: 'Si ves esto, las notificaciones funcionan correctamente!',
            }),
          });

          const testData = await testResponse.json();

          if (testData.success) {
            addLog({
              step: '10. Test',
              status: 'success',
              message: 'Notificación de prueba enviada exitosamente',
              details:
                'Deberías ver una notificación en tu dispositivo en unos segundos. Si no la ves, puede haber un problema con APNs (iOS) o con el servidor.',
            });
          } else {
            addLog({
              step: '10. Test',
              status: 'warning',
              message: 'No se pudo enviar notificación de prueba',
              details: testData.error || 'Error desconocido',
            });
          }
        } catch (error: any) {
          addLog({
            step: '10. Test',
            status: 'warning',
            message: 'Error al enviar notificación de prueba',
            details: error?.message || 'No se pudo conectar con el servidor',
          });
        }
      } else {
        addLog({
          step: '9. Resultado',
          status: 'error',
          message: 'Error al configurar notificaciones',
          details: 'Revisa los logs anteriores para ver qué falló',
        });
      }
    } catch (error: any) {
      addLog({
        step: 'Error',
        status: 'error',
        message: 'Error inesperado durante el diagnóstico',
        details: error?.message || String(error),
      });
    } finally {
      setIsRunning(false);
      setCurrentStep('');
    }
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Diagnóstico de Notificaciones
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Verifica paso a paso qué está fallando
              </p>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">PWA</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {isInstalled ? 'Instalada' : 'No instalada'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Permiso</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {typeof window !== 'undefined' && 'Notification' in window
                    ? Notification.permission === 'granted'
                      ? 'Concedido'
                      : Notification.permission === 'denied'
                        ? 'Denegado'
                        : 'Pendiente'
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Wifi className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-slate-600 dark:text-slate-400">Service Worker</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {typeof window !== 'undefined' && 'serviceWorker' in navigator
                    ? 'Soportado'
                    : 'No soportado'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Panel de Diagnóstico
            </h2>
            <button
              onClick={runDiagnostics}
              disabled={isRunning}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Diagnosticando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Iniciar Diagnóstico
                </>
              )}
            </button>
          </div>

          {currentStep && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-900 dark:text-blue-100">{currentStep}</span>
              </div>
            </div>
          )}

          {/* Logs Panel */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400">
                  Haz clic en &quot;Iniciar Diagnóstico&quot; para comenzar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-xl border ${
                      log.status === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : log.status === 'error'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : log.status === 'warning'
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {log.status === 'success' ? (
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : log.status === 'error' ? (
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        ) : log.status === 'warning' ? (
                          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        ) : (
                          <Loader className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {log.step}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-500">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p
                          className={`text-sm font-medium ${
                            log.status === 'success'
                              ? 'text-green-900 dark:text-green-100'
                              : log.status === 'error'
                                ? 'text-red-900 dark:text-red-100'
                                : log.status === 'warning'
                                  ? 'text-yellow-900 dark:text-yellow-100'
                                  : 'text-blue-900 dark:text-blue-100'
                          }`}
                        >
                          {log.message}
                        </p>
                        {log.details && (
                          <pre className="mt-2 p-2 bg-white/50 dark:bg-slate-800/50 rounded text-xs overflow-x-auto">
                            {log.details}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-3xl shadow-xl p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-3">ℹ️ Información útil</h3>
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>iOS:</strong> Requiere iOS 16.4+ y la PWA debe estar instalada (Añadir a
                pantalla de inicio)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Android:</strong> Funciona en Chrome, Firefox y Edge (con o sin instalación)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Desktop:</strong> Chrome, Firefox, Edge y Safari (macOS 13+)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <span>
                Si los permisos fueron denegados, debes habilitarlos manualmente en la configuración
                del navegador
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>iOS - APNs:</strong> Si todo parece configurado pero no llegan
                notificaciones, verifica que APNs esté correctamente configurado en Firebase Console
                (Project Settings → Cloud Messaging → Apple app configuration)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Token inválido:</strong> Si ves el error &quot;Requested entity was not
                found&quot;, tu token FCM puede estar expirado. Desinstala y reinstala la PWA para
                generar un nuevo token.
              </span>
            </li>
          </ul>
        </div>

        {/* Admin Link */}
        <div className="mt-6 text-center">
          <Link
            href="/admin/tokens"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            <Database className="w-4 h-4" />
            Ver gestión de tokens (Admin)
          </Link>
        </div>
      </div>
    </div>
  );
}
