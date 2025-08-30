import React, { useEffect, useState } from 'react';
import { useInventoryMapperContext } from '@/contexts/InventoryMapperContext';
import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const SyncStatusIndicator: React.FC = () => {
  const { syncStatus, lastSyncTime } = useInventoryMapperContext();
  const [timeSinceSync, setTimeSinceSync] = useState<string>('');

  useEffect(() => {
    const updateTimeSinceSync = () => {
      if (!lastSyncTime) {
        setTimeSinceSync('Never');
        return;
      }

      const now = new Date();
      const diff = now.getTime() - lastSyncTime.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (hours > 0) {
        setTimeSinceSync(`${hours}h ago`);
      } else if (minutes > 0) {
        setTimeSinceSync(`${minutes}m ago`);
      } else {
        setTimeSinceSync(`${seconds}s ago`);
      }
    };

    updateTimeSinceSync();
    const interval = setInterval(updateTimeSinceSync, 1000);

    return () => clearInterval(interval);
  }, [lastSyncTime]);

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-primary animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <CheckCircle className="h-4 w-4 text-success" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'Syncing...';
      case 'error':
        return 'Sync Error';
      default:
        return 'Synced';
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'syncing':
        return 'text-foreground';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-foreground';
    }
  };

  return (
    <Badge variant="secondary" className="flex items-center gap-2 px-3 py-1.5">
      {getStatusIcon()}
      <div className="flex flex-col">
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {timeSinceSync}
        </span>
      </div>
    </Badge>
  );
};