import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Wrench } from 'lucide-react';
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
import { fixPressureGaugeId } from '@/scripts/fixPressureGaugeId';

export const FixPressureGaugeButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleFix = async () => {
    setShowConfirmDialog(false);
    setIsLoading(true);
    
    try {
      await fixPressureGaugeId();
      toast.success('Pressure gauge IDs fixed!', {
        description: 'Incorrect IDs have been updated and duplicates merged.'
      });
      
      // Refresh the page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Failed to fix pressure gauge IDs:', error);
      toast.error('Failed to fix pressure gauge IDs', {
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
            Fixing...
          </>
        ) : (
          <>
            <Wrench className="h-4 w-4" />
            Fix Gauge IDs
          </>
        )}
      </Button>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fix Pressure Gauge IDs?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>This will fix incorrect pressure gauge IDs by:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Changing 'pressure-gauge' to 'pressure-gauge-1502'</li>
                <li>Merging any duplicate 1502 pressure gauge entries</li>
                <li>Combining their quantities into one entry</li>
              </ul>
              <p className="mt-3 font-semibold">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFix}>
              Fix Gauge IDs
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};