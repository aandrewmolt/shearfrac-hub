import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { resetOfflineDatabase } from '@/utils/consolidated/storageUtils';

export function ClearOfflineDataButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();

  const handleClearData = async () => {
    try {
      const success = await resetOfflineDatabase();
      
      if (success) {
        toast({
          title: "Offline data cleared",
          description: "Your offline cache has been reset. The page will reload to apply changes.",
        });
        
        // Reload the page after a short delay to apply the changes
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast({
          title: "Error",
          description: "Failed to clear offline data. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while clearing offline data.",
        variant: "destructive",
      });
    }
    
    setShowConfirm(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirm(true)}
        className="gap-2 text-destructive hover:text-destructive hover:bg-muted"
      >
        <Trash2 className="h-4 w-4" />
        Clear Offline Cache
      </Button>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Clear Offline Data?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will clear all locally cached data and reset the offline database. 
              Any unsynced changes will be lost. The page will reload after clearing.
              
              <br /><br />
              
              This action is useful if you're experiencing issues with offline data 
              or after a database schema update.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearData}
              className="bg-destructive hover:bg-destructive/90"
            >
              Clear Data & Reload
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}