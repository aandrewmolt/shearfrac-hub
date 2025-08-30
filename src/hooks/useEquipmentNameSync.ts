import { useCallback, useEffect } from 'react';
import { useAwsInventory as useInventory } from '@/hooks/useAwsInventory';
import { toast } from 'sonner';

interface EquipmentNameUpdate {
  equipmentId: string;
  customName: string;
}

export const useEquipmentNameSync = () => {
  const { data, updateIndividualEquipment } = useInventory();

  // Update equipment name in inventory
  const updateEquipmentName = useCallback(async (equipmentId: string, customName: string) => {
    try {
      // Find equipment by equipmentId (user-defined ID)
      const equipment = data.individualEquipment.find(item => item.equipmentId === equipmentId);
      if (!equipment) {
        // This is not a critical error - equipment might have been deleted or not yet created
        return;
      }

      // Only update if name is different
      if (equipment.name !== customName) {
        await updateIndividualEquipment(equipment.id, { 
          name: customName 
        });
        console.log(`Updated equipment ${equipmentId} name to: ${customName}`);
      }
    } catch (error) {
      console.error('Failed to update equipment name:', error);
      toast.error('Failed to sync equipment name');
    }
  }, [data.individualEquipment, updateIndividualEquipment]);

  // Batch update multiple equipment names
  const batchUpdateEquipmentNames = useCallback(async (updates: EquipmentNameUpdate[]) => {
    const updatePromises = updates.map(({ equipmentId, customName }) => 
      updateEquipmentName(equipmentId, customName)
    );
    
    try {
      await Promise.all(updatePromises);
      toast.success('Equipment names synced');
    } catch (error) {
      console.error('Failed to batch update equipment names:', error);
      toast.error('Failed to sync some equipment names');
    }
  }, [updateEquipmentName]);

  // Sync custom names from job diagram to inventory
  const syncJobEquipmentNames = useCallback(async (
    selectedEquipment: {
      shearstreamBoxIds: string[];
      starlinkId?: string;
      customerComputerIds: string[];
    },
    customNames: {
      mainBoxName?: string;
      satelliteName?: string;
      customerComputerNames?: Record<string, string>;
    }
  ) => {
    const updates: EquipmentNameUpdate[] = [];

    // Sync ShearStream box names
    if (customNames.mainBoxName && selectedEquipment.shearstreamBoxIds.length > 0) {
      selectedEquipment.shearstreamBoxIds.forEach(id => {
        if (id) {
          updates.push({ equipmentId: id, customName: customNames.mainBoxName });
        }
      });
    }

    // Sync Starlink name
    if (customNames.satelliteName && selectedEquipment.starlinkId) {
      updates.push({ 
        equipmentId: selectedEquipment.starlinkId, 
        customName: customNames.satelliteName 
      });
    }

    // Sync Customer Computer names
    if (customNames.customerComputerNames) {
      selectedEquipment.customerComputerIds.forEach(id => {
        if (id && customNames.customerComputerNames[id]) {
          updates.push({ 
            equipmentId: id, 
            customName: customNames.customerComputerNames[id] 
          });
        }
      });
    }

    if (updates.length > 0) {
      await batchUpdateEquipmentNames(updates);
    }
  }, [batchUpdateEquipmentNames]);

  return {
    updateEquipmentName,
    batchUpdateEquipmentNames,
    syncJobEquipmentNames
  };
};