import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw } from 'lucide-react';
import { fixAllMissingDates } from '@/utils/fixMissingDates';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function DateFixButton() {
  const [isFixing, setIsFixing] = useState(false);
  const queryClient = useQueryClient();
  
  const handleFixDates = async () => {
    setIsFixing(true);
    
    try {
      toast.info('Fixing missing dates...');
      
      const result = await fixAllMissingDates();
      
      if (result.jobs.success) {
        toast.success(`Fixed ${result.jobs.updated} jobs with missing dates`);
        
        // Invalidate queries to refresh the data
        await queryClient.invalidateQueries({ queryKey: ['jobs'] });
        
        // Reload the page to ensure all components update
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error('Failed to fix dates. Check console for details.');
      }
    } catch (error) {
      console.error('Error fixing dates:', error);
      toast.error('An error occurred while fixing dates');
    } finally {
      setIsFixing(false);
    }
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleFixDates}
      disabled={isFixing}
      className="gap-2"
    >
      {isFixing ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Fixing Dates...
        </>
      ) : (
        <>
          <Calendar className="h-4 w-4" />
          Fix Missing Dates
        </>
      )}
    </Button>
  );
}