// Cliente API com retry, timeout e observabilidade
export interface ApiClientConfig {
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  enableLogging?: boolean;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
  requestId: string;
  duration: number;
}

export class ApiClient {
  private config: Required<ApiClientConfig>;
  
  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || '',
      timeout: config.timeout || 30000, // 30 segundos
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000, // 1 segundo
      enableLogging: config.enableLogging ?? true,
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
    if (!this.config.enableLogging) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };
    
    console[level](`[ApiClient] ${timestamp} - ${message}`, data || '');
    
    // Em produção, enviar para serviço de logging
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'api_log', {
        level,
        message,
        timestamp
      });
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private shouldRetry(status: number, attempt: number): boolean {
    if (attempt >= this.config.maxRetries) return false;
    
    // Retry em erros de servidor (5xx) ou timeout
    return status >= 500 || status === 408 || status === 429;
  }

  private calculateBackoffDelay(attempt: number): number {
    // Exponential backoff com jitter
    const baseDelay = this.config.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    
    return Math.min(exponentialDelay + jitter, 10000); // Max 10 segundos
  }

  async request<T = any>(
    url: string,
    options: RequestInit & { idempotencyKey?: string } = {}
  ): Promise<ApiResponse<T>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    const fullUrl = `${this.config.baseUrl}${url}`;
    
    // Headers padrão
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('X-Request-ID', requestId);
    
    // Idempotência para operações não-GET
    if (options.idempotencyKey && options.method !== 'GET') {
      headers.set('Idempotency-Key', options.idempotencyKey);
    }

    this.log('info', `Starting request to ${url}`, {
      requestId,
      method: options.method || 'GET',
      idempotencyKey: options.idempotencyKey
    });

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Timeout controller
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        const response = await fetch(fullUrl, {
          ...options,
          headers,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        const duration = Date.now() - startTime;
        
        // Log da resposta
        this.log('info', `Request completed`, {
          requestId,
          status: response.status,
          duration,
          attempt: attempt + 1
        });

        let data: T | undefined;
        let error: string | undefined;

        try {
          const responseText = await response.text();
          if (responseText) {
            const parsed = JSON.parse(responseText);
            if (response.ok) {
              data = parsed;
            } else {
              error = parsed.error || parsed.message || `HTTP ${response.status}`;
            }
          }
        } catch (parseError) {
          this.log('warn', 'Failed to parse response JSON', { requestId, parseError });
          if (!response.ok) {
            error = `HTTP ${response.status}`;
          }
        }

        // Se a resposta foi bem-sucedida, retornar
        if (response.ok) {
          return {
            data,
            status: response.status,
            requestId,
            duration
          };
        }

        // Se não deve fazer retry, retornar erro
        if (!this.shouldRetry(response.status, attempt)) {
          return {
            error: error || `HTTP ${response.status}`,
            status: response.status,
            requestId,
            duration
          };
        }

        // Log do retry
        this.log('warn', `Request failed, retrying`, {
          requestId,
          status: response.status,
          attempt: attempt + 1,
          maxRetries: this.config.maxRetries
        });

      } catch (fetchError) {
        const duration = Date.now() - startTime;
        lastError = fetchError as Error;
        
        this.log('error', `Request failed with error`, {
          requestId,
          error: lastError.message,
          attempt: attempt + 1,
          duration
        });

        // Se não deve fazer retry, retornar erro
        if (attempt >= this.config.maxRetries) {
          break;
        }
      }

      // Aguardar antes do próximo retry
      if (attempt < this.config.maxRetries) {
        const delayMs = this.calculateBackoffDelay(attempt);
        this.log('info', `Waiting ${delayMs}ms before retry`, { requestId });
        await this.delay(delayMs);
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    const duration = Date.now() - startTime;
    const error = lastError?.message || 'Request failed after all retries';
    
    this.log('error', `Request failed permanently`, {
      requestId,
      error,
      duration,
      attempts: this.config.maxRetries + 1
    });

    return {
      error,
      status: 0,
      requestId,
      duration
    };
  }

  // Métodos de conveniência
  async get<T = any>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T = any>(
    url: string, 
    data?: any, 
    options?: RequestInit & { idempotencyKey?: string }
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(
    url: string, 
    data?: any, 
    options?: RequestInit & { idempotencyKey?: string }
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(
    url: string, 
    options?: RequestInit & { idempotencyKey?: string }
  ): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
}

// Instância global do cliente
export const apiClient = new ApiClient({
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  enableLogging: true,
});

// Hook para uso em componentes React
export function useApiClient() {
  return apiClient;
}
