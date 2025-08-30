import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NodeDeleteButtonProps {
  onDelete: () => void;
  className?: string;
}

const NodeDeleteButton: React.FC<NodeDeleteButtonProps> = ({ onDelete, className = '' }) => {
  return (
    <Button
      onClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
      size="sm"
      variant="destructive"
      className={`absolute -top-2 -right-2 rounded-full p-1 h-6 w-6
                  shadow-md transition-all duration-200 hover:scale-110 ${className}`}
      title="Delete node"
    >
      <X className="h-3 w-3" />
    </Button>
  );
};

export default NodeDeleteButton;