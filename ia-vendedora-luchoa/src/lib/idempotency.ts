// Sistema de idempotência para APIs
interface IdempotentResponse {
  data: any;
  status: number;
  timestamp: number;
}

class IdempotencyManager {
  private cache = new Map<string, IdempotentResponse>();
  private readonly TTL = 24 * 60 * 60 * 1000; // 24 horas

  constructor() {
    // Limpar cache expirado a cada hora
    setInterval(() => {
      this.cleanExpiredEntries();
    }, 60 * 60 * 1000);
  }

  private cleanExpiredEntries(): void {
    const now = Date.now();
    for (const [key, response] of this.cache.entries()) {
      if (now - response.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }

  private generateKey(method: string, url: string, body: any, idempotencyKey: string): string {
    // Combinar método, URL, body e chave de idempotência
    const bodyHash = body ? JSON.stringify(body) : '';
    return `${method}:${url}:${idempotencyKey}:${bodyHash}`;
  }

  has(method: string, url: string, body: any, idempotencyKey: string): boolean {
    const key = this.generateKey(method, url, body, idempotencyKey);
    const response = this.cache.get(key);
    
    if (!response) return false;
    
    // Verificar se não expirou
    if (Date.now() - response.timestamp > this.TTL) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  get(method: string, url: string, body: any, idempotencyKey: string): IdempotentResponse | null {
    const key = this.generateKey(method, url, body, idempotencyKey);
    const response = this.cache.get(key);
    
    if (!response) return null;
    
    // Verificar se não expirou
    if (Date.now() - response.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return response;
  }

  set(method: string, url: string, body: any, idempotencyKey: string, data: any, status: number): void {
    const key = this.generateKey(method, url, body, idempotencyKey);
    this.cache.set(key, {
      data,
      status,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): {
    totalEntries: number;
    oldestEntry?: number;
    newestEntry?: number;
    memoryUsage: number;
  } {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(e => e.timestamp);
    
    return {
      totalEntries: this.cache.size,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : undefined,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : undefined,
      memoryUsage: JSON.stringify(Array.from(this.cache.entries())).length,
    };
  }
}

// Instância global
export const idempotencyManager = new IdempotencyManager();

// Middleware para Next.js API routes
export function withIdempotency<T = any>(
  handler: (req: any, res: any) => Promise<T>
) {
  return async (req: any, res: any): Promise<T | void> => {
    const idempotencyKey = req.headers['idempotency-key'];
    
    // Se não há chave de idempotência, executar normalmente
    if (!idempotencyKey) {
      return handler(req, res);
    }

    // Verificar se já existe resposta para esta chave
    const method = req.method;
    const url = req.url;
    const body = req.body;
    
    const existingResponse = idempotencyManager.get(method, url, body, idempotencyKey);
    
    if (existingResponse) {
      // Retornar resposta cached
      res.status(existingResponse.status).json(existingResponse.data);
      return;
    }

    // Interceptar a resposta para cachear
    const originalJson = res.json;
    const originalStatus = res.status;
    let responseData: any;
    let responseStatus = 200;

    res.status = function(status: number) {
      responseStatus = status;
      return originalStatus.call(this, status);
    };

    res.json = function(data: any) {
      responseData = data;
      
      // Cachear apenas respostas de sucesso
      if (responseStatus >= 200 && responseStatus < 300) {
        idempotencyManager.set(method, url, body, idempotencyKey, data, responseStatus);
      }
      
      return originalJson.call(this, data);
    };

    return handler(req, res);
  };
}

// Hook para React components
export function useIdempotency() {
  return {
    generateKey: () => `idem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    getStats: () => idempotencyManager.getStats(),
    clear: () => idempotencyManager.clear(),
  };
}
