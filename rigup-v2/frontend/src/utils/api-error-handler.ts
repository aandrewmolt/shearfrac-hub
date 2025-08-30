import { toast } from 'sonner';

// Error types
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends ApiError {
  constructor(message = 'Network error occurred') {
    super(message);
    this.name = 'NetworkError';
    this.code = 'NETWORK_ERROR';
  }
}

export class TimeoutError extends ApiError {
  constructor(message = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
    this.code = 'TIMEOUT';
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    public fields?: Record<string, string[]>
  ) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

// Retry configuration
export interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  retryCondition?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
  retryCondition: (error) => {
    if (error instanceof ApiError) {
      // Retry on server errors or rate limiting
      return error.statusCode ? error.statusCode >= 500 || error.statusCode === 429 : true;
    }
    if (error instanceof NetworkError || error instanceof TimeoutError) {
      return true;
    }
    return false;
  },
  onRetry: (error, attempt) => {
    console.log(`Retrying request (attempt ${attempt}):`, error);
  }
};

// Circuit breaker class
export class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private threshold = 5;
  private timeout = 60000; // 1 minute

  getState(): string {
    return this.state;
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }

  async execute<T>(fn: () => Promise<T>, fallback?: () => T | Promise<T>): Promise<T> {
    if (this.state === 'open') {
      // Check if enough time has passed to try again
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        if (fallback) {
          return fallback();
        } else {
          throw new ApiError('Service temporarily unavailable', 503, 'CIRCUIT_OPEN');
        }
      }
    }

    try {
      const result = await fn();
      
      // Reset on success
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failureCount = 0;
      }
      
      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      // Open circuit if threshold reached
      if (this.failureCount >= this.threshold) {
        this.state = 'open';
      }
      
      throw error;
    }
  }
}

// Enhanced API client with retry logic and circuit breaker
export class ApiClient {
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;
  private rateLimitDelay = 0;

  constructor(
    private baseUrl: string,
    private defaultHeaders: HeadersInit = {},
    private defaultRetryConfig: RetryConfig = {}
  ) {}

  /**
   * Make an API request with retry logic
   */
  async request<T>(
    endpoint: string,
    options: RequestInit & { 
      retryConfig?: RetryConfig;
      timeout?: number;
      fallback?: () => T | Promise<T>;
    } = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...this.defaultRetryConfig, ...options.retryConfig };
    
    // Get or create circuit breaker for this endpoint
    const circuitBreakerKey = `${options.method || 'GET'}_${endpoint}`;
    if (!this.circuitBreakers.has(circuitBreakerKey)) {
      this.circuitBreakers.set(circuitBreakerKey, new CircuitBreaker());
    }
    const circuitBreaker = this.circuitBreakers.get(circuitBreakerKey)!;

    // Execute with circuit breaker
    return circuitBreaker.execute(
      () => this.executeWithRetry(url, options, retryConfig),
      options.fallback
    );
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    url: string,
    options: RequestInit & { timeout?: number },
    retryConfig: Required<RetryConfig>
  ): Promise<T> {
    let lastError: unknown;
    
    for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
      try {
        // Apply rate limiting delay if needed
        if (this.rateLimitDelay > 0) {
          await this.delay(this.rateLimitDelay);
          this.rateLimitDelay = 0;
        }

        // Calculate delay for next retry
        if (attempt > 1) {
          const baseDelay = Math.min(
            retryConfig.initialDelay * Math.pow(retryConfig.backoffMultiplier, attempt - 2),
            retryConfig.maxDelay
          );
          const delay = retryConfig.jitter
            ? baseDelay * (0.5 + Math.random())
            : baseDelay;
          
          await this.delay(delay);
          retryConfig.onRetry(lastError, attempt);
        }

        // Make the request
        const response = await this.fetchWithTimeout(url, {
          ...options,
          headers: {
            ...this.defaultHeaders,
            ...options.headers,
          },
        }, options.timeout || 30000);

        // Handle response
        return await this.handleResponse<T>(response);
      } catch (error) {
        lastError = error;
        
        // Check if we should retry
        if (attempt === retryConfig.maxAttempts || !retryConfig.retryCondition(error, attempt)) {
          throw this.normalizeError(error);
        }

        // Handle rate limiting
        if (error instanceof ApiError && error.statusCode === 429) {
          const retryAfter = this.parseRetryAfter(error.details);
          if (retryAfter) {
            this.rateLimitDelay = retryAfter * 1000;
          }
        }
      }
    }

    throw this.normalizeError(lastError);
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new TimeoutError();
      }
      throw new NetworkError((error as Error).message);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // Check for rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new ApiError(
        'Rate limit exceeded',
        429,
        'RATE_LIMIT',
        { retryAfter }
      );
    }

    // Parse response
    let data: unknown;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      try {
        data = await response.json();
      } catch {
        data = null;
      }
    } else {
      data = await response.text();
    }

    // Handle errors
    if (!response.ok) {
      const errorMessage = data?.message || data?.error || response.statusText;
      throw new ApiError(errorMessage, response.status, data?.code, data);
    }

    return data as T;
  }

  /**
   * Normalize errors
   */
  private normalizeError(error: unknown): Error {
    if (error instanceof ApiError) {
      return error;
    }
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        return new NetworkError(error.message);
      }
      return new ApiError(error.message);
    }
    return new ApiError('An unknown error occurred');
  }

  /**
   * Parse retry-after header
   */
  private parseRetryAfter(details: unknown): number | null {
    if (typeof details === 'object' && details && 'retryAfter' in details) {
      const retryAfter = (details as { retryAfter: unknown }).retryAfter;
      if (typeof retryAfter === 'string') {
        const seconds = parseInt(retryAfter, 10);
        return isNaN(seconds) ? null : seconds;
      }
    }
    return null;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Queue a request for batch processing
   */
  async queueRequest<T>(
    fn: () => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.requestQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;
    const batch = this.requestQueue.splice(0, 5); // Process 5 at a time

    await Promise.all(batch.map(fn => fn()));
    
    // Continue processing
    if (this.requestQueue.length > 0) {
      await this.delay(100); // Small delay between batches
      await this.processQueue();
    } else {
      this.isProcessingQueue = false;
    }
  }

  /**
   * Reset circuit breakers
   */
  resetCircuitBreakers(): void {
    this.circuitBreakers.forEach(cb => cb.reset());
  }

  /**
   * Get circuit breaker states
   */
  getCircuitBreakerStates(): Record<string, string> {
    const states: Record<string, string> = {};
    this.circuitBreakers.forEach((cb, key) => {
      states[key] = cb.getState();
    });
    return states;
  }
}

