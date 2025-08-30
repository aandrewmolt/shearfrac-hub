import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Package } from 'lucide-react';
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
import { initializeFullInventory } from '@/scripts/initializeFullInventory';

export const InitializeInventoryButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleInitialize = async () => {
    setShowConfirmDialog(false);
    setIsLoading(true);
    
    try {
      await initializeFullInventory();
      toast.success('Inventory initialized successfully!', {
        description: 'All equipment items and cable quantities have been set up.'
      });
      
      // Refresh the page to show new data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Failed to initialize inventory:', error);
      toast.error('Failed to initialize inventory', {
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
            Initializing...
          </>
        ) : (
          <>
            <Package className="h-4 w-4" />
            Initialize Full Inventory
          </>
        )}
      </Button>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Initialize Full Inventory?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>This will create the following equipment items:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>15 ShearStream boxes (SS001-SS015)</li>
                <li>10 Customer Tablets (CT01-CT10)</li>
                <li>15 Starlink units (SL01-SL15)</li>
                <li>10 Customer Computers (CC01-CC10)</li>
              </ul>
              <p className="mt-2">And create cable inventory (if not already present):</p>
              <ul className="list-disc list-inside space-y-1">
                <li>100ft Cables: 10 units</li>
                <li>200ft Cables: 10 units</li>
                <li>300ft Cables (Old): 10 units</li>
                <li>300ft Cables (New): 10 units</li>
                <li>Direct Connection: Unlimited (9999 units)</li>
              </ul>
              <p className="mt-3 font-semibold">
                Existing items will NOT be modified - only missing items will be created.
              </p>
              <p className="text-sm text-muted-foreground">
                Your custom quantities will be preserved. This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleInitialize}>
              Initialize Inventory
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};