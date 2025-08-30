
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MoreHorizontal, RotateCcw, Trash2 } from 'lucide-react';

interface EdgeContextMenuProps {
  edgeId: string;
  isYToWellConnection: boolean;
  onToggle: () => void;
  onDelete: () => void;
  labelX: number;
  labelY: number;
}

const EdgeContextMenu: React.FC<EdgeContextMenuProps> = ({
  edgeId,
  isYToWellConnection,
  onToggle,
  onDelete,
  labelX,
  labelY,
}) => {
  return (
    <div
      className="absolute pointer-events-auto z-30"
      style={{
        transform: `translate(-50%, -50%) translate(${labelX + 80}px,${labelY}px)`,
      }}
    >
      <Card className="flex items-center gap-1 bg-card/95 backdrop-blur-sm border-border shadow-lg p-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-muted"
          title="More options"
        >
          <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
        </Button>
        
        {isYToWellConnection && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggle}
            className="h-6 w-6 p-0 hover:bg-muted hover:text-foreground"
            title="Toggle connection type (T)"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
        
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="h-6 w-6 p-0 hover:bg-muted hover:text-destructive"
          title="Delete connection (Del)"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </Card>
    </div>
  );
};

export default EdgeContextMenu;
