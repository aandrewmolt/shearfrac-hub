import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cleanupDuplicateInventory } from '@/scripts/cleanupDuplicateInventory';

export const CleanupDuplicatesButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleCleanup = async () => {
    setShowConfirmDialog(false);
    setIsLoading(true);
    
    try {
      await cleanupDuplicateInventory();
      toast.success('Duplicate cleanup completed!', {
        description: 'Duplicate equipment items have been merged.'
      });
      
      // Refresh the page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Failed to cleanup duplicates:', error);
      toast.error('Failed to cleanup duplicates', {
        description: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowConfirmDialog(true)}
        disabled={isLoading}
        variant="outline"
        className="gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Cleaning up...
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4" />
            Cleanup Duplicates
          </>
        )}
      </Button>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cleanup Duplicate Equipment?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>This will merge duplicate equipment items by:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Finding items with the same type, location, and status</li>
                <li>Combining their quantities</li>
                <li>Keeping the oldest entry</li>
                <li>Deleting the duplicate entries</li>
              </ul>
              <p className="mt-3 font-semibold">
                This action cannot be undone. Make sure you have a backup if needed.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCleanup}>
              Cleanup Duplicates
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};