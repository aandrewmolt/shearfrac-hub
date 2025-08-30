/**
 * Connection Status Utility
 * Tracks network connectivity and database connection health
 */

class ConnectionStatus {
  private isOnline: boolean = navigator.onLine;
  private latency: number = 0;
  private lastPingTime: number = Date.now();
  private listeners: Set<(status: ConnectionStatusInfo) => void> = new Set();

  constructor() {
    this.setupNetworkListeners();
    this.startLatencyTracking();
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  private startLatencyTracking() {
    // Ping every 30 seconds to measure latency
    setInterval(() => {
      this.measureLatency();
    }, 30000);
    
    // Initial measurement
    this.measureLatency();
  }

  private async measureLatency() {
    if (!this.isOnline) return;

    try {
      const start = performance.now();
      
      // Ping a lightweight endpoint or use fetch with cache-busting
      await fetch('/favicon.ico?' + Date.now(), {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      const end = performance.now();
      this.latency = Math.round(end - start);
      this.lastPingTime = Date.now();
      
      this.notifyListeners();
    } catch (error) {
      // If ping fails, assume connection issues
      this.latency = Infinity;
      this.notifyListeners();
    }
  }

  public getStatus(): ConnectionStatusInfo {
    return {
      isOnline: this.isOnline,
      latency: this.latency,
      lastPingTime: this.lastPingTime,
      connectionQuality: this.getConnectionQuality()
    };
  }

  public getLatency(): number {
    return this.latency;
  }

  public isConnected(): boolean {
    return this.isOnline && this.latency < 10000; // 10 second timeout
  }

  private getConnectionQuality(): 'excellent' | 'good' | 'poor' | 'offline' {
    if (!this.isOnline) return 'offline';
    if (this.latency < 100) return 'excellent';
    if (this.latency < 500) return 'good';
    return 'poor';
  }

  public subscribe(callback: (status: ConnectionStatusInfo) => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    const status = this.getStatus();
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Connection status listener error:', error);
      }
    });
  }

  public async testDatabaseConnection(): Promise<boolean> {
    try {
      // Test if we can reach our API
      const response = await fetch('/api/sync/status?jobId=test-connection', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}

export interface ConnectionStatusInfo {
  isOnline: boolean;
  latency: number;
  lastPingTime: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
}

// Export singleton instance
export const connectionStatus = new ConnectionStatus();