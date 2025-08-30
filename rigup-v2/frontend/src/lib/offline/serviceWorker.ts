// Service Worker Registration and Management
export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  
  async register(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return false;
    }
    
    try {
      this.registration = await navigator.serviceWorker.register('/service-worker.js');
      
      console.log('Service Worker registered successfully');
      
      // Listen for updates
      if (this.registration) {
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration?.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                this.notifyUpdateAvailable();
              }
            });
          }
        });
      }
      
      // Listen for messages from service worker
      if (navigator.serviceWorker) {
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage);
      }
      
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }
  
  private handleServiceWorkerMessage = (event: MessageEvent) => {
    const { data } = event;
    
    switch (data.type) {
      case 'BACKGROUND_SYNC':
        // Service worker detected pending operations
        console.log(`Background sync available: ${data.payload.pendingOperations} operations`);
        this.triggerSync();
        break;
        
      default:
        console.log('Unknown service worker message:', data);
    }
  };
  
  private notifyUpdateAvailable() {
    // You can show a toast notification here
    console.log('App update available. Refresh to get the latest version.');
    
    // Auto-update after 5 seconds (optional)
    setTimeout(() => {
      this.updateServiceWorker();
    }, 5000);
  }
  
  updateServiceWorker() {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }
  
  async requestBackgroundSync(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }
    
    try {
      if ('sync' in window.ServiceWorkerRegistration.prototype) {
        await this.registration.sync.register('background-sync');
        console.log('Background sync registered');
        return true;
      } else {
        console.log('Background sync not supported');
        return false;
      }
    } catch (error) {
      console.error('Failed to register background sync:', error);
      return false;
    }
  }
  
  private async triggerSync() {
    // Import sync manager dynamically to avoid circular dependencies
    const { syncManager } = await import('./syncManager');
    await syncManager.performSync();
  }
  
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }
    
    try {
      const result = await this.registration.unregister();
      console.log('Service Worker unregistered');
      return result;
    } catch (error) {
      console.error('Failed to unregister service worker:', error);
      return false;
    }
  }
  
  isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }
  
  isRegistered(): boolean {
    return this.registration !== null;
  }
  
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }
}

// Lazy-loaded singleton instance
let _serviceWorkerManager: ServiceWorkerManager | null = null;

export const getServiceWorkerManager = (): ServiceWorkerManager => {
  if (!_serviceWorkerManager) {
    _serviceWorkerManager = new ServiceWorkerManager();
  }
  return _serviceWorkerManager;
};

// Export for backward compatibility (will be lazy-loaded on first access)
export const serviceWorkerManager = new Proxy({} as ServiceWorkerManager, {
  get(target, prop) {
    const manager = getServiceWorkerManager();
    return (manager as Record<string, unknown>)[prop as string];
  }
});

// Function to initialize service worker (call this from app initialization)
export const initializeServiceWorker = async () => {
  if (typeof window !== 'undefined' && import.meta.env?.PROD) {
    const manager = getServiceWorkerManager();
    const success = await manager.register();
    if (success) {
      console.log('RigUp is now available offline!');
    }
  }
};