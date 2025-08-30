
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, MapPin } from 'lucide-react';
import { useUnifiedInventory } from '@/hooks/useUnifiedInventory';
import { Badge } from '@/components/ui/badge';

interface JobDeletionDialogProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onConfirm: (returnLocationId?: string) => void;
  jobName: string;
  hasEquipment?: boolean;
  deployedEquipment?: Array<{
    id: string;
    typeId: string;
    quantity: number;
    typeName: string;
  }>;
}

export const JobDeletionDialog: React.FC<JobDeletionDialogProps> = ({
  open,
  isOpen,
  onOpenChange,
  onClose,
  onConfirm,
  jobName,
  hasEquipment = false,
  deployedEquipment = [],
}) => {
  const { data } = useUnifiedInventory();
  const dialogOpen = open !== undefined ? open : isOpen || false;
  const handleClose = onOpenChange ? () => onOpenChange(false) : onClose || (() => {});
  
  // Find "Midland Office" or default location
  const defaultLocation = data.storageLocations.find(loc => 
    loc.name.toLowerCase().includes('midland') || loc.isDefault
  ) || data.storageLocations[0];
  
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    defaultLocation?.id || ''
  );

  // Reset to default location when dialog opens
  useEffect(() => {
    if (dialogOpen && defaultLocation) {
      setSelectedLocationId(defaultLocation.id);
    }
  }, [dialogOpen, defaultLocation]);

  const handleConfirm = () => {
    if (deployedEquipment.length > 0 && !selectedLocationId) {
      return;
    }
    onConfirm(deployedEquipment.length > 0 ? selectedLocationId : undefined);
    handleClose();
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={onOpenChange || onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Job
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-muted-foreground">
            Are you sure you want to delete the job "{jobName}"?
          </p>
          
          {deployedEquipment.length > 0 && (
            <>
              <div className="border-l-4 border-border bg-muted p-4 rounded">
                <p className="text-sm font-medium text-foreground">
                  This job has equipment currently deployed. Please select where to return the equipment:
                </p>
              </div>

              {/* Equipment Summary */}
              <div className="border rounded-lg p-4 bg-muted">
                <h4 className="font-medium mb-3">Equipment to be returned:</h4>
                <div className="space-y-2">
                  {deployedEquipment.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-card rounded border">
                      <span className="text-sm">{item.typeName}</span>
                      <Badge variant="secondary">{item.quantity}x</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Return equipment to:</label>
                <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select storage location" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.storageLocations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {location.name}
                          {location.isDefault && <Badge variant="outline" className="text-xs">Default</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          {!hasEquipment && !deployedEquipment.length && (
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. All job data including diagrams will be permanently deleted.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={deployedEquipment.length > 0 && !selectedLocationId}
            className="bg-red-600 hover:bg-red-700"
          >
            {deployedEquipment.length > 0 ? 'Delete Job & Return Equipment' : 'Delete Job'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JobDeletionDialog;
