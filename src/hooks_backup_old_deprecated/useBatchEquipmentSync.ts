import { useCallback } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { toast } from 'sonner';
import { UpdateIndividualEquipmentInput } from '@/types/types';

interface EquipmentUpdate {
  id: string;
  updates: UpdateIndividualEquipmentInput;
}

interface BulkEquipmentUpdate {
  id: string;
  updates: Partial<{ quantity: number; status: string; notes?: string; }>;
}

export const useBatchEquipmentSync = () => {
  const { data, updateIndividualEquipment, updateSingleEquipmentItem } = useInventory();

  // Batch update individual equipment
  const batchUpdateIndividualEquipment = useCallback(async (updates: EquipmentUpdate[]) => {
    const startTime = performance.now();
    let successCount = 0;
    let failureCount = 0;

    try {
      // Group updates by type for better logging
      const statusUpdates = updates.filter(u => u.updates.status);
      const locationUpdates = updates.filter(u => u.updates.locationId);
      const nameUpdates = updates.filter(u => u.updates.name);

      console.log(`Batch updating ${updates.length} individual equipment items:`, {
        statusUpdates: statusUpdates.length,
        locationUpdates: locationUpdates.length,
        nameUpdates: nameUpdates.length
      });

      // Execute updates in parallel batches of 10 to avoid overwhelming the API
      const batchSize = 10;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async ({ id, updates }) => {
          try {
            await updateIndividualEquipment(id, updates);
            successCount++;
          } catch (error) {
            console.error(`Failed to update equipment ${id}:`, error);
            failureCount++;
          }
        });

        await Promise.all(batchPromises);
      }

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      if (failureCount === 0) {
        toast.success(`Updated ${successCount} equipment items in ${duration}ms`);
      } else {
        toast.warning(`Updated ${successCount} items, ${failureCount} failed (${duration}ms)`);
      }

      return { successCount, failureCount, duration };
    } catch (error) {
      console.error('Batch update failed:', error);
      toast.error('Batch equipment update failed');
      throw error;
    }
  }, [updateIndividualEquipment]);

  // Batch update bulk equipment items
  const batchUpdateBulkEquipment = useCallback(async (updates: BulkEquipmentUpdate[]) => {
    const startTime = performance.now();
    let successCount = 0;
    let failureCount = 0;

    try {
      console.log(`Batch updating ${updates.length} bulk equipment items`);

      // Execute updates in parallel batches
      const batchSize = 10;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async ({ id, updates }) => {
          try {
            await updateSingleEquipmentItem(id, updates);
            successCount++;
          } catch (error) {
            console.error(`Failed to update bulk equipment ${id}:`, error);
            failureCount++;
          }
        });

        await Promise.all(batchPromises);
      }

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      if (failureCount === 0) {
        toast.success(`Updated ${successCount} bulk items in ${duration}ms`);
      } else {
        toast.warning(`Updated ${successCount} bulk items, ${failureCount} failed (${duration}ms)`);
      }

      return { successCount, failureCount, duration };
    } catch (error) {
      console.error('Batch bulk update failed:', error);
      toast.error('Batch bulk equipment update failed');
      throw error;
    }
  }, [updateSingleEquipmentItem]);

  // Batch deploy equipment to a job
  const batchDeployEquipment = useCallback(async (
    equipmentIds: string[], 
    jobId: string
  ) => {
    const updates: EquipmentUpdate[] = [];

    // Find equipment items by user-defined IDs
    equipmentIds.forEach(equipmentId => {
      const equipment = data.individualEquipment.find(
        item => item.equipmentId === equipmentId
      );
      
      if (equipment) {
        updates.push({
          id: equipment.id,
          updates: {
            status: 'deployed',
            jobId: jobId,
            locationId: jobId
          }
        });
      }
    });

    if (updates.length === 0) {
      toast.warning('No equipment found to deploy');
      return { successCount: 0, failureCount: 0, duration: 0 };
    }

    return await batchUpdateIndividualEquipment(updates);
  }, [data.individualEquipment, batchUpdateIndividualEquipment]);

  // Batch return equipment from a job
  const batchReturnEquipment = useCallback(async (
    equipmentIds: string[]
  ) => {
    const defaultLocation = data.storageLocations.find(loc => loc.isDefault);
    if (!defaultLocation) {
      toast.error('No default storage location found');
      return { successCount: 0, failureCount: 0, duration: 0 };
    }

    const updates: EquipmentUpdate[] = [];

    // Find equipment items by user-defined IDs
    equipmentIds.forEach(equipmentId => {
      const equipment = data.individualEquipment.find(
        item => item.equipmentId === equipmentId
      );
      
      if (equipment) {
        updates.push({
          id: equipment.id,
          updates: {
            status: 'available',
            jobId: null,
            locationId: defaultLocation.id
          }
        });
      }
    });

    if (updates.length === 0) {
      toast.warning('No equipment found to return');
      return { successCount: 0, failureCount: 0, duration: 0 };
    }

    return await batchUpdateIndividualEquipment(updates);
  }, [data.individualEquipment, data.storageLocations, batchUpdateIndividualEquipment]);

  // Batch sync inventory status
  const batchSyncInventoryStatus = useCallback(async (
    jobId: string,
    deployedEquipmentIds: string[]
  ) => {
    const updates: EquipmentUpdate[] = [];

    // Check all individual equipment
    data.individualEquipment.forEach(equipment => {
      const shouldBeDeployed = deployedEquipmentIds.includes(equipment.equipmentId);
      const isCurrentlyDeployed = equipment.status === 'deployed' && equipment.jobId === jobId;

      if (shouldBeDeployed && !isCurrentlyDeployed) {
        // Equipment should be deployed but isn't
        updates.push({
          id: equipment.id,
          updates: {
            status: 'deployed',
            jobId: jobId,
            locationId: jobId
          }
        });
      } else if (!shouldBeDeployed && isCurrentlyDeployed) {
        // Equipment shouldn't be deployed but is
        const defaultLocation = data.storageLocations.find(loc => loc.isDefault);
        if (defaultLocation) {
          updates.push({
            id: equipment.id,
            updates: {
              status: 'available',
              jobId: null,
              locationId: defaultLocation.id,
              locationType: 'storage'
            }
          });
        }
      }
    });

    if (updates.length === 0) {
      console.log('All equipment is in sync');
      return { successCount: 0, failureCount: 0, duration: 0 };
    }

    console.log(`Syncing ${updates.length} equipment items for job ${jobId}`);
    return await batchUpdateIndividualEquipment(updates);
  }, [data.individualEquipment, data.storageLocations, batchUpdateIndividualEquipment]);

  return {
    batchUpdateIndividualEquipment,
    batchUpdateBulkEquipment,
    batchDeployEquipment,
    batchReturnEquipment,
    batchSyncInventoryStatus
  };
};