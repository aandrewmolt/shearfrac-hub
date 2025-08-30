import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, RefreshCw } from 'lucide-react';
import { clearOfflineData } from '@/utils/consolidated/storageUtils';
import { toast } from 'sonner';

export function ClearOfflineDataButton() {
  const [isClearing, setIsClearing] = useState(false);
  
  const handleClearOfflineData = async () => {
    setIsClearing(true);
    
    try {
      toast.info('Clearing offline cache...');
      
      const result = await clearOfflineData();
      
      if (result.success) {
        toast.success('Offline cache cleared successfully');
        
        // Reload the page to fetch fresh data
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast.error('Failed to clear offline cache');
      }
    } catch (error) {
      console.error('Error clearing offline data:', error);
      toast.error('An error occurred while clearing cache');
    } finally {
      setIsClearing(false);
    }
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClearOfflineData}
      disabled={isClearing}
      className="gap-2 text-destructive hover:text-destructive"
    >
      {isClearing ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Clearing Cache...
        </>
      ) : (
        <>
          <Trash2 className="h-4 w-4" />
          Clear Offline Cache
        </>
      )}
    </Button>
  );
}