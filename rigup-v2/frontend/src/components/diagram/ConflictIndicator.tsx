import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EquipmentConflict } from '@/types/equipment-allocation';

interface ConflictIndicatorProps {
  conflicts: EquipmentConflict[];
  onResolveConflict?: (conflict: EquipmentConflict, resolution: 'current' | 'requested') => Promise<void>;
  className?: string;
}

const ConflictIndicator: React.FC<ConflictIndicatorProps> = ({
  conflicts,
  onResolveConflict,
  className = ''
}) => {
  if (conflicts.length === 0) {
    return null;
  }

  const handleResolve = async (conflict: EquipmentConflict, resolution: 'current' | 'requested') => {
    if (onResolveConflict) {
      await onResolveConflict(conflict, resolution);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge 
          variant="destructive" 
          className={`cursor-pointer hover:bg-red-600 ${className}`}
        >
          <AlertTriangle className="w-3 h-3 mr-1" />
          {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Equipment Conflicts
          </div>
          
          {conflicts.map((conflict, index) => (
            <div key={index} className="border rounded-lg p-3 space-y-2">
              <div className="text-sm">
                <span className="font-medium">{conflict.equipmentName}</span> is currently assigned to{' '}
                <span className="font-medium text-foreground">{conflict.currentJobName}</span>
              </div>
              
              {onResolveConflict && (
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolve(conflict, 'current')}
                    className="text-xs"
                  >
                    Keep with {conflict.currentJobName}
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleResolve(conflict, 'requested')}
                    className="text-xs"
                  >
                    Move to {conflict.requestedJobName}
                  </Button>
                </div>
              )}
            </div>
          ))}
          
          <div className="text-xs text-muted-foreground flex items-start gap-1">
            <Info className="w-3 h-3 mt-0.5" />
            <span>Resolve conflicts to ensure equipment is properly allocated to the correct job.</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ConflictIndicator;