// Global error handler
export class GlobalErrorHandler {
  private errorHandlers = new Map<string, (error: Error) => void>();
  private errorCounts = new Map<string, number>();
  private errorThreshold = 10;
  private errorWindow = 60000; // 1 minute

  /**
   * Register an error handler
   */
  register(type: string, handler: (error: Error) => void): void {
    this.errorHandlers.set(type, handler);
  }

  /**
   * Handle an error
   */
  handle(error: Error, context?: string): void {
    const errorType = error.constructor.name;
    const errorKey = `${errorType}_${context || 'global'}`;
    
    // Track error frequency
    const count = (this.errorCounts.get(errorKey) || 0) + 1;
    this.errorCounts.set(errorKey, count);
    
    // Clear count after window
    setTimeout(() => {
      this.errorCounts.delete(errorKey);
    }, this.errorWindow);
    
    // Check if error threshold exceeded
    if (count > this.errorThreshold) {
      return;
    }
    
    // Use specific handler if available
    const handler = this.errorHandlers.get(errorType);
    if (handler) {
      handler(error);
      return;
    }
    
    // Default handling
    this.defaultHandler(error);
  }

  /**
   * Default error handler
   */
  private defaultHandler(error: Error): void {
    if (error instanceof ValidationError) {
      toast.error(`Validation error: ${error.message}`);
    } else if (error instanceof NetworkError) {
      toast.error('Network error. Please check your connection.');
    } else if (error instanceof TimeoutError) {
      toast.error('Request timed out. Please try again.');
    } else if (error instanceof ApiError) {
      if (error.statusCode === 401) {
        toast.error('Authentication required. Please log in.');
        // Redirect to login
        window.location.href = '/auth';
      } else if (error.statusCode === 403) {
        toast.error('Access denied.');
      } else if (error.statusCode === 404) {
        toast.error('Resource not found.');
      } else if (error.statusCode && error.statusCode >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error(error.message || 'An error occurred.');
      }
    } else {
      toast.error('An unexpected error occurred.');
    }
  }
}

// Create singleton instances
let apiClient: ApiClient | null = null;
let errorHandler: GlobalErrorHandler | null = null;

export function getApiClient(baseUrl?: string): ApiClient {
  if (!apiClient) {
    apiClient = new ApiClient(
      baseUrl || import.meta.env.VITE_API_URL || '',
      {
        'Content-Type': 'application/json',
      }
    );
  }
  return apiClient;
}

export function getErrorHandler(): GlobalErrorHandler {
  if (!errorHandler) {
    errorHandler = new GlobalErrorHandler();
  }
  return errorHandler;
}

// React hook for API calls
export function useApi() {
  const client = getApiClient();
  const handler = getErrorHandler();

  const get = async <T>(
    endpoint: string,
    options?: RequestInit & { retryConfig?: RetryConfig }
  ): Promise<T> => {
    try {
      return await client.request<T>(endpoint, {
        method: 'GET',
        ...options,
      });
    } catch (error) {
      handler.handle(error as Error, `GET ${endpoint}`);
      throw error;
    }
  };

  const post = async <T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit & { retryConfig?: RetryConfig }
  ): Promise<T> => {
    try {
      return await client.request<T>(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
      });
    } catch (error) {
      handler.handle(error as Error, `POST ${endpoint}`);
      throw error;
    }
  };

  const put = async <T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit & { retryConfig?: RetryConfig }
  ): Promise<T> => {
    try {
      return await client.request<T>(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options,
      });
    } catch (error) {
      handler.handle(error as Error, `PUT ${endpoint}`);
      throw error;
    }
  };

  const del = async <T>(
    endpoint: string,
    options?: RequestInit & { retryConfig?: RetryConfig }
  ): Promise<T> => {
    try {
      return await client.request<T>(endpoint, {
        method: 'DELETE',
        ...options,
      });
    } catch (error) {
      handler.handle(error as Error, `DELETE ${endpoint}`);
      throw error;
    }
  };

  return { get, post, put, delete: del };
}
