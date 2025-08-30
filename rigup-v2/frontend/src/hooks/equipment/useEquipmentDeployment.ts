
import { useCallback } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { useUnifiedEquipmentSync } from '@/hooks/useUnifiedEquipmentSync';
import { useEquipmentUsageTracking } from './useEquipmentUsageTracking';
import { toast } from 'sonner';

export const useEquipmentDeployment = (jobId?: string) => {
  const { data, updateIndividualEquipment } = useInventory();
  // Always call the hook but with a fallback jobId
  const syncHook = useUnifiedEquipmentSync({ jobId: jobId || 'no-job' });
  const { startUsageSession, endUsageSession } = useEquipmentUsageTracking();

  const deployEquipment = useCallback(async (equipmentId: string, jobId: string) => {
    try {
      // Find equipment by equipmentId (user-defined ID)
      const equipment = data.individualEquipment.find(item => item.equipmentId === equipmentId);
      if (!equipment) {
        throw new Error(`Equipment with ID ${equipmentId} not found`);
      }

      // Validate equipment availability before deployment if we have a real job
      if (jobId && jobId !== 'no-job' && syncHook?.validateEquipmentAvailability) {
        const isAvailable = await syncHook.validateEquipmentAvailability(equipmentId, jobId);
        if (!isAvailable) {
          // Validation already shows appropriate error messages
          return;
        }
      }

      await updateIndividualEquipment(equipment.id, { 
        status: 'deployed',
        jobId: jobId,
        locationId: jobId // Use job ID as location when deployed
      });
      
      // Automatically start usage tracking when equipment is deployed
      await startUsageSession(equipmentId, jobId);
      
      toast.success(`Equipment ${equipment.name} deployed to job`);
    } catch (error) {
      console.error('Failed to deploy equipment:', error);
      toast.error('Failed to deploy equipment');
    }
  }, [updateIndividualEquipment, data.individualEquipment, syncHook, startUsageSession]);

  const returnEquipment = useCallback(async (equipmentId: string) => {
    try {
      // Find equipment by equipmentId (user-defined ID)
      const equipment = data.individualEquipment.find(item => item.equipmentId === equipmentId);
      if (!equipment) {
        throw new Error(`Equipment with ID ${equipmentId} not found`);
      }

      // Automatically end usage tracking when equipment is returned
      if (equipment.jobId) {
        await endUsageSession(equipmentId, equipment.jobId);
      }

      // Find the default storage location
      const defaultLocation = data.storageLocations.find(loc => loc.isDefault);
      if (!defaultLocation) {
        throw new Error('No default storage location found');
      }

      await updateIndividualEquipment(equipment.id, { 
        status: 'available',
        jobId: null,
        locationId: defaultLocation.id
      });
      toast.success(`Equipment returned to inventory`);
    } catch (error) {
      console.error('Failed to return equipment:', error);
      toast.error('Failed to return equipment');
    }
  }, [updateIndividualEquipment, data.storageLocations, data.individualEquipment, endUsageSession]);

  return {
    deployEquipment,
    returnEquipment,
  };
};
