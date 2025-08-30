import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Square, Zap, Monitor, Satellite, AlertTriangle, CheckCircle, MapPin, Calendar } from 'lucide-react';
import { useAwsInventory as useInventory } from '@/hooks/useAwsInventory';
import { Node } from '@xyflow/react';

interface NodeEquipmentAllocationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (equipmentId: string) => void;
  node: Node | null;
  jobId: string;
}

const NodeEquipmentAllocationDialog: React.FC<NodeEquipmentAllocationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  node,
  jobId
}) => {
  const { data: inventoryData } = useInventory();
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [availableEquipment, setAvailableEquipment] = useState<Array<{
    id: string;
    equipmentId: string;
    name: string;
    locationId: string;
    status: string;
    typeId: string;
  }>>([]);

  const getNodeEquipmentType = (nodeType: string, nodeData?: { gaugeType?: string }) => {
    switch (nodeType) {
      case 'mainBox': return 'shearstream-box';
      case 'yAdapter': return 'y-adapter';
      case 'customerComputer': return 'customer-computer';
      case 'companyComputer': return 'customer-computer';
      case 'satellite': return 'starlink';
      case 'well':
        // For wells, check the selected gauge type
        if (nodeData?.gaugeType) {
          // Return the selected gauge type
          return nodeData.gaugeType;
        }
        return 'pressure-gauge-1502'; // Default to 1502
      case 'wellsideGauge': return 'pressure-gauge-1502';
      default: return null;
    }
  };

  const getNodeIcon = (nodeType: string) => {
    switch (nodeType) {
      case 'mainBox': return <Square className="h-5 w-5" />;
      case 'yAdapter': return <Zap className="h-5 w-5" />;
      case 'customerComputer': return <Monitor className="h-5 w-5" />;
      case 'companyComputer': return <Monitor className="h-5 w-5" />;
      case 'satellite': return <Satellite className="h-5 w-5" />;
      case 'well': return <Monitor className="h-5 w-5" />;
      case 'wellsideGauge': return <Monitor className="h-5 w-5" />;
      default: return null;
    }
  };

  useEffect(() => {
    if (isOpen && node) {
      const equipmentTypeId = getNodeEquipmentType(node.type || '', node.data);
      if (equipmentTypeId) {
        // Get all individual equipment of the specified type
        // Check multiple fields for type matching (typeId, equipmentTypeId, Type)
        const equipment = inventoryData.individualEquipment.filter(item => {
          // Type matching - check all possible type fields
          const typeMatch = item.typeId === equipmentTypeId || 
                          item.equipmentTypeId === equipmentTypeId ||
                          item.Type === equipmentTypeId;
          
          // For wells with gauge type, check selected type
          if (node.type === 'well' && node.data?.gaugeType) {
            const matchesGaugeType = 
              item.typeId === node.data.gaugeType || 
              item.equipmentTypeId === node.data.gaugeType ||
              item.Type === node.data.gaugeType;
            if (!matchesGaugeType) return false;
          }
          
          // Status check
          const statusMatch = item.status === 'available' || 
                            (item.status === 'deployed' && item.jobId === jobId);
          
          return typeMatch && statusMatch;
        });
        
        // Sort by equipment ID
        equipment.sort((a, b) => a.equipmentId.localeCompare(b.equipmentId));
        
        setAvailableEquipment(equipment);
        
        // If node already has allocated equipment, pre-select it
        if (node.data?.equipmentId) {
          setSelectedEquipmentId(node.data.equipmentId);
        }
      }
    }
  }, [isOpen, node, inventoryData, jobId]);

  const getEquipmentType = () => {
    if (!node) return null;
    const typeId = getNodeEquipmentType(node.type || '', node.data);
    return inventoryData.equipmentTypes.find(type => type.id === typeId);
  };

  const getLocation = (locationId: string) => {
    return inventoryData.storageLocations.find(loc => loc.id === locationId);
  };

  const handleConfirm = () => {
    if (selectedEquipmentId) {
      onConfirm(selectedEquipmentId);
    }
  };

  const equipmentType = getEquipmentType();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {node && getNodeIcon(node.type || '')}
            Select {equipmentType?.name || 'Equipment'} for {node?.data?.label || 'Node'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Node Info */}
          {node && (
            <div className="bg-card p-3 rounded-lg text-sm">
              <p className="font-medium">Node Details:</p>
              <p className="text-muted-foreground">
                Type: {equipmentType?.name || node.type}
              </p>
              <p className="text-muted-foreground">
                Label: {node.data?.label || 'Unnamed'}
              </p>
            </div>
          )}

          {/* Show gauge type selection for wells */}
          {node?.type === 'well' && node.data?.gaugeType && (
            <div className="bg-card p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">Selected Gauge Type:</p>
              <div className="flex flex-wrap gap-1">
                {(() => {
                  const type = inventoryData.equipmentTypes.find(t => t.id === node.data.gaugeType);
                  return (
                    <Badge variant="outline" className="text-xs">
                      {type?.name || node.data.gaugeType}
                    </Badge>
                  );
                })()}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Equipment will be allocated for this gauge type.
              </p>
            </div>
          )}

          {/* Equipment Selection */}
          <div className="space-y-2">
            <Label>Available {equipmentType?.name || 'Equipment'}</Label>
            {availableEquipment.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No {equipmentType?.name || 'equipment'} available. All items are currently deployed to other jobs.
                </AlertDescription>
              </Alert>
            ) : (
              <Select value={selectedEquipmentId} onValueChange={setSelectedEquipmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent className="bg-card z-50 max-h-[300px]">
                  {availableEquipment.map(equipment => {
                    const location = getLocation(equipment.locationId);
                    const isCurrentlyAllocated = equipment.id === node?.data?.equipmentId;
                    
                    return (
                      <SelectItem key={equipment.id} value={equipment.id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{equipment.equipmentId}</span>
                            {equipment.name && equipment.name !== equipment.equipmentId && (
                              <span className="text-muted-foreground">({equipment.name})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isCurrentlyAllocated && (
                              <Badge variant="secondary" className="text-xs">
                                Current
                              </Badge>
                            )}
                            <Badge 
                              variant={equipment.status === 'available' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {equipment.status === 'available' ? (
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
                        {equipment.notes && (
                          <div className="text-xs text-muted-foreground mt-1">{equipment.notes}</div>
                        )}
                        {equipment.serialNumber && (
                          <div className="text-xs text-muted-foreground">Serial: {equipment.serialNumber}</div>
                        )}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
            
            {selectedEquipmentId && (
              <div className="mt-2 p-3 bg-card rounded-lg">
                <p className="text-sm text-foreground">
                  <strong>Selected:</strong> {availableEquipment.find(e => e.id === selectedEquipmentId)?.equipmentId}
                </p>
                {availableEquipment.find(e => e.id === selectedEquipmentId)?.serialNumber && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Serial: {availableEquipment.find(e => e.id === selectedEquipmentId)?.serialNumber}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This equipment will be allocated specifically to this node. 
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
            disabled={!selectedEquipmentId}
          >
            Allocate Equipment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NodeEquipmentAllocationDialog;