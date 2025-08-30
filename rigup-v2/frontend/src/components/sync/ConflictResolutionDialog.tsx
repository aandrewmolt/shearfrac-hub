import React, { useCallback, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Cloud, Database } from 'lucide-react';
import { format } from 'date-fns';
import edgeSync from '@/services/edgeFunctionSync';
import { toast } from 'sonner';

interface ConflictData {
  hasConflict: boolean;
  type?: string;
  local?: any;
  remote?: any;
  error?: any;
}

interface ConflictResolutionDialogProps {
  open: boolean;
  onClose: () => void;
  conflicts: ConflictData[];
  onResolved: () => void;
}

export function ConflictResolutionDialog({
  open,
  onClose,
  conflicts,
  onResolved
}: ConflictResolutionDialogProps) {
  const [resolving, setResolving] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const currentConflict = conflicts[currentIndex];
  
  const handleResolve = useCallback(async (resolution: 'local' | 'remote') => {
    if (!currentConflict || !currentConflict.local) return;
    
    setResolving(true);
    try {
      const equipmentId = currentConflict.local.equipmentId || currentConflict.local.id;
      
      await edgeSync.conflicts.resolveConflict(
        equipmentId,
        resolution,
        resolution === 'local' ? currentConflict.local : undefined
      );
      
      toast.success(
        resolution === 'local' 
          ? 'Local changes applied to cloud' 
          : 'Cloud changes applied locally'
      );
      
      // Move to next conflict or close
      if (currentIndex < conflicts.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onResolved();
        onClose();
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      toast.error('Failed to resolve conflict');
    } finally {
      setResolving(false);
    }
  }, [currentConflict, currentIndex, conflicts.length, onResolved, onClose]);
  
  if (!currentConflict || !currentConflict.hasConflict) {
    return null;
  }
  
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Unknown';
    try {
      return format(new Date(dateStr), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateStr;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Sync Conflict Detected ({currentIndex + 1} of {conflicts.length})
          </DialogTitle>
          <DialogDescription>
            The equipment status differs between your local changes and the cloud.
            Choose which version to keep.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm">
              Equipment: {currentConflict.local?.name || currentConflict.local?.equipmentId || 'Unknown'}
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Local Version */}
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-blue-500" />
                <h4 className="font-medium">Local Version</h4>
              </div>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-muted-foreground">Status:</span>{' '}
                  <span className="font-medium">{currentConflict.local?.status}</span>
                </div>
                {currentConflict.local?.jobId && (
                  <div>
                    <span className="text-muted-foreground">Job ID:</span>{' '}
                    <span className="font-medium">{currentConflict.local.jobId}</span>
                  </div>
                )}
                {currentConflict.local?.locationId && (
                  <div>
                    <span className="text-muted-foreground">Location:</span>{' '}
                    <span className="font-medium">{currentConflict.local.locationId}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Updated:</span>{' '}
                  <span className="font-medium">
                    {formatDate(currentConflict.local?.updatedAt || currentConflict.local?.updated_at)}
                  </span>
                </div>
              </div>
              <Button
                onClick={() => handleResolve('local')}
                disabled={resolving}
                className="w-full mt-3"
                variant="outline"
              >
                Keep Local Version
              </Button>
            </div>
            
            {/* Remote Version */}
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Cloud className="h-4 w-4 text-green-500" />
                <h4 className="font-medium">Cloud Version</h4>
              </div>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-muted-foreground">Status:</span>{' '}
                  <span className="font-medium">{currentConflict.remote?.status}</span>
                </div>
                {currentConflict.remote?.job_id && (
                  <div>
                    <span className="text-muted-foreground">Job ID:</span>{' '}
                    <span className="font-medium">{currentConflict.remote.job_id}</span>
                  </div>
                )}
                {currentConflict.remote?.location_id && (
                  <div>
                    <span className="text-muted-foreground">Location:</span>{' '}
                    <span className="font-medium">{currentConflict.remote.location_id}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Updated:</span>{' '}
                  <span className="font-medium">
                    {formatDate(currentConflict.remote?.updated_at)}
                  </span>
                </div>
              </div>
              <Button
                onClick={() => handleResolve('remote')}
                disabled={resolving}
                className="w-full mt-3"
                variant="outline"
              >
                Keep Cloud Version
              </Button>
            </div>
          </div>
          
          {conflicts.length > 1 && (
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Conflict {currentIndex + 1} of {conflicts.length}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentIndex(Math.min(currentIndex + 1, conflicts.length - 1));
                }}
                disabled={currentIndex >= conflicts.length - 1}
              >
                Skip
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}