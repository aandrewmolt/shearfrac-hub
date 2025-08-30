/**
 * Rate Limiter for API requests
 * Prevents flooding the AWS API Gateway with requests
 */

class RateLimiter {
  private queue: Array<() => void> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private minDelay = 100; // Minimum 100ms between requests
  private requestCounts = new Map<string, number>();
  private windowSize = 1000; // 1 second window
  private maxRequestsPerWindow = 5; // Max 5 requests per second per endpoint
  
  async throttle<T>(endpoint: string, fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const execute = async () => {
        try {
          // Check rate limit for this endpoint
          const now = Date.now();
          const windowStart = Math.floor(now / this.windowSize) * this.windowSize;
          const key = `${endpoint}-${windowStart}`;
          
          const count = this.requestCounts.get(key) || 0;
          if (count >= this.maxRequestsPerWindow) {
            // Wait until next window
            const waitTime = windowStart + this.windowSize - now + 10;
            console.log(`Rate limiting ${endpoint}: waiting ${waitTime}ms`);
            await new Promise(r => setTimeout(r, waitTime));
            // Retry in next window
            return this.throttle(endpoint, fn).then(resolve).catch(reject);
          }
          
          // Update count
          this.requestCounts.set(key, count + 1);
          
          // Clean old entries
          for (const [k] of this.requestCounts) {
            const [, timestamp] = k.split('-');
            if (parseInt(timestamp) < windowStart - this.windowSize * 2) {
              this.requestCounts.delete(k);
            }
          }
          
          // Ensure minimum delay between requests
          const timeSinceLastRequest = now - this.lastRequestTime;
          if (timeSinceLastRequest < this.minDelay) {
            await new Promise(r => setTimeout(r, this.minDelay - timeSinceLastRequest));
          }
          
          this.lastRequestTime = Date.now();
          const result = await fn();
          resolve(result);
        } catch (error) {
          // If we get a 429, back off exponentially
          if (error?.status === 429 || error?.statusCode === 429) {
            console.log('Got 429 from server, backing off...');
            await new Promise(r => setTimeout(r, 5000)); // Wait 5 seconds
            return this.throttle(endpoint, fn).then(resolve).catch(reject);
          }
          reject(error);
        }
      };
      
      this.queue.push(execute);
      this.processQueue();
    });
  }
  
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (task) {
        await task();
      }
    }
    
    this.isProcessing = false;
  }
}

export const rateLimiter = new RateLimiter();