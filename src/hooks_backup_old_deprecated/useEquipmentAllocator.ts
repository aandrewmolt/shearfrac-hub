
import { useInventoryData, EquipmentItem } from '../useInventoryData';
import { useAuditTrail } from '../useAuditTrail';
import { toast } from 'sonner';
import { EquipmentUsage } from './useEquipmentUsageCalculator';

export const useEquipmentAllocator = (jobId: string) => {
  const { data, updateEquipmentItems } = useInventoryData();
  const { addAuditEntry } = useAuditTrail();
  const seenDeployments = new Set<string>();

  const cleanupDuplicateDeployments = (updatedItems: EquipmentItem[]) => {
    const cleanedItems = updatedItems.filter(item => {
      if (item.status === 'deployed' && item.jobId === jobId) {
        const deploymentKey = `${item.typeId}-${item.jobId}`;
        if (seenDeployments.has(deploymentKey)) {
          return false; // Remove duplicate
        }
        seenDeployments.add(deploymentKey);
      }
      return true;
    });
    
    const removedCount = updatedItems.length - cleanedItems.length;
    if (removedCount > 0) {
      // Log cleanup action
    }
    return cleanedItems;
  };

  const allocateOrUpdateEquipment = (
    updatedItems: EquipmentItem[], 
    typeId: string, 
    quantity: number, 
    locationId: string
  ): { allocated: number; updated: boolean } => {
    // Find existing deployment for this equipment type and job
    const existingDeployment = updatedItems.find(
      item => item.typeId === typeId && item.status === 'deployed' && item.jobId === jobId
    );
    
    if (existingDeployment) {
      const quantityDiff = quantity - existingDeployment.quantity;
        
      // Find available equipment at the location
      const availableItem = updatedItems.find(
        item => item.typeId === typeId && item.locationId === locationId && item.status === 'available'
      );
        
      if (quantityDiff > 0) {
          // Need more equipment
          if (availableItem && availableItem.quantity >= quantityDiff) {
            availableItem.quantity -= quantityDiff;
            availableItem.lastUpdated = new Date();
            existingDeployment.quantity = quantity;
            existingDeployment.lastUpdated = new Date();
            
            return { allocated: existingDeployment.quantity, updated: false };
          }
        } else {
          // Returning equipment
          const returnQuantity = Math.abs(quantityDiff);
          
          if (availableItem) {
            availableItem.quantity += returnQuantity;
            availableItem.lastUpdated = new Date();
          } else {
            // Create new available item
            updatedItems.push({
              id: `available-${typeId}-${locationId}-${Date.now()}`,
              typeId,
              locationId,
              quantity: returnQuantity,
              status: 'available',
              lastUpdated: new Date(),
            });
          }
          
          existingDeployment.quantity = quantity;
          existingDeployment.lastUpdated = new Date();
          
        return { allocated: quantity, updated: false };
      }
    }

    // No existing deployment - create new one
    const availableItem = updatedItems.find(
      item => item.typeId === typeId && item.locationId === locationId && item.status === 'available'
    );

    if (availableItem && availableItem.quantity >= quantity) {
      availableItem.quantity -= quantity;
      availableItem.lastUpdated = new Date();
      
      // Use consistent ID without timestamp
      updatedItems.push({
        id: `deployed-${typeId}-${jobId}`,
        typeId,
        locationId,
        quantity,
        status: 'deployed',
        jobId,
        lastUpdated: new Date(),
      });

      return { allocated: quantity, updated: true };
    }
    
    return { allocated: 0, updated: false };
  };

  const performEquipmentAllocation = (
    locationId: string,
    usage: EquipmentUsage,
    updatedItems: EquipmentItem[]
  ): Array<{ typeId: string; quantity: number; typeName: string; updated: boolean }> => {
    const cleanedItems = cleanupDuplicateDeployments([...data.equipmentItems]);
    updatedItems.length = 0;
    updatedItems.push(...cleanedItems);

    const allocatedItems: Array<{ typeId: string; quantity: number; typeName: string; updated: boolean }> = [];

    // Type mapping for allocation
    const typeMapping: { [key: string]: string } = {
      '100ft': '100ft-cable',
      '200ft': '200ft-cable',
      '300ft': '300ft-cable-new',
    };

    // Allocate cables
    Object.entries(usage.cables).forEach(([cableType, quantity]) => {
      const typeId = typeMapping[cableType];
      if (typeId && quantity > 0) {
        const result = allocateOrUpdateEquipment(updatedItems, typeId, quantity, locationId);
        if (result.allocated > 0) {
          allocatedItems.push({
            typeId,
            quantity: result.allocated,
            typeName: data.equipmentTypes.find(t => t.id === typeId)?.name || 'Unknown',
            updated: result.updated,
          });
        }
      }
    });

    // Allocate other equipment
    const allocations = [
      { typeId: 'pressure-gauge-1502', quantity: usage.gauges, name: '1502 Pressure Gauge' },
      { typeId: 'y-adapter', quantity: usage.adapters, name: 'Y Adapter' },
      { typeId: 'customer-computer', quantity: usage.computers, name: 'Customer Computer' },
      { typeId: 'starlink', quantity: usage.satellite, name: 'Starlink' },
    ];

    allocations.forEach(({ typeId, quantity, name }) => {
      if (quantity > 0) {
        const result = allocateOrUpdateEquipment(updatedItems, typeId, quantity, locationId);
        if (result.allocated > 0) {
          allocatedItems.push({
            typeId,
            quantity: result.allocated,
            typeName: name,
            updated: result.updated,
          });
        }
      }
    });

    return allocatedItems;
  };

  const createAuditEntries = (allocatedItems: Array<{ typeId: string; quantity: number; typeName: string; updated: boolean }>) => {
    allocatedItems.forEach(item => {
      addAuditEntry({
        action: item.updated ? 'update' : 'allocate',
        details: `${item.typeName}: ${item.quantity}`,
        timestamp: new Date()
      });
    });
  };

  return {
    allocateOrUpdateEquipment,
    performEquipmentAllocation,
    createAuditEntries,
    cleanupDuplicateDeployments,
  };
};
