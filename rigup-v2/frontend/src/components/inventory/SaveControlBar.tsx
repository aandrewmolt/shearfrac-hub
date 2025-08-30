
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Save, X, Clock } from 'lucide-react';

interface SaveControlBarProps {
  hasUnsavedChanges: boolean;
  unsavedCount: number;
  onSave: () => void;
  onDiscard: () => void;
}

const SaveControlBar: React.FC<SaveControlBarProps> = ({
  hasUnsavedChanges,
  unsavedCount,
  onSave,
  onDiscard,
}) => {
  if (!hasUnsavedChanges) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
      <Card className="px-4 py-3 bg-muted border-border shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">
              {unsavedCount} unsaved {unsavedCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={onDiscard} variant="outline" size="sm">
              <X className="mr-2 h-4 w-4" />
              Discard
            </Button>
            <Button onClick={onSave} size="sm" className="bg-green-600 hover:bg-green-700">
              <Save className="mr-2 h-4 w-4" />
              Save Now
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SaveControlBar;
