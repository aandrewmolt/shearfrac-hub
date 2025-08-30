import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useEquipmentStatusFix } from '@/hooks/useEquipmentStatusFix';
import { toast } from 'sonner';

interface QuickStatusFixProps {
  onFixed?: () => void;
}

const QuickStatusFix: React.FC<QuickStatusFixProps> = ({ onFixed }) => {
  const { fixEquipmentStatuses, checkEquipmentStatuses, isFixing } = useEquipmentStatusFix();
  const [needsFix, setNeedsFix] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(false);

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await checkEquipmentStatuses();
      setNeedsFix(result.totalProblems > 0);
      if (result.totalProblems > 0) {
        console.log('Equipment status issues found:', result);
      }
    } catch (error) {
      console.error('Failed to check equipment status:', error);
    } finally {
      setIsChecking(false);
    }
  }, [checkEquipmentStatuses]);

  React.useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleFix = async () => {
    try {
      const result = await fixEquipmentStatuses();
      console.log('Fix result:', result);
      
      // Re-check status
      await checkStatus();
      
      // Call callback if provided
      if (onFixed) {
        onFixed();
      }
      
      toast.success('Equipment statuses have been fixed! Please refresh to see available equipment.');
    } catch (error) {
      console.error('Failed to fix equipment statuses:', error);
      toast.error('Failed to fix equipment statuses');
    }
  };

  if (isChecking) {
    return null;
  }

  if (!needsFix) {
    return null;
  }

  return (
    <div className="bg-status-warning/20 border border-border rounded-md p-3 mb-4">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-status-warning mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-corporate-light">
            Equipment Status Issue Detected
          </p>
          <p className="text-xs text-status-warning mt-1">
            Some equipment items don't have proper status values, which prevents them from appearing as available.
          </p>
          <Button
            onClick={handleFix}
            disabled={isFixing}
            size="sm"
            variant="outline"
            className="mt-2 h-7 text-xs"
          >
            {isFixing ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Fixing...
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Fix Equipment Status
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuickStatusFix;