
import React, { useState } from 'react';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Package } from 'lucide-react';
import ExtraEquipmentForm from './extras/ExtraEquipmentForm';
import ExtraEquipmentList from './extras/ExtraEquipmentList';

interface ExtrasOnLocationPanelProps {
  extrasOnLocation: Array<{
    id: string;
    equipmentTypeId: string;
    quantity: number;
    reason: string;
    addedDate: Date;
    notes?: string;
    individualEquipmentId?: string;
  }>;
  onAddExtra: (equipmentTypeId: string, quantity: number, reason: string, notes?: string, individualEquipmentId?: string) => void;
  onRemoveExtra: (extraId: string) => void;
}

const ExtrasOnLocationPanel: React.FC<ExtrasOnLocationPanelProps> = ({
  extrasOnLocation,
  onAddExtra,
  onRemoveExtra,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <CollapsibleCard
      className="bg-card shadow-lg"
      defaultOpen={extrasOnLocation.length > 0}
      title="Extras on Location"
      icon={<Package className="h-5 w-5" />}
      badge={extrasOnLocation.length > 0 && (
        <Badge variant="secondary" className="ml-2">
          {extrasOnLocation.length}
        </Badge>
      )}
      action={
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-success hover:bg-success/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Extra
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Extra Equipment on Location</DialogTitle>
            </DialogHeader>
            <ExtraEquipmentForm
              onAddExtra={onAddExtra}
              onClose={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-4">
        <ExtraEquipmentList
          extrasOnLocation={extrasOnLocation}
          onRemoveExtra={onRemoveExtra}
        />
      </div>
    </CollapsibleCard>
  );
};

export default ExtrasOnLocationPanel;
