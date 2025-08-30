import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { DATABASE_MODE } from '@/utils/consolidated/databaseUtils';
import { turso } from '@/utils/consolidated/databaseUtils';
import { connectionStatus as globalConnectionStatus } from '@/utils/connectionStatus';

export const RealtimeConnectionMonitor = () => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date>(() => new Date());

  useEffect(() => {
    // Only run connection tests in Turso mode
    if (DATABASE_MODE !== 'turso') return;

    let mounted = true;

    const testConnection = async () => {
      try {
        // Simple health check query to Turso with timeout
        const start = Date.now();
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout')), 5000);
        });
        
        // Race between the query and timeout
        await Promise.race([
          turso.execute('SELECT 1'),
          timeoutPromise
        ]);
        
        const latency = Date.now() - start;
        
        if (!mounted) return;
        
        setConnectionStatus('connected');
        setLastError(null);
        setLastSync(new Date());
        
        // Log latency if it's high
        if (latency > 1000) {
          console.warn(`High Turso latency: ${latency}ms`);
        }
      } catch (error) {
        console.error('Turso connection test error:', error);
        if (mounted) {
          setConnectionStatus('error');
          setLastError(error instanceof Error ? error.message : 'Unknown error');
        }
      }
    };

    // Initial connection test
    testConnection();

    // Poll every 2 minutes instead of 30 seconds due to high latency
    const intervalId = setInterval(testConnection, 120000);

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-muted0';
      case 'connecting':
        return 'bg-muted0';
      case 'disconnected':
        return 'bg-muted0';
      case 'error':
        return 'bg-muted0';
      default:
        return 'bg-muted0';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  // Only show connection monitor for Turso mode and in development
  if (DATABASE_MODE !== 'turso' || import.meta.env.PROD) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge 
        variant="outline" 
        className="flex items-center gap-2 px-3 py-1 bg-background/95 backdrop-blur"
      >
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
        <span className="text-xs font-medium">
          Turso: {getStatusText()}
        </span>
        {lastError && (
          <span className="text-xs text-muted-foreground ml-1">
            ({lastError})
          </span>
        )}
        {connectionStatus === 'connected' && (
          <span className="text-xs text-muted-foreground ml-1">
            (Last sync: {lastSync.toLocaleTimeString()})
          </span>
        )}
      </Badge>
    </div>
  );
};