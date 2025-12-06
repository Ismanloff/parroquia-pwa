/**
 * Hook para enviar logs al dashboard de debug
 * Usa el endpoint /api/debug/logger
 *
 * SEGURIDAD: Solo habilitado en desarrollo para evitar logging de datos sensibles en producción
 */
import Constants from 'expo-constants';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || Constants.expoConfig?.extra?.apiBase;

// ✅ SEGURIDAD: Solo habilitar en desarrollo (no en producción)
// __DEV__ es true solo en modo desarrollo de React Native
const DEBUG_ENABLED = __DEV__ && (process.env.EXPO_PUBLIC_DEBUG_ENABLED !== 'false');

type LogLevel = 'info' | 'error' | 'warning' | 'debug';

class DebugLogger {
  private queue: any[] = [];
  private sending = false;

  /**
   * Sanitiza datos sensibles antes de loguear
   * - Acorta mensajes largos
   * - Remueve stack traces completos
   * - Limita profundidad de objetos
   */
  private sanitizeData(data: any): any {
    if (!data) return data;

    if (typeof data === 'string') {
      // Limitar mensajes a 200 caracteres (evitar loguear conversaciones completas)
      return data.length > 200 ? `${data.substring(0, 200)}... [truncado]` : data;
    }

    if (typeof data === 'object') {
      const sanitized: any = {};

      for (const [key, value] of Object.entries(data)) {
        // Stack traces: solo primeras 2 líneas
        if (key === 'errorStack' && typeof value === 'string') {
          sanitized[key] = value.split('\n').slice(0, 2).join('\n');
          continue;
        }

        // Mensajes: truncar si son muy largos
        if ((key === 'message' || key === 'messagePreview') && typeof value === 'string') {
          sanitized[key] = value.length > 100 ? `${value.substring(0, 100)}...` : value;
          continue;
        }

        // Arrays: limitar a 10 elementos
        if (Array.isArray(value)) {
          sanitized[key] = value.length > 10 ? `[${value.length} items]` : value;
          continue;
        }

        // Otros valores: copiar tal cual
        sanitized[key] = value;
      }

      return sanitized;
    }

    return data;
  }

  async log(level: LogLevel, message: string, data?: any, requestId?: string) {
    if (!DEBUG_ENABLED) {
      // En producción, solo loguear errores críticos en consola local
      if (level === 'error') {
        console.error(`[${level.toUpperCase()}] ${message}`);
      }
      return;
    }

    if (!API_BASE) {
      console.log('[DEBUG LOGGER] API_BASE not configured:', process.env.EXPO_PUBLIC_API_BASE);
      return;
    }

    // ✅ SANITIZAR datos antes de loguear
    const sanitizedData = this.sanitizeData(data);

    const logEntry = {
      type: 'frontend',
      level,
      message,
      data: sanitizedData,
      requestId,
      timestamp: new Date().toISOString(),
    };

    // También loguear en consola (solo en desarrollo)
    console.log(`[DEBUG LOGGER] ${level.toUpperCase()}: ${message}`, sanitizedData || '');
    console.log(`[DEBUG LOGGER] Enviando a: ${API_BASE}/api/debug/logger`);

    // Añadir a la cola
    this.queue.push(logEntry);

    // Enviar la cola si no está enviando ya
    if (!this.sending) {
      this.sendQueue();
    }
  }

  private async sendQueue() {
    if (this.queue.length === 0 || this.sending) {
      return;
    }

    this.sending = true;

    while (this.queue.length > 0) {
      const logEntry = this.queue.shift();

      try {
        console.log('[DEBUG LOGGER] Sending log entry:', logEntry);
        const response = await fetch(`${API_BASE}/api/debug/logger`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(logEntry),
        });
        console.log('[DEBUG LOGGER] Response status:', response.status);
        const result = await response.json();
        console.log('[DEBUG LOGGER] Response:', result);
      } catch (error) {
        // Silenciar errores de logging (no queremos que el logger rompa la app)
        console.error('[DEBUG LOGGER] Error enviando log:', error);
      }
    }

    this.sending = false;
  }

  info(message: string, data?: any, requestId?: string) {
    this.log('info', message, data, requestId);
  }

  error(message: string, data?: any, requestId?: string) {
    this.log('error', message, data, requestId);
  }

  warning(message: string, data?: any, requestId?: string) {
    this.log('warning', message, data, requestId);
  }

  debug(message: string, data?: any, requestId?: string) {
    this.log('debug', message, data, requestId);
  }
}

// Singleton - puede usarse directamente sin hook
const logger = new DebugLogger();

export const useDebugLogger = () => {
  return logger;
};

// También exportar directamente para uso fuera de componentes
export const debugLogger = logger;
