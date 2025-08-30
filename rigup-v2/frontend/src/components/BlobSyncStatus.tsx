import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { DATABASE_MODE } from '@/utils/consolidated/databaseUtils';
import { blobStorage } from '@/integrations/blob/client';
// Turso syncs automatically, no manual sync needed

export const BlobSyncStatus = () => {
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Only fetch sync status in vercel-blob mode
    if (DATABASE_MODE !== 'vercel-blob') return;

    // Check last sync on mount
    blobStorage.getLastSync().then(setLastSync);

    // Update every 10 seconds
    const interval = setInterval(() => {
      blobStorage.getLastSync().then(setLastSync);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Only show in vercel-blob mode
  if (DATABASE_MODE !== 'vercel-blob') {
    return null;
  }

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      // Turso syncs automatically
      const newSyncTime = await blobStorage.getLastSync();
      setLastSync(newSyncTime);
    } finally {
      setSyncing(false);
    }
  };

  const getTimeSinceSync = () => {
    if (!lastSync) return 'Never';
    
    const seconds = Math.floor((Date.now() - lastSync.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  // In browser, we can still sync through API routes
  const isOnline = DATABASE_MODE === 'vercel-blob';

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={isOnline ? 'default' : 'secondary'}
        className="flex items-center gap-1"
      >
        {isOnline ? (
          <Cloud className="h-3 w-3" />
        ) : (
          <CloudOff className="h-3 w-3" />
        )}
        {isOnline ? 'Cloud Sync' : 'Offline'}
      </Badge>
      
      {isOnline && (
        <>
          <span className="text-xs text-muted-foreground">
            Last sync: {getTimeSinceSync()}
          </span>
          <Button
            onClick={handleManualSync}
            disabled={syncing}
            variant="ghost"
            size="sm"
            className="p-1 h-auto w-auto hover:bg-accent rounded"
            title="Sync now"
          >
            <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
          </Button>
        </>
      )}
    </div>
  );
};