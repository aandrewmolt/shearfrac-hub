
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { X } from 'lucide-react';

interface EdgeLabelProps {
  label: string;
  isInteractive: boolean;
  onToggle?: () => void;
  onDelete?: () => void;
  labelX: number;
  labelY: number;
  selected?: boolean;
}

const EdgeLabel: React.FC<EdgeLabelProps> = ({
  label,
  isInteractive,
  onToggle,
  onDelete,
  labelX,
  labelY,
  selected = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`
        flex items-center gap-1 rounded-md px-2 py-1 shadow-sm transition-all duration-200
        ${selected 
          ? 'bg-blue-500/20 border border-blue-500/50 shadow-lg ring-2 ring-blue-500/30' 
          : isHovered 
            ? 'bg-blue-500/15 border border-blue-500/40 shadow-md' 
            : 'bg-blue-500/10 border border-blue-500/30'
        }
      `}>
        {isInteractive && onToggle ? (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              console.log('EdgeLabel button clicked for toggle');
              onToggle();
            }}
            variant="ghost"
            size="sm"
            className={`
              text-xs font-medium cursor-pointer transition-colors duration-200 h-auto p-0
              ${selected
                ? 'text-foreground hover:text-primary'
                : isHovered 
                  ? 'text-foreground hover:text-primary' 
                  : 'text-foreground hover:text-foreground'
              }
            `}
            title={isInteractive ? "Click to toggle connection type (T)" : undefined}
          >
            {label}
          </Button>
        ) : (
          <span className={`
            text-xs font-medium transition-colors duration-200
            ${selected
              ? 'text-foreground'
              : isHovered ? 'text-foreground' : 'text-muted-foreground'
            }
          `}>
            {label}
          </span>
        )}
        
        {onDelete && (selected || isHovered) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className={`
              h-4 w-4 p-0 transition-all duration-200
              ${selected || isHovered 
                ? 'opacity-100 hover:bg-muted hover:text-destructive' 
                : 'opacity-70 hover:bg-muted hover:text-destructive'
              }
            `}
            title="Delete connection (Del)"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {/* Keyboard shortcut hint for selected edges */}
      {selected && isInteractive && (
        <TooltipProvider>
          <Tooltip open={true}>
            <TooltipTrigger asChild>
              <div className="absolute inset-0" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Press T to toggle • Del to delete</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default EdgeLabel;
