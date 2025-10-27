/**
 * Structured Logger compatible con OpenTelemetry
 *
 * Formato de logs preparado para:
 * - Datadog
 * - Langfuse
 * - AgentOps
 * - OpenTelemetry
 */

interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  requestId?: string;
  userId?: string;

  // Contexto del agente
  agent?: {
    name: string;
    model: string;
    toolsUsed?: string[];
    tokenUsage?: {
      prompt: number;
      completion: number;
      total: number;
    };
    cost?: number;
    duration?: number;
  };

  // Contexto de error
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };

  // Contexto adicional
  metadata?: Record<string, any>;
}

export class StructuredLogger {
  private static log(entry: LogEntry): void {
    // Formato JSON para parsing fácil
    const logLine = JSON.stringify({
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
      service: 'parroquia-chatbot',
      environment: process.env.NODE_ENV || 'production',
    });

    // Output según nivel
    if (entry.level === 'error') {
      console.error(logLine);
    } else if (entry.level === 'warn') {
      console.warn(logLine);
    } else {
      console.log(logLine);
    }

    // En producción, enviar a servicio de logging
    if (process.env.NODE_ENV === 'production') {
      // Aquí podrías enviar a Datadog, Langfuse, etc.
      // await sendToLoggingService(entry);
    }
  }

  static info(message: string, metadata?: Record<string, any>, requestId?: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      requestId,
      metadata,
    });
  }

  static warn(message: string, metadata?: Record<string, any>, requestId?: string): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      requestId,
      metadata,
    });
  }

  static error(message: string, error: Error, requestId?: string, metadata?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      requestId,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      },
      metadata,
    });
  }

  static agentExecution(params: {
    requestId: string;
    agentName: string;
    model: string;
    message: string;
    toolsUsed: string[];
    tokenUsage?: { prompt: number; completion: number; total: number };
    cost?: number;
    duration: number;
    success: boolean;
  }): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Agent execution ${params.success ? 'succeeded' : 'failed'}`,
      requestId: params.requestId,
      agent: {
        name: params.agentName,
        model: params.model,
        toolsUsed: params.toolsUsed,
        tokenUsage: params.tokenUsage,
        cost: params.cost,
        duration: params.duration,
      },
      metadata: {
        messagePreview: params.message.substring(0, 100),
        success: params.success,
      },
    });
  }

  static guardrailTriggered(params: {
    requestId: string;
    guardrailType: 'input' | 'output';
    guardrailName: string;
    reason: string;
    message: string;
  }): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message: `Guardrail triggered: ${params.guardrailName}`,
      requestId: params.requestId,
      metadata: {
        guardrailType: params.guardrailType,
        guardrailName: params.guardrailName,
        reason: params.reason,
        messagePreview: params.message.substring(0, 100),
      },
    });
  }

  /**
   * Log de contexto dinámico aplicado al agente
   * Útil para analytics y optimización de instrucciones
   */
  static dynamicContext(params: {
    requestId: string;
    dayOfWeek: number;
    dayName: string;
    hour: number;
    contextsApplied: string[];
    instructionsLength: number;
  }): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Dynamic context applied: ${params.contextsApplied.join(', ')}`,
      requestId: params.requestId,
      metadata: {
        temporal: {
          dayOfWeek: params.dayOfWeek,
          dayName: params.dayName,
          hour: params.hour,
          timeOfDay: params.hour < 12 ? 'morning' : params.hour < 18 ? 'afternoon' : 'evening',
        },
        contexts: params.contextsApplied,
        instructionsLength: params.instructionsLength,
      },
    });
  }
}
