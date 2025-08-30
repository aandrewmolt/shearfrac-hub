import { toast } from 'sonner';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, error: unknown) => void;
  shouldRetry?: (error: unknown) => boolean;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2,
  onRetry: () => {},
  shouldRetry: (error) => {
    // Retry on network errors or specific status codes
    const err = error as { code?: string; status?: number; message?: string };
    if (err.code === 'NETWORK_ERROR' || err.code === 'TIMEOUT') return true;
    if (err.status >= 500 || err.status === 429) return true; // Server errors or rate limiting
    if (err.message?.includes('NetworkError')) return true;
    if (err.message?.includes('Failed to fetch')) return true;
    return false;
  },
  retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMIT']
};

/**
 * Execute a function with exponential backoff retry logic
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (attempt === opts.maxRetries || !opts.shouldRetry(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffFactor, attempt),
        opts.maxDelay
      );
      
      // Call retry callback
      opts.onRetry(attempt + 1, error);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Retry wrapper for database operations
 */
export async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  options?: RetryOptions
): Promise<T> {
  return retryWithBackoff(operation, {
    ...options,
    onRetry: (attempt, error) => {
        // Log retry attempts for database operations
    },
    shouldRetry: (error) => {
      // Database-specific error handling
      if (error?.code === 'SQLITE_CONSTRAINT') return false; // Constraint violation - don't retry
      if (error?.code === 'SQLITE_BUSY') return true; // Database busy - retry
      if (error?.code === 'SQLITE_LOCKED') return true; // Database locked - retry
      
      // Use default retry logic for other errors
      return DEFAULT_OPTIONS.shouldRetry(error);
    }
  });
}

/**
 * Create a debounced function with retry logic
 */
export function createDebouncedRetry<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  delay: number,
  retryOptions?: RetryOptions
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(async () => {
      await retryWithBackoff(() => fn(...args), retryOptions);
    }, delay);
  };
}

/**
 * Batch operations with retry logic
 */
export async function batchWithRetry<T, R>(
  items: T[],
  batchSize: number,
  operation: (batch: T[]) => Promise<R>,
  options?: RetryOptions
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const result = await retryWithBackoff(
      () => operation(batch),
      {
        ...options,
        onRetry: (attempt, error) => {
          // Log batch retry attempts
        }
      }
    );
    results.push(result);
  }
  
  return results;
}

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }
    
    try {
      const result = await fn();
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
      }
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      if (this.failures >= this.threshold) {
        this.state = 'open';
      }
      
      throw error;
    }
  }
}
