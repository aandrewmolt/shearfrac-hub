import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Cable, AlertTriangle, CheckCircle, MapPin, Calendar } from 'lucide-react';
import { useAwsInventory as useInventory } from '@/hooks/useAwsInventory';
import { Edge } from '@xyflow/react';

interface CableAllocationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (cableId: string) => void;
  edge: Edge | null;
  jobId: string;
  cableTypeId: string;
}

const CableAllocationDialog: React.FC<CableAllocationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  edge,
  jobId,
  cableTypeId
}) => {
  const { data: inventoryData } = useInventory();
  const [selectedCableId, setSelectedCableId] = useState<string>('');
  const [availableCables, setAvailableCables] = useState<Array<{
    id: string;
    equipmentId: string;
    name: string;
    locationId: string;
    status: string;
  }>>([]);

  useEffect(() => {
    if (isOpen && cableTypeId) {
      // Get all individual cables of the specified type
      const cables = inventoryData.individualEquipment.filter(item => 
        item.typeId === cableTypeId && 
        (item.status === 'available' || (item.status === 'deployed' && item.jobId === jobId))
      );
      
      // Sort by equipment ID
      cables.sort((a, b) => a.equipmentId.localeCompare(b.equipmentId));
      
      setAvailableCables(cables);
      
      // If edge already has an allocated cable, pre-select it
      if (edge?.data?.equipmentId) {
        setSelectedCableId(edge.data.equipmentId);
      }
    }
  }, [isOpen, cableTypeId, inventoryData, edge, jobId]);

  const getCableType = () => {
    return inventoryData?.equipmentTypes?.find(type => type.id === cableTypeId);
  };

  const getLocation = (locationId: string) => {
    return inventoryData?.storageLocations?.find(loc => loc.id === locationId);
  };

  const handleConfirm = () => {
    if (selectedCableId) {
      onConfirm(selectedCableId);
    }
  };

  const cableType = getCableType();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cable className="h-5 w-5" />
            Select Individual {cableType?.name || 'Cable'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Connection Info */}
          {edge && (
            <div className="bg-card p-3 rounded-lg text-sm">
              <p className="font-medium">Connection Details:</p>
              <p className="text-muted-foreground">
                {edge.source} → {edge.target}
              </p>
            </div>
          )}

          {/* Cable Selection */}
          <div className="space-y-2">
            <Label>Available {cableType?.name || 'Cables'}</Label>
            {availableCables.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No {cableType?.name || 'cables'} available. All items are currently deployed to other jobs.
                </AlertDescription>
              </Alert>
            ) : (
              <Select value={selectedCableId} onValueChange={setSelectedCableId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a cable" />
                </SelectTrigger>
                <SelectContent className="bg-card z-50 max-h-[300px]">
                  {availableCables.map(cable => {
                    const location = getLocation(cable.locationId);
                    const isCurrentlyAllocated = cable.id === edge?.data?.equipmentId;
                    
                    return (
                      <SelectItem key={cable.id} value={cable.id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{cable.equipmentId}</span>
                            {cable.name && cable.name !== cable.equipmentId && (
                              <span className="text-muted-foreground">({cable.name})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isCurrentlyAllocated && (
                              <Badge variant="outline" className="text-xs bg-card text-foreground border-border">
                                Current
                              </Badge>
                            )}
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                cable.status === 'available' 
                                  ? 'bg-card text-success border-border' 
                                  : 'bg-card text-warning border-border'
                              }`}
                            >
                              {cable.status === 'available' ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Available
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  In Use (This Job)
                                </>
                              )}
                            </Badge>
                            {location && (
                              <Badge variant="outline" className="text-xs">
                                <MapPin className="w-3 h-3 mr-1" />
                                {location.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {cable.notes && (
                          <div className="text-xs text-muted-foreground mt-1">{cable.notes}</div>
                        )}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
            
            {selectedCableId && (
              <div className="mt-2 p-3 bg-card rounded-lg">
                <p className="text-sm text-foreground">
                  <strong>Selected:</strong> {availableCables.find(c => c.id === selectedCableId)?.equipmentId}
                </p>
                {availableCables.find(c => c.id === selectedCableId)?.serialNumber && (
                  <p className="text-xs text-foreground mt-1">
                    Serial: {availableCables.find(c => c.id === selectedCableId)?.serialNumber}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This cable will be allocated specifically to this connection. 
              It will be marked as deployed for this job.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedCableId}
          >
            Allocate Cable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CableAllocationDialog;