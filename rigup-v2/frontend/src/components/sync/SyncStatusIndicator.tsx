import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Cloud, CloudOff, RefreshCw, AlertCircle, Check, XCircle } from 'lucide-react';
import edgeSync, { checkSyncHealth } from '@/services/edgeFunctionSync';
import { toast } from 'sonner';

export function SyncStatusIndicator() {
  const [syncing, setSyncing] = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncHealthy, setSyncHealthy] = useState(false);
  const [healthMessage, setHealthMessage] = useState('Checking...');
  const [checking, setChecking] = useState(true);
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // Check sync health
  useEffect(() => {
    const checkHealth = async () => {
      setChecking(true);
      try {
        const health = await checkSyncHealth();
        setSyncHealthy(health.healthy);
        setHealthMessage(health.message);
      } catch (error) {
        setSyncHealthy(false);
        setHealthMessage('Cannot reach sync service');
      } finally {
        setChecking(false);
      }
    };
    
    // Check immediately
    checkHealth();
    
    // Check periodically
    const healthInterval = setInterval(checkHealth, 30000); // Every 30 seconds
    
    return () => clearInterval(healthInterval);
  }, []);
  
  useEffect(() => {
    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check queue length periodically
    const interval = setInterval(() => {
      const queue = edgeSync.queue.getQueue();
      setQueueLength(queue.length);
    }, 5000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);
  
  const handleManualSync = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }
    
    if (!edgeSync.isEnabled()) {
      toast.info('Edge sync is not configured');
      return;
    }
    
    setSyncing(true);
    try {
      const result = await edgeSync.queue.process();
      setLastSyncTime(new Date());
      
      if (result) {
        if (result.processed > 0) {
          toast.success(`Synced ${result.processed} item(s)`);
        } else {
          toast.info('Already up to date');
        }
        setQueueLength(result.remaining);
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
      toast.error('Sync failed. Items remain in queue.');
    } finally {
      setSyncing(false);
    }
  };
  
  // Don't show if edge sync is not configured
  if (!edgeSync.isEnabled()) {
    return null;
  }
  
  return (
    <div className="flex items-center gap-2">
      {/* Connection Status */}
      <Badge 
        variant={checking ? 'secondary' : (syncHealthy ? 'success' : (isDevelopment ? 'secondary' : 'destructive'))} 
        className="flex items-center gap-1"
      >
        {checking ? (
          <>
            <RefreshCw className="h-3 w-3 animate-spin" />
            Checking...
          </>
        ) : syncHealthy ? (
          <>
            <Check className="h-3 w-3" />
            Connected
          </>
        ) : isDevelopment ? (
          <>
            <CloudOff className="h-3 w-3" />
            Local Mode
          </>
        ) : (
          <>
            <XCircle className="h-3 w-3" />
            Disconnected
          </>
        )}
      </Badge>
      
      {/* Network Status */}
      {!isOnline && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <CloudOff className="h-3 w-3" />
          Offline
        </Badge>
      )}
      
      {/* Health Message - show when not healthy and not checking */}
      {!checking && !syncHealthy && (
        <span className="text-xs text-muted-foreground">
          {healthMessage}
        </span>
      )}
      
      {/* Queue Status */}
      {queueLength > 0 && (
        <Badge variant="warning" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {queueLength} pending
        </Badge>
      )}
      
      {/* Sync Button - only show if healthy */}
      {syncHealthy && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleManualSync}
          disabled={syncing || !isOnline || !syncHealthy}
          className="h-8"
        >
          {syncing ? (
            <>
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Syncing...
            </>
          ) : queueLength > 0 ? (
            <>
              <RefreshCw className="h-3 w-3 mr-1" />
              Sync Now
            </>
          ) : (
            <>
              <Check className="h-3 w-3 mr-1" />
              Synced
            </>
          )}
        </Button>
      )}
      
      {/* Last Sync Time */}
      {lastSyncTime && syncHealthy && (
        <span className="text-xs text-muted-foreground">
          Last sync: {lastSyncTime.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}