import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { RefreshCw, Package, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useInventory } from '@/contexts/InventoryContext';
import { tursoDb } from '@/services/tursoDb';
import { toast } from '@/hooks/use-toast';
import { useEquipmentUsageTracking } from '@/hooks/equipment/useEquipmentUsageTracking';

interface QuickEquipmentReplaceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string;
  nodeType: string;
  equipmentTypeId: string;
  jobId: string;
  jobName: string;
  onReplaced: (newEquipmentId: string, newEquipmentName: string) => void;
}

export const QuickEquipmentReplace: React.FC<QuickEquipmentReplaceProps> = ({
  open,
  onOpenChange,
  nodeId,
  nodeType,
  equipmentTypeId,
  jobId,
  jobName,
  onReplaced
}) => {
  const { data: inventoryData, refreshData } = useInventory();
  const { startUsageSession } = useEquipmentUsageTracking();
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Find available equipment of the same type
  const availableEquipment = inventoryData.individualEquipment.filter(
    eq => eq.typeId === equipmentTypeId && eq.status === 'available'
  );

  // Get equipment type details
  const equipmentType = inventoryData.equipmentTypes.find(t => t.id === equipmentTypeId);

  const handleReplace = async () => {
    if (!selectedEquipment) {
      toast({
        title: "Error",
        description: "Please select replacement equipment",
        variant: "destructive"
      });
      return;
    }

    const equipment = inventoryData.individualEquipment.find(eq => eq.id === selectedEquipment);
    if (!equipment) return;

    setIsProcessing(true);
    try {
      // Update equipment status to deployed
      await tursoDb.updateIndividualEquipment(equipment.id, {
        status: 'deployed',
        jobId: jobId,
        notes: `Deployed to ${jobName} as replacement`
      });

      // Start usage tracking
      await startUsageSession(equipment.id, jobId);

      // Refresh inventory
      await refreshData();

      // Notify parent
      onReplaced(equipment.equipmentId, equipment.name);

      toast({
        title: "Equipment Replaced",
        description: `${equipment.equipmentId} has been assigned as replacement`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Failed to replace equipment:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Quick Equipment Replacement
          </DialogTitle>
          <DialogDescription>
            Select replacement {equipmentType?.name} for {nodeType} on {jobName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {availableEquipment.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
              <p className="text-lg font-medium">No Available Equipment</p>
              <p className="text-sm text-muted-foreground mt-1">
                No {equipmentType?.name} units are currently available for replacement
              </p>
            </div>
          ) : (
            <>
              <div>
                <Label>Available {equipmentType?.name} Units ({availableEquipment.length})</Label>
                <ScrollArea className="h-[300px] mt-2">
                  <RadioGroup value={selectedEquipment} onValueChange={setSelectedEquipment}>
                    <div className="space-y-2">
                      {availableEquipment.map(eq => {
                        const location = inventoryData.storageLocations.find(l => l.id === eq.locationId);
                        return (
                          <Card
                            key={eq.id}
                            className={`flex items-center space-x-3 p-3 hover:bg-muted cursor-pointer ${
                              selectedEquipment === eq.id ? 'border-blue-500 bg-muted' : ''
                            }`}
                            onClick={() => setSelectedEquipment(eq.id)}
                          >
                            <RadioGroupItem value={eq.id} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{eq.equipmentId}</span>
                                <Badge variant="outline" className="text-xs">
                                  {eq.name}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  {location?.name || 'Unknown Location'}
                                </span>
                              </div>
                              {eq.serialNumber && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Serial: {eq.serialNumber}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <Badge variant="default" className="bg-muted0">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Available
                              </Badge>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </RadioGroup>
                </ScrollArea>
              </div>

              {selectedEquipment && (
                <Alert className="bg-muted border-border">
                  <AlertDescription>
                    <p className="text-sm font-medium mb-1">Replacement Summary</p>
                    <p className="text-xs">
                      Equipment will be deployed to {jobName} and usage tracking will begin
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          {availableEquipment.length > 0 && (
            <Button
              onClick={handleReplace}
              disabled={!selectedEquipment || isProcessing}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isProcessing ? 'Replacing...' : 'Assign Replacement'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};