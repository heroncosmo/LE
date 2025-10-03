// Sistema de logging estruturado com diferentes níveis
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  error?: Error;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStorageEntries: number;
  enableRemoteLogging: boolean;
  remoteEndpoint?: string;
}

class Logger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level ?? LogLevel.INFO,
      enableConsole: config.enableConsole ?? true,
      enableStorage: config.enableStorage ?? true,
      maxStorageEntries: config.maxStorageEntries ?? 1000,
      enableRemoteLogging: config.enableRemoteLogging ?? false,
      remoteEndpoint: config.remoteEndpoint,
    };

    // Carregar logs do localStorage se habilitado
    if (this.config.enableStorage && typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private formatMessage(entry: LogEntry): string {
    const levelName = LogLevel[entry.level];
    const context = entry.context ? `[${entry.context}]` : '';
    const userId = entry.userId ? `[User:${entry.userId}]` : '';
    const requestId = entry.requestId ? `[Req:${entry.requestId}]` : '';
    
    return `${entry.timestamp} ${levelName} ${context}${userId}${requestId} ${entry.message}`;
  }

  private async log(
    level: LogLevel,
    message: string,
    context?: string,
    metadata?: Record<string, any>,
    error?: Error
  ): Promise<void> {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata,
      error,
    };

    // Adicionar ao buffer
    this.logBuffer.push(entry);

    // Manter tamanho do buffer
    if (this.logBuffer.length > this.config.maxStorageEntries) {
      this.logBuffer.shift();
    }

    // Log no console
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Salvar no localStorage
    if (this.config.enableStorage) {
      this.saveToStorage();
    }

    // Enviar para endpoint remoto
    if (this.config.enableRemoteLogging && this.config.remoteEndpoint) {
      this.sendToRemote(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const formattedMessage = this.formatMessage(entry);
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, entry.metadata);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, entry.metadata);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, entry.metadata);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, entry.metadata, entry.error);
        break;
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('ia-vendedora-logs', JSON.stringify(this.logBuffer));
    } catch (error) {
      console.warn('Failed to save logs to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('ia-vendedora-logs');
      if (stored) {
        this.logBuffer = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load logs from localStorage:', error);
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) return;
    
    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Não fazer log do erro de logging para evitar loop infinito
      console.warn('Failed to send log to remote endpoint:', error);
    }
  }

  // Métodos públicos
  debug(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context, metadata);
  }

  info(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context, metadata);
  }

  warn(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context, metadata);
  }

  error(message: string, context?: string, metadata?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, metadata, error);
  }

  // Métodos específicos para o domínio da aplicação
  userAction(action: string, userId: string, metadata?: Record<string, any>): void {
    this.info(`User action: ${action}`, 'USER_ACTION', { userId, ...metadata });
  }

  aiInteraction(
    userId: string,
    userMessage: string,
    aiResponse: string,
    metadata?: Record<string, any>
  ): void {
    this.info('AI interaction', 'AI_CHAT', {
      userId,
      userMessage: userMessage.substring(0, 100), // Truncar para privacidade
      aiResponse: aiResponse.substring(0, 100),
      ...metadata,
    });
  }

  apiCall(
    endpoint: string,
    method: string,
    duration: number,
    status: number,
    requestId?: string
  ): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `API call: ${method} ${endpoint}`, 'API', {
      method,
      endpoint,
      duration,
      status,
      requestId,
    });
  }

  performance(metric: string, value: number, context?: string): void {
    this.info(`Performance: ${metric} = ${value}ms`, context || 'PERFORMANCE', {
      metric,
      value,
    });
  }

  // Métodos utilitários
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logBuffer.filter(entry => entry.level >= level);
    }
    return [...this.logBuffer];
  }

  clearLogs(): void {
    this.logBuffer = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ia-vendedora-logs');
    }
  }

  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2);
  }

  getLogStats(): {
    total: number;
    byLevel: Record<string, number>;
    oldestEntry?: string;
    newestEntry?: string;
  } {
    const byLevel: Record<string, number> = {};
    
    this.logBuffer.forEach(entry => {
      const levelName = LogLevel[entry.level];
      byLevel[levelName] = (byLevel[levelName] || 0) + 1;
    });

    return {
      total: this.logBuffer.length,
      byLevel,
      oldestEntry: this.logBuffer[0]?.timestamp,
      newestEntry: this.logBuffer[this.logBuffer.length - 1]?.timestamp,
    };
  }
}

// Instância global do logger
export const logger = new Logger({
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableStorage: true,
  maxStorageEntries: 1000,
  enableRemoteLogging: false, // Habilitar em produção se necessário
});

// Context provider para React
export function withLogging<T extends Record<string, any>>(
  component: string,
  props: T
): T & { logger: Logger } {
  return {
    ...props,
    logger: logger,
  };
}

// Hook para uso em componentes React
export function useLogger(context?: string) {
  return {
    debug: (message: string, metadata?: Record<string, any>) => 
      logger.debug(message, context, metadata),
    info: (message: string, metadata?: Record<string, any>) => 
      logger.info(message, context, metadata),
    warn: (message: string, metadata?: Record<string, any>) => 
      logger.warn(message, context, metadata),
    error: (message: string, metadata?: Record<string, any>, error?: Error) => 
      logger.error(message, context, metadata, error),
    userAction: (action: string, userId: string, metadata?: Record<string, any>) =>
      logger.userAction(action, userId, metadata),
    aiInteraction: (userId: string, userMessage: string, aiResponse: string, metadata?: Record<string, any>) =>
      logger.aiInteraction(userId, userMessage, aiResponse, metadata),
    performance: (metric: string, value: number) =>
      logger.performance(metric, value, context),
  };
}
