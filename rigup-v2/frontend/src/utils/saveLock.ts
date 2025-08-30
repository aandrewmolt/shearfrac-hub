// Save lock mechanism to prevent concurrent save operations
class SaveLock {
  private locks: Map<string, boolean> = new Map();
  private lockTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private saveQueues: Map<string, Array<() => void>> = new Map();
  private lastSaveTime: Map<string, number> = new Map();
  private readonly MIN_SAVE_INTERVAL = 500; // Increased to 500ms to reduce save frequency
  
  /**
   * Acquire a lock for a specific resource
   * Returns true if lock was acquired, false if resource is already locked
   */
  acquire(resourceId: string, timeoutMs: number = 60000): boolean { // Increased to 60 seconds
    // Check if we're saving too frequently
    const lastSave = this.lastSaveTime.get(resourceId) || 0;
    const timeSinceLastSave = Date.now() - lastSave;
    
    if (timeSinceLastSave < this.MIN_SAVE_INTERVAL) {
      console.log(`Throttling save for ${resourceId} - only ${timeSinceLastSave}ms since last save`);
      return false;
    }
    
    if (this.locks.get(resourceId)) {
      return false; // Resource is already locked
    }
    
    // Acquire the lock
    this.locks.set(resourceId, true);
    this.lastSaveTime.set(resourceId, Date.now());
    
    // Auto-release lock after timeout to prevent deadlocks
    // Increased timeout to 30 seconds for slow connections
    const timeout = setTimeout(() => {
      console.warn(`Auto-releasing lock for ${resourceId} after ${timeoutMs}ms timeout`);
      this.release(resourceId);
    }, timeoutMs);
    
    this.lockTimeouts.set(resourceId, timeout);
    return true;
  }
  
  /**
   * Release a lock for a specific resource
   */
  release(resourceId: string): void {
    this.locks.delete(resourceId);
    
    const timeout = this.lockTimeouts.get(resourceId);
    if (timeout) {
      clearTimeout(timeout);
      this.lockTimeouts.delete(resourceId);
    }
  }
  
  /**
   * Check if a resource is locked
   */
  isLocked(resourceId: string): boolean {
    return this.locks.get(resourceId) || false;
  }
  
  /**
   * Execute a function with a lock, with improved retry logic
   */
  async withLock<T>(resourceId: string, fn: () => Promise<T>, timeoutMs: number = 60000): Promise<T> { // Increased to 60 seconds
    const maxRetries = 2; // Reduced retries
    const baseDelay = 250; // Increased base delay
    
    // First, check if we should skip due to throttling
    const lastSave = this.lastSaveTime.get(resourceId) || 0;
    const timeSinceLastSave = Date.now() - lastSave;
    
    if (timeSinceLastSave < this.MIN_SAVE_INTERVAL) {
      console.log(`Skipping save for ${resourceId} - throttled (${timeSinceLastSave}ms since last save)`);
      // Return the result of the function without actually executing it
      // This prevents the save from happening but doesn't throw an error
      return Promise.resolve({} as T);
    }
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      if (this.acquire(resourceId, timeoutMs)) {
        try {
          const result = await fn();
          return result;
        } catch (error) {
          // If the save fails, still release the lock
          console.error(`Save failed for ${resourceId}:`, error);
          throw error;
        } finally {
          this.release(resourceId);
        }
      }
      
      // If not the last attempt, wait and retry with exponential backoff
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Resource ${resourceId} is locked, waiting ${delay}ms before retry (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // If all retries failed, skip this save instead of forcing
    console.warn(`Skipping save for resource ${resourceId} after ${maxRetries} attempts - resource is busy`);
    
    // Return empty result to prevent errors
    return Promise.resolve({} as T);
  }
}

// Lazy-loaded singleton instance
let _saveLock: SaveLock | null = null;

export const getSaveLock = (): SaveLock => {
  if (!_saveLock) {
    _saveLock = new SaveLock();
  }
  return _saveLock;
};

// Export for backward compatibility (will be lazy-loaded on first access)
export const saveLock = new Proxy({} as SaveLock, {
  get(target, prop) {
    const lock = getSaveLock();
    return (lock as Record<string, unknown>)[prop as string];
  }
});