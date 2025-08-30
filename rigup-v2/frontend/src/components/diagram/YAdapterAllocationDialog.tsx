import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Zap, MapPin, Package } from 'lucide-react';
import { useInventory } from '@/contexts/InventoryContext';
import { useJobs } from '@/hooks/useJobs';
import { IndividualEquipment } from '@/types/inventory';

interface YAdapterAllocationDialogProps {
  open: boolean;
  onClose: () => void;
  onAllocate: (equipmentId: string, equipmentName: string) => void;
  jobId: string;
  existingAllocations: string[];
}

export const YAdapterAllocationDialog: React.FC<YAdapterAllocationDialogProps> = ({
  open,
  onClose,
  onAllocate,
  jobId,
  existingAllocations
}) => {
  const { data } = useInventory();
  const { jobs } = useJobs();
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');

  const currentJob = jobs.find(j => j.id === jobId);

  // Get Y-adapter type ID
  const yAdapterType = data.equipmentTypes.find(type => 
    type.id === 'y-adapter' || type.name.toLowerCase().includes('y-adapter')
  );

  // Get available Y-adapters
  const availableYAdapters = useMemo(() => {
    if (!yAdapterType) return [];

    return data.individualEquipment.filter(item => 
      item.typeId === yAdapterType.id &&
      item.status === 'available' &&
      !existingAllocations.includes(item.id)
    );
  }, [data.individualEquipment, yAdapterType, existingAllocations]);

  const handleAllocate = () => {
    const selectedEquipment = availableYAdapters.find(e => e.id === selectedEquipmentId);
    if (selectedEquipment) {
      onAllocate(selectedEquipment.id, selectedEquipment.equipmentId);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Select Y-Adapter
          </DialogTitle>
          <DialogDescription>
            Choose a Y-adapter to allocate to {currentJob?.name || 'this job'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {availableYAdapters.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No Y-adapters available</p>
              <p className="text-sm mt-2">All Y-adapters are currently deployed or in maintenance</p>
            </div>
          ) : (
            <RadioGroup value={selectedEquipmentId} onValueChange={setSelectedEquipmentId}>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {availableYAdapters.map((equipment) => {
                  const location = data.storageLocations.find(loc => loc.id === equipment.locationId);
                  
                  return (
                    <div key={equipment.id} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent">
                      <RadioGroupItem value={equipment.id} id={equipment.id} />
                      <Label 
                        htmlFor={equipment.id} 
                        className="flex-1 cursor-pointer flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium">{equipment.equipmentId}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {location?.name || 'Unknown Location'}
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-muted">
                          Available
                        </Badge>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAllocate} 
            disabled={!selectedEquipmentId || availableYAdapters.length === 0}
          >
            Allocate Y-Adapter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};