import { useCallback, useEffect } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { useUnifiedEquipmentSync } from './useUnifiedEquipmentSync';
import { ExtrasOnLocationItem } from './useExtrasOnLocation';
import { toast } from 'sonner';

export const useExtrasEquipmentSync = (jobId: string) => {
  const { data, updateIndividualEquipment, updateSingleEquipmentItem } = useInventory();
  const { allocateEquipment, releaseEquipment, validateEquipmentAvailability } = useUnifiedEquipmentSync();

  // Deploy extra equipment to job
  const deployExtraEquipment = useCallback(async (extra: ExtrasOnLocationItem) => {
    try {
      // Handle individual equipment
      if (extra.individualEquipmentId) {
        const equipment = data.individualEquipment.find(
          item => item.equipmentId === extra.individualEquipmentId
        );
        
        if (!equipment) {
          throw new Error(`Equipment ${extra.individualEquipmentId} not found`);
        }

        // Validate availability
        const isAvailable = await validateEquipmentAvailability(equipment.equipmentId, jobId);
        if (!isAvailable) {
          return false;
        }

        // Update equipment status
        await updateIndividualEquipment(equipment.id, {
          status: 'deployed',
          jobId: jobId,
          locationId: jobId
        });

        // Allocate in sync system
        await allocateEquipment(equipment.equipmentId, jobId, `Job ${jobId}`);
        
        console.log(`Deployed extra individual equipment ${equipment.name} to job`);
        return true;
      }
      
      // Handle bulk equipment
      else {
        const equipmentItem = data.equipmentItems.find(
          item => item.typeId === extra.equipmentTypeId && 
                 item.status === 'available' &&
                 item.quantity >= extra.quantity
        );

        if (!equipmentItem) {
          toast.error('Insufficient equipment available');
          return false;
        }

        // Update bulk equipment quantity
        if (equipmentItem.quantity === extra.quantity) {
          // Deploy entire item
          await updateSingleEquipmentItem(equipmentItem.id, {
            status: 'deployed',
            jobId: jobId
          });
        } else {
          // Split quantity
          await updateSingleEquipmentItem(equipmentItem.id, {
            quantity: equipmentItem.quantity - extra.quantity
          });
          
          // Create new deployed item
          await data.addEquipmentItem({
            typeId: extra.equipmentTypeId,
            locationId: jobId,
            quantity: extra.quantity,
            status: 'deployed',
            jobId: jobId
          });
        }

        console.log(`Deployed ${extra.quantity} extra bulk equipment to job`);
        return true;
      }
    } catch (error) {
      console.error('Failed to deploy extra equipment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Deployment error details:', errorMessage);
      toast.error(`Failed to deploy extra equipment: ${errorMessage}`);
      return false;
    }
  }, [data, updateIndividualEquipment, updateSingleEquipmentItem, validateEquipmentAvailability, allocateEquipment, jobId]);

  // Return extra equipment from job
  const returnExtraEquipment = useCallback(async (extra: ExtrasOnLocationItem) => {
    try {
      // Handle individual equipment
      if (extra.individualEquipmentId) {
        const equipment = data.individualEquipment.find(
          item => item.equipmentId === extra.individualEquipmentId
        );
        
        if (!equipment) {
          throw new Error(`Equipment ${extra.individualEquipmentId} not found`);
        }

        // Find default location
        const defaultLocation = data.storageLocations.find(loc => loc.isDefault);
        if (!defaultLocation) {
          throw new Error('No default storage location found');
        }

        // Update equipment status
        await updateIndividualEquipment(equipment.id, {
          status: 'available',
          jobId: null,
          locationId: defaultLocation.id
        });

        // Release from sync system
        await releaseEquipment(equipment.equipmentId, jobId);
        
        console.log(`Returned extra individual equipment ${equipment.name} to inventory`);
        return true;
      }
      
      // Handle bulk equipment
      else {
        // Find deployed item for this job
        const deployedItem = data.equipmentItems.find(
          item => item.typeId === extra.equipmentTypeId && 
                 item.jobId === jobId &&
                 item.status === 'deployed'
        );

        if (!deployedItem) {
          console.warn('Deployed equipment item not found');
          return false;
        }

        // Find default location
        const defaultLocation = data.storageLocations.find(loc => loc.isDefault);
        if (!defaultLocation) {
          throw new Error('No default storage location found');
        }

        // Check for existing available item to merge with
        const availableItem = data.equipmentItems.find(
          item => item.typeId === extra.equipmentTypeId && 
                 item.locationId === defaultLocation.id &&
                 item.status === 'available'
        );

        if (availableItem) {
          // Merge with existing available item
          await updateSingleEquipmentItem(availableItem.id, {
            quantity: availableItem.quantity + extra.quantity
          });
          
          // Update deployed item quantity or remove if depleted
          if (deployedItem.quantity === extra.quantity) {
            await data.deleteEquipmentItem(deployedItem.id);
          } else {
            await updateSingleEquipmentItem(deployedItem.id, {
              quantity: deployedItem.quantity - extra.quantity
            });
          }
        } else {
          // Update deployed item to available
          if (deployedItem.quantity === extra.quantity) {
            await updateSingleEquipmentItem(deployedItem.id, {
              status: 'available',
              jobId: null,
              locationId: defaultLocation.id
            });
          } else {
            // Split quantity
            await updateSingleEquipmentItem(deployedItem.id, {
              quantity: deployedItem.quantity - extra.quantity
            });
            
            // Create new available item
            await data.addEquipmentItem({
              typeId: extra.equipmentTypeId,
              locationId: defaultLocation.id,
              quantity: extra.quantity,
              status: 'available'
            });
          }
        }

        console.log(`Returned ${extra.quantity} extra bulk equipment to inventory`);
        return true;
      }
    } catch (error) {
      console.error('Failed to return extra equipment:', error);
      toast.error('Failed to return extra equipment');
      return false;
    }
  }, [data, updateIndividualEquipment, updateSingleEquipmentItem, releaseEquipment, jobId]);

  // Sync all extras on job completion or update
  const syncAllExtras = useCallback(async (extras: ExtrasOnLocationItem[]) => {
    const deployPromises = extras.map(extra => deployExtraEquipment(extra));
    const results = await Promise.all(deployPromises);
    
    const successCount = results.filter(r => r).length;
    if (successCount === extras.length) {
      toast.success('All extra equipment synced');
    } else if (successCount > 0) {
      toast.warning(`${successCount} of ${extras.length} extras synced`);
    } else {
      toast.error('Failed to sync extra equipment');
    }
    
    return results;
  }, [deployExtraEquipment]);

  return {
    deployExtraEquipment,
    returnExtraEquipment,
    syncAllExtras
  };
};