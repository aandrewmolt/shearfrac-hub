
import { useJobs } from '@/hooks/useJobs';

export const useInventoryUtils = (equipmentTypes: unknown[], storageLocations: unknown[]) => {
  const { jobs } = useJobs();
  
  // Utility functions
  const getEquipmentTypeName = (typeId: string): string => {
    const type = equipmentTypes.find(t => t.id === typeId);
    return type?.name || 'Unknown Type';
  };

  const getLocationName = (locationId: string): string => {
    // Check storage locations first
    const storageLocation = storageLocations.find(l => l.id === locationId);
    if (storageLocation) {
      return storageLocation.name;
    }
    
    // Check job locations
    const job = jobs.find(j => j.id === locationId);
    if (job) {
      return job.name;
    }
    
    return 'Unknown Location';
  };

  return {
    getEquipmentTypeName,
    getLocationName,
  };
};
