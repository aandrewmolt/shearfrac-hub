import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ConflictIndicatorProps {
  hasConflict: boolean;
  conflictMessage?: string;
}

export const ConflictIndicator: React.FC<ConflictIndicatorProps> = ({ 
  hasConflict, 
  conflictMessage 
}) => {
  if (!hasConflict) {
    return (
      <div className="flex items-center gap-2 text-foreground">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">Available</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-amber-600">
      <AlertTriangle className="h-4 w-4" />
      <span className="text-sm">{conflictMessage || 'Conflict detected'}</span>
    </div>
  );
};

// Add default export for compatibility
export default ConflictIndicator;