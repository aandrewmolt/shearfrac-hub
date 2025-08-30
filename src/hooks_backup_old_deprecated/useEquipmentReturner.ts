
import { useInventoryData } from '../useInventoryData';
import { useAuditTrail } from '../useAuditTrail';
import { toast } from 'sonner';

export const useEquipmentReturner = (jobId: string) => {
  const { data, updateEquipmentItems } = useInventoryData();
  const { addAuditEntry } = useAuditTrail();

  const returnAllJobEquipment = () => {
    const deployedItems = data.equipmentItems.filter(
      item => item.status === 'deployed' && item.jobId === jobId
    );

    if (deployedItems.length === 0) return;

    const updatedItems = data.equipmentItems.filter(item => 
      !(item.status === 'deployed' && item.jobId === jobId)
    );

    // Return quantities to available items
    deployedItems.forEach(deployedItem => {
      const availableItem = updatedItems.find(
        item => 
          item.typeId === deployedItem.typeId && 
          item.locationId === deployedItem.locationId && 
          item.status === 'available'
      );

      if (availableItem) {
        availableItem.quantity += deployedItem.quantity;
        availableItem.lastUpdated = new Date();
      } else {
        // Create new available item
        updatedItems.push({
          id: `returned-${deployedItem.typeId}-${deployedItem.locationId}-${Date.now()}`,
          typeId: deployedItem.typeId,
          locationId: deployedItem.locationId,
          quantity: deployedItem.quantity,
          status: 'available',
          lastUpdated: new Date(),
        });
      }

      // Create audit entry for equipment return
      addAuditEntry({
        action: 'return',
        entityType: 'equipment',
        entityId: deployedItem.typeId,
        details: {
          quantity: deployedItem.quantity,
          toLocation: deployedItem.locationId,
          jobId,
        },
        metadata: { source: 'manual' },
      });
    });

    updateEquipmentItems(updatedItems);
  };

  const returnEquipmentToLocation = (targetLocationId: string) => {
    const deployedItems = data.equipmentItems.filter(
      item => item.status === 'deployed' && item.jobId === jobId
    );

    if (deployedItems.length === 0) return;

    const updatedItems = data.equipmentItems.filter(item => 
      !(item.status === 'deployed' && item.jobId === jobId)
    );

    // Return equipment to the specified location
    deployedItems.forEach(deployedItem => {
      const availableItem = updatedItems.find(
        item => 
          item.typeId === deployedItem.typeId && 
          item.locationId === targetLocationId && 
          item.status === 'available'
      );

      if (availableItem) {
        availableItem.quantity += deployedItem.quantity;
        availableItem.lastUpdated = new Date();
      } else {
        // Create new available item at target location
        updatedItems.push({
          id: `returned-${deployedItem.typeId}-${targetLocationId}-${Date.now()}`,
          typeId: deployedItem.typeId,
          locationId: targetLocationId,
          quantity: deployedItem.quantity,
          status: 'available',
          lastUpdated: new Date(),
        });
      }

      // Create audit entry for equipment return with location transfer
      addAuditEntry({
        action: 'return',
        entityType: 'equipment',
        entityId: deployedItem.typeId,
        details: {
          quantity: deployedItem.quantity,
          fromLocation: deployedItem.locationId,
          toLocation: targetLocationId,
          jobId,
        },
        metadata: { source: 'manual' },
      });
    });

    updateEquipmentItems(updatedItems);
    
    const locationName = data.storageLocations.find(loc => loc.id === targetLocationId)?.name || 'Unknown';
    toast.success(`Equipment returned to ${locationName}`);
  };

  return {
    returnAllJobEquipment,
    returnEquipmentToLocation,
  };
};
