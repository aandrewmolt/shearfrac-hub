
import { useCallback } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { toast } from 'sonner';

export const useEquipmentReturnerV2 = (jobId: string) => {
  const { data, updateIndividualEquipment } = useInventory();

  const returnAllJobEquipment = useCallback(async () => {
    // Get deployed equipment for this job
    const deployedEquipment = data.individualEquipment.filter(eq => 
      eq.status === 'deployed' && eq.jobId === jobId
    );

    // Get default storage location (Midland Office)
    const defaultLocation = data.storageLocations.find(loc => loc.isDefault)?.id || 'midland-office';
    
    const updatePromises = deployedEquipment.map(item => 
      updateIndividualEquipment(item.id, {
        status: 'available',
        jobId: null,
        locationId: defaultLocation,  // Return to default storage location
        locationType: 'storage'      // Reset location type
      })
    );

    await Promise.all(updatePromises);
    toast.success('All equipment returned to storage');
  }, [jobId, data.individualEquipment, data.storageLocations, updateIndividualEquipment]);

  return {
    returnAllJobEquipment
  };
};
