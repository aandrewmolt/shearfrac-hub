import React from 'react';
import { Wifi, Cloud } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { DATABASE_MODE } from '@/utils/consolidated/databaseUtils';

export function OfflineStatusBar() {
  // Only show for Turso mode
  if (DATABASE_MODE !== 'turso') {
    return null;
  }
  
  // With Turso, we're always "online" when connected to the internet
  const isOnline = navigator.onLine;
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="bg-white dark:bg-gray-800 shadow-lg p-3 flex items-center gap-3">
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Cloud className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400">Turso Connected</span>
            </>
          ) : (
            <>
              <Wifi className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-yellow-600 dark:text-yellow-400">Offline Mode</span>
            </>
          )}
        </div>
        
        {/* Mode Badge */}
        <Badge variant="secondary" className="text-xs">
          Turso DB
        </Badge>
      </Card>
    </div>
  );
}