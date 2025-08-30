import { useCallback } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { useEquipmentUsageTracking } from './useEquipmentUsageTracking';

export const useJobEquipmentTracking = () => {
  const { data } = useInventory();
  const { endUsageSession } = useEquipmentUsageTracking();

  const endAllJobUsageSessions = useCallback(async (jobId: string) => {
    // Find all equipment currently deployed to this job
    const deployedEquipment = data.individualEquipment.filter(
      equipment => equipment.jobId === jobId && equipment.status === 'deployed'
    );

    // End usage sessions for all deployed equipment
    const endSessionPromises = deployedEquipment.map(equipment => {
      if (equipment.equipmentId) {
        return endUsageSession(equipment.equipmentId, jobId);
      }
      return Promise.resolve();
    });

    await Promise.all(endSessionPromises);
  }, [data.individualEquipment, endUsageSession]);

  return {
    endAllJobUsageSessions,
  };
};