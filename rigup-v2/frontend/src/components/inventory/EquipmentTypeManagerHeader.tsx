
import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Settings } from 'lucide-react';
import EquipmentTypeForm from './EquipmentTypeForm';
import { EquipmentType, CreateEquipmentTypeInput } from '@/types/types';

interface EquipmentTypeManagerHeaderProps {
  filteredTypesCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isDialogOpen: boolean;
  onDialogOpenChange: (open: boolean) => void;
  editingType: EquipmentType | null;
  onEditingTypeChange: (type: EquipmentType | null) => void;
  onSubmit: (formData: CreateEquipmentTypeInput) => void;
  onCancel: () => void;
}

const EquipmentTypeManagerHeader: React.FC<EquipmentTypeManagerHeaderProps> = ({
  filteredTypesCount,
  searchTerm,
  onSearchChange,
  isDialogOpen,
  onDialogOpenChange,
  editingType,
  onEditingTypeChange,
  onSubmit,
  onCancel,
}) => {
  return (
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5" />
          Equipment Types ({filteredTypesCount})
        </CardTitle>
        
        <Dialog open={isDialogOpen} onOpenChange={onDialogOpenChange}>
          <DialogTrigger asChild>
            <Button onClick={() => onEditingTypeChange(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingType ? 'Edit Equipment Type' : 'Add Equipment Type'}
              </DialogTitle>
            </DialogHeader>
            <EquipmentTypeForm
              editingType={editingType}
              onSubmit={onSubmit}
              onCancel={onCancel}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="relative">
        <Input
          placeholder="Search equipment types..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-4"
        />
      </div>
    </CardHeader>
  );
};

export default EquipmentTypeManagerHeader;
