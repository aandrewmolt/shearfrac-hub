/**
 * Global Request Interceptor
 * AGGRESSIVE deduplication at the fetch level
 * This is the nuclear option to stop request flooding
 */

class GlobalRequestInterceptor {
  private inFlightRequests = new Map<string, Promise<Response>>();
  private requestCounts = new Map<string, number>();
  private windowStart = Date.now();
  private readonly WINDOW_SIZE = 1000; // 1 second
  private readonly MAX_REQUESTS_PER_WINDOW = 3; // Very strict limit
  
  constructor() {
    this.interceptFetch();
  }
  
  private interceptFetch() {
    const originalFetch = window.fetch;
    const self = this;
    
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      
      // Only intercept API calls
      if (!url.includes('/api/') && !url.includes('amazonaws.com')) {
        return originalFetch.call(window, input, init);
      }
      
      // Create cache key
      const method = init?.method || 'GET';
      const body = init?.body ? JSON.stringify(init.body) : '';
      const cacheKey = `${method}-${url}-${body}`;
      
      // Only deduplicate GET requests
      if (method === 'GET') {
        // Check if request is already in flight
        if (self.inFlightRequests.has(cacheKey)) {
          console.log(`[GlobalInterceptor] BLOCKING duplicate request: ${url}`);
          return self.inFlightRequests.get(cacheKey)!.then(response => response.clone());
        }
        
        // Check rate limit
        const now = Date.now();
        if (now - self.windowStart > self.WINDOW_SIZE) {
          self.windowStart = now;
          self.requestCounts.clear();
        }
        
        const endpoint = new URL(url).pathname;
        const count = self.requestCounts.get(endpoint) || 0;
        
        if (count >= self.MAX_REQUESTS_PER_WINDOW) {
          console.warn(`[GlobalInterceptor] RATE LIMITED: ${endpoint} (${count} requests in window)`);
          // Return cached empty response for equipment/jobs/contacts
          if (endpoint.includes('equipment') || endpoint.includes('jobs') || endpoint.includes('contacts')) {
            return new Response(JSON.stringify([]), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        
        self.requestCounts.set(endpoint, count + 1);
        
        // Make the request and store promise
        const requestPromise = originalFetch.call(window, input, init);
        self.inFlightRequests.set(cacheKey, requestPromise);
        
        // Clean up after request completes
        requestPromise.finally(() => {
          setTimeout(() => {
            self.inFlightRequests.delete(cacheKey);
          }, 100); // Keep in cache briefly to catch rapid duplicates
        });
        
        return requestPromise;
      }
      
      // Non-GET requests pass through
      return originalFetch.call(window, input, init);
    };
    
    console.log('[GlobalInterceptor] Fetch interceptor installed - duplicate requests will be blocked');
  }
  
  // Get statistics
  getStats() {
    return {
      inFlightRequests: this.inFlightRequests.size,
      requestCounts: Array.from(this.requestCounts.entries()),
      windowStart: new Date(this.windowStart).toISOString()
    };
  }
}

// Create and export singleton instance
export const globalRequestInterceptor = new GlobalRequestInterceptor();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).__requestStats = () => globalRequestInterceptor.getStats();
}