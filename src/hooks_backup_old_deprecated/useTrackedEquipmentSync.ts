
import { TrackedEquipment } from '@/types/equipment';
import { useInventoryData } from '@/hooks/useInventoryData';
import { useTrackedEquipmentTypes } from './useTrackedEquipmentTypes';
import { useTrackedEquipmentStorage } from './useTrackedEquipmentStorage';

export const useTrackedEquipmentSync = () => {
  const { data: inventoryData } = useInventoryData();
  const { mapToTrackedType } = useTrackedEquipmentTypes();
  const { loadExistingTrackedEquipment } = useTrackedEquipmentStorage();

  // Convert individual equipment to tracked equipment format
  const syncFromInventory = (): TrackedEquipment[] => {
    console.log('Syncing tracked equipment from inventory data');
    console.log('Total individual equipment items:', inventoryData.individualEquipment.length);
    
    // Get relevant individual equipment (only tracked types)
    const relevantEquipment = inventoryData.individualEquipment.filter(eq => {
      const mappedType = mapToTrackedType(eq.typeId);
      return mappedType !== null;
    });

    console.log('Found relevant equipment for tracking:', relevantEquipment.length);

    // Convert to tracked equipment format
    const syncedEquipment: TrackedEquipment[] = relevantEquipment.map(eq => {
      const mappedType = mapToTrackedType(eq.typeId);
      console.log(`Mapping equipment ${eq.equipmentId} (${eq.name}) to type ${mappedType}`);
      return {
        id: eq.id,
        equipmentId: eq.equipmentId,
        type: mappedType!,
        name: eq.name,
        serialNumber: eq.serialNumber,
        status: eq.status === 'maintenance' ? 'maintenance' : 
                eq.status === 'red-tagged' ? 'retired' :
                eq.status === 'retired' ? 'retired' :
                eq.status === 'deployed' ? 'deployed' : 'available',
        currentJobId: eq.jobId,
        lastUpdated: eq.lastUpdated,
      };
    });

    // Load existing tracked equipment from localStorage
    const existingEquipment = loadExistingTrackedEquipment();

    // Merge synced equipment with existing, prioritizing inventory data
    const mergedEquipment = [...syncedEquipment];
    
    // Add any existing tracked equipment that's not in inventory
    existingEquipment.forEach(existing => {
      const foundInSync = syncedEquipment.find(synced => synced.id === existing.id || synced.equipmentId === existing.equipmentId);
      if (!foundInSync) {
        mergedEquipment.push(existing);
      }
    });

    console.log('Final merged equipment count:', mergedEquipment.length);
    console.log('Merged equipment by type:', mergedEquipment.reduce((acc, eq) => {
      acc[eq.type] = (acc[eq.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>));
    
    return mergedEquipment;
  };

  // Force sync with immediate callback
  const forceSyncFromInventory = () => {
    console.log('Force syncing from inventory immediately');
    return syncFromInventory();
  };

  return {
    syncFromInventory,
    forceSyncFromInventory,
  };
};
