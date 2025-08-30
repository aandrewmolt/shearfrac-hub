import { useCallback } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { toast } from 'sonner';
import { tursoDb } from '@/services/tursoDb';
import { useJobs } from '@/hooks/useJobs';

export const useEquipmentCleanup = () => {
  const { refreshData, data } = useInventory();
  const { jobs } = useJobs();

  const cleanupIncorrectDeployments = useCallback(async (jobId: string) => {
    try {
      const job = jobs.find(j => j.id === jobId);
      
      if (!job) {
        toast.error('Job not found');
        return;
      }

      // Get equipment that's marked as deployed to this job
      const incorrectlyDeployed = data.individualEquipment.filter(eq => 
        eq.jobId === jobId && 
        eq.status === 'deployed'
        // Add additional logic here to determine if it's actually incorrectly deployed
      );

      // Clean up incorrectly deployed equipment
      for (const equipment of incorrectlyDeployed) {
        await tursoDb.updateIndividualEquipment(equipment.id, {
          ...equipment,
          status: 'available',
          jobId: null,
          locationId: equipment.locationId || 'midland-office',
          locationType: 'storage'
        });
      }

      await refreshData();
      toast.success(`Cleaned up ${incorrectlyDeployed.length} incorrect deployments`);
      
    } catch (error) {
      toast.error('Failed to cleanup incorrect deployments');
    }
  }, [data.individualEquipment, jobs, refreshData]);

  return {
    cleanupIncorrectDeployments
  };
};