import React, { useState, useCallback } from 'react';
import { 
  AlertTriangle, MoreVertical, Wrench, CheckCircle, XCircle, Package, RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from '@/components/ui/popover';
import { useInventory } from '@/contexts/InventoryContext';
import { tursoDb } from '@/services/tursoDb';
import { toast } from '@/hooks/use-toast';
import { EquipmentRemovalDialog } from '@/components/equipment/EquipmentRemovalDialog';
import { QuickEquipmentReplace } from '@/components/equipment/QuickEquipmentReplace';
import { useEquipmentUsageTracking } from '@/hooks/equipment/useEquipmentUsageTracking';
import { useReactFlow } from '@xyflow/react';

interface SimpleRedTagMenuProps {
  equipmentId: string;
  nodeId: string;
  nodeType?: string;
  jobId?: string;
  jobName?: string;
  onRemoveEquipment?: () => void;
}

export const SimpleRedTagMenu: React.FC<SimpleRedTagMenuProps> = ({ 
  equipmentId,
  nodeId,
  nodeType = 'Node',
  jobId,
  jobName = 'Job',
  onRemoveEquipment
}) => {
  const { data: inventoryData, refreshData } = useInventory();
  const { createRedTagEvent, endUsageSession } = useEquipmentUsageTracking();
  const { setNodes } = useReactFlow();
  const [open, setOpen] = useState(false);
  const [showRemovalDialog, setShowRemovalDialog] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  
  const equipment = inventoryData.individualEquipment.find(
    eq => eq.equipmentId === equipmentId
  );
  
  
  // If equipment not found in inventory, still show menu for removal
  // This handles cases where equipment IDs are assigned but not in database
  const fallbackEquipment = equipment || {
    id: `temp-${equipmentId}`,
    equipmentId: equipmentId,
    name: equipmentId,
    status: 'unknown' as const
  };
  
  const isRedTagged = fallbackEquipment.status === 'red-tagged';
  const isMaintenance = fallbackEquipment.status === 'maintenance';

  const handleRemove = () => {
    setOpen(false);
    setShowRemovalDialog(true);
  };

  const handleRemovalConfirm = async (
    action: 'return' | 'redtag',
    reason?: string,
    severity?: 'low' | 'medium' | 'high' | 'critical'
  ) => {
    setShowRemovalDialog(false);
    
    // Only process database operations if equipment exists in inventory
    if (!equipment) {
      // Just call the removal callback to update the UI
      if (onRemoveEquipment) {
        onRemoveEquipment();
      }
      toast({
        title: "Equipment Removed",
        description: `${equipmentId} removed from ${nodeType}`,
      });
      return;
    }

    try {
      // End usage session if job ID is available
      if (jobId) {
        await endUsageSession(
          equipment.id,
          new Date(),
          action === 'redtag' ? `Red tagged: ${reason}` : 'Returned to storage'
        );
      }

      if (action === 'redtag') {
        // Create red tag event
        await createRedTagEvent(equipment.id, reason || 'Equipment failure', severity || 'medium');
        
        // Update equipment status
        await tursoDb.updateIndividualEquipment(equipment.id, {
          status: 'red-tagged',
          jobId: null,
          notes: `Red tagged: ${reason} (${severity} severity)`
        });

        toast({
          title: "Equipment Red Tagged",
          description: `${equipment.equipmentId} removed from job`,
          variant: "destructive"
        });
      } else {
        // Return to storage
        await tursoDb.updateIndividualEquipment(equipment.id, {
          status: 'available',
          jobId: null,
          notes: `Returned from ${jobName}`
        });

        toast({
          title: "Equipment Returned",
          description: `${equipment.equipmentId} returned to storage`,
        });
      }

      // Call the removal callback if provided
      if (onRemoveEquipment) {
        onRemoveEquipment();
      }

      await refreshData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process equipment removal",
        variant: "destructive"
      });
    }
  };

  const handleRedTag = async () => {
    if (!equipment) {
      toast({
        title: "Cannot Red Tag",
        description: "Equipment not found in inventory",
        variant: "destructive"
      });
      setOpen(false);
      return;
    }
    
    try {
      // Update equipment status
      await tursoDb.updateIndividualEquipment(equipment.id, {
        status: 'red-tagged',
        jobId: null,
        notes: 'Red tagged from job diagram'
      });

      // Call the removal callback if provided
      if (onRemoveEquipment) {
        onRemoveEquipment();
      }

      await refreshData();
      
      toast({
        title: "Equipment Red Tagged",
        description: `${equipment.equipmentId} removed from job`,
        variant: "destructive"
      });

      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to red tag equipment",
        variant: "destructive"
      });
    }
  };

  const handleClearStatus = async () => {
    if (!equipment) {
      toast({
        title: "Cannot Clear Status",
        description: "Equipment not found in inventory",
        variant: "destructive"
      });
      setOpen(false);
      return;
    }
    
    try {
      await tursoDb.updateIndividualEquipment(equipment.id, {
        status: 'available',
        notes: 'Status cleared'
      });

      await refreshData();
      
      toast({
        title: "Status Cleared",
        description: `${equipment.equipmentId} is now available`,
      });

      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear status",
        variant: "destructive"
      });
    }
  };

  const handleSwap = () => {
    setOpen(false);
    setShowReplaceDialog(true);
  };

  const handleReplaced = (newEquipmentId: string, newEquipmentName: string) => {
    // Update the node with the new equipment
    setNodes((nodes) => 
      nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              equipmentId: newEquipmentId,
              equipmentName: newEquipmentName,
              assigned: true
            }
          };
        }
        return node;
      })
    );
    setShowReplaceDialog(false);
  };

  return (
    <div 
      className="absolute top-1 right-1"
      style={{ zIndex: 9999 }}
      onClick={(e) => e.stopPropagation()}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 bg-black/60 hover:bg-black/80 rounded"
          >
            <MoreVertical className="h-4 w-4 text-white" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" align="end">
          {/* Swap option - show if equipment exists and we have type info */}
          {equipment && equipment.typeId && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={handleSwap}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Swap Equipment
            </Button>
          )}
          
          {/* Always show remove option */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={handleRemove}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Remove Equipment
          </Button>
          
          {/* Only show other options if equipment exists in inventory */}
          {equipment && !isRedTagged && !isMaintenance && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-destructive"
                onClick={handleRedTag}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Quick Red Tag
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={async () => {
                  if (!equipment) {
                    toast({
                      title: "Cannot Set Maintenance",
                      description: "Equipment not found in inventory",
                      variant: "destructive"
                    });
                    setOpen(false);
                    return;
                  }
                  await tursoDb.updateIndividualEquipment(equipment.id, {
                    status: 'maintenance',
                    notes: 'Maintenance required'
                  });
                  await refreshData();
                  toast({
                    title: "Marked for Maintenance",
                    description: equipment.equipmentId,
                  });
                  setOpen(false);
                }}
              >
                <Wrench className="mr-2 h-4 w-4" />
                Maintenance
              </Button>
            </>
          )}
          
          {equipment && (isRedTagged || isMaintenance) && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-foreground"
              onClick={handleClearStatus}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Clear Status
            </Button>
          )}
        </PopoverContent>
      </Popover>
      
      <EquipmentRemovalDialog
        open={showRemovalDialog}
        onOpenChange={setShowRemovalDialog}
        equipmentId={fallbackEquipment.equipmentId}
        equipmentName={fallbackEquipment.name || fallbackEquipment.equipmentId}
        nodeType={nodeType}
        onConfirm={handleRemovalConfirm}
      />
      
      {equipment && equipment.typeId && jobId && (
        <QuickEquipmentReplace
          open={showReplaceDialog}
          onOpenChange={setShowReplaceDialog}
          nodeId={nodeId}
          nodeType={nodeType}
          equipmentTypeId={equipment.typeId}
          jobId={jobId}
          jobName={jobName}
          onReplaced={handleReplaced}
        />
      )}
    </div>
  );
};