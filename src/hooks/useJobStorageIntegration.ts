
import { useCallback } from 'react';
import { useAwsInventory as useInventory } from '@/hooks/useAwsInventory';
import { toast } from 'sonner';

export const useJobStorageIntegration = () => {
  const { data, addStorageLocation } = useInventory();

  const createStorageLocationFromJob = useCallback(async (jobName: string) => {
    // Check if location already exists
    const existingLocation = data.storageLocations.find(
      location => location.name.toLowerCase() === jobName.toLowerCase()
    );

    if (existingLocation) {
      return existingLocation;
    }

    try {
      const newLocation = await addStorageLocation({
        name: jobName,
        address: undefined,
        isDefault: false
      });
      
      toast.success(`Storage location "${jobName}" created for job deployment`);
      return newLocation;
    } catch (error) {
      console.error('Error creating storage location for job:', error);
      toast.error('Failed to create storage location for job');
      throw error;
    }
  }, [data.storageLocations, addStorageLocation]);

  const ensureJobLocationExists = useCallback(async (jobName: string) => {
    if (!jobName?.trim()) {
      throw new Error('Job name is required');
    }

    return createStorageLocationFromJob(jobName.trim());
  }, [createStorageLocationFromJob]);

  return {
    createStorageLocationFromJob,
    ensureJobLocationExists
  };
};
