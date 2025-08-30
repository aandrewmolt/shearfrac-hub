/**
 * Singleton equipment cache to prevent duplicate API requests
 */

interface CacheEntry {
  data: any;
  timestamp: number;
  promise?: Promise<any>;
}

class EquipmentCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  private pendingRequests = new Map<string, Promise<any>>();
  
  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // AGGRESSIVE: Check pending requests first
    if (this.pendingRequests.has(key)) {
      console.log(`[EquipmentCache] Returning pending request for: ${key}`);
      return this.pendingRequests.get(key)!;
    }
    
    const now = Date.now();
    const entry = this.cache.get(key);
    
    // If we have valid cached data, return it
    if (entry && (now - entry.timestamp) < this.TTL) {
      if (entry.promise) {
        // If a request is in flight, wait for it
        console.log(`[EquipmentCache] Waiting for in-flight request: ${key}`);
        return entry.promise;
      }
      console.log(`[EquipmentCache] Returning cached data for: ${key}`);
      return entry.data;
    }
    
    // If another request is already in flight, wait for it
    if (entry?.promise) {
      console.log(`[EquipmentCache] Joining in-flight request: ${key}`);
      return entry.promise;
    }
    
    console.log(`[EquipmentCache] Making new request for: ${key}`);
    
    // Make the request and cache the promise immediately
    const promise = fetcher().then(data => {
      // Cache the result
      this.cache.set(key, {
        data,
        timestamp: now,
        promise: undefined
      });
      // Remove from pending
      this.pendingRequests.delete(key);
      console.log(`[EquipmentCache] Cached result for: ${key}`);
      return data;
    }).catch(error => {
      // Remove the failed promise from cache
      if (this.cache.get(key)?.promise === promise) {
        this.cache.delete(key);
      }
      // Remove from pending
      this.pendingRequests.delete(key);
      console.error(`[EquipmentCache] Request failed for: ${key}`, error);
      throw error;
    });
    
    // Store in BOTH places to catch all duplicate attempts
    this.pendingRequests.set(key, promise);
    this.cache.set(key, {
      data: entry?.data,
      timestamp: entry?.timestamp || 0,
      promise
    });
    
    return promise;
  }
  
  invalidate(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
  
  // Debug method to see cache state
  getCacheState() {
    const state: Record<string, any> = {};
    for (const [key, entry] of this.cache) {
      state[key] = {
        hasData: !!entry.data,
        hasPromise: !!entry.promise,
        age: Date.now() - entry.timestamp
      };
    }
    return state;
  }
}

export const equipmentCache = new EquipmentCache();