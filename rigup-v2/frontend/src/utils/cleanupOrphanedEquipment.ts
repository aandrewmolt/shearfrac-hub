import { tursoDb } from '@/services/tursoDb';
import { toast } from 'sonner';

/**
 * Clean up equipment that's allocated to non-existent jobs
 */
export async function cleanupOrphanedEquipment() {
  try {
    // Get all active jobs
    const jobs = await tursoDb.getJobs();
    const activeJobIds = new Set(jobs.map(job => job.id));
    
    console.log('Active job IDs:', Array.from(activeJobIds));
    
    // Get all individual equipment
    const equipment = await tursoDb.getIndividualEquipment();
    
    console.log(`Found ${equipment.length} equipment items to check`);
    
    let cleanedCount = 0;
    
    // Find equipment allocated to non-existent jobs
    for (const item of equipment) {
      if (item.jobId) {
        console.log(`Equipment ${item.equipmentId} has jobId: ${item.jobId}, exists: ${activeJobIds.has(item.jobId)}`);
      }
      if (item.jobId && !activeJobIds.has(item.jobId)) {
        // Reset equipment to available status and clear job assignment
        await tursoDb.updateIndividualEquipment(item.id, {
          status: 'available',
          jobId: null,
          location_type: 'storage',
          notes: item.notes?.includes('Allocated to job') ? '' : item.notes
        });
        cleanedCount++;
        console.log(`Cleaned orphaned equipment: ${item.equipmentId} (was assigned to job: ${item.jobId})`);
      }
    }
    
    if (cleanedCount > 0) {
      toast.success(`Cleaned up ${cleanedCount} equipment items from deleted jobs`);
      console.log(`✅ Cleaned up ${cleanedCount} orphaned equipment items`);
    } else {
      console.log('✅ No orphaned equipment found');
    }
    
    return cleanedCount;
  } catch (error) {
    console.error('Error cleaning up orphaned equipment:', error);
    toast.error('Failed to clean up orphaned equipment');
    throw error;
  }
}

/**
 * Remove duplicate storage locations that match job names
 */
export async function removeDuplicateJobLocations() {
  try {
    const jobs = await tursoDb.getJobs();
    const storageLocations = await tursoDb.getStorageLocations();
    
    let removedCount = 0;
    
    // Find storage locations that match job names (these are duplicates)
    for (const location of storageLocations) {
      const matchingJob = jobs.find(job => 
        job.name === location.name || 
        (job.client && job.pad && location.name === `${job.client} - ${job.pad}`)
      );
      
      if (matchingJob && !location.isDefault) {
        // Move any equipment from the duplicate storage location to the default location
        const equipment = await tursoDb.getIndividualEquipment();
        const itemsAtLocation = equipment.filter(eq => eq.locationId === location.id);
        
        if (itemsAtLocation.length > 0) {
          const defaultLocation = storageLocations.find(loc => loc.isDefault);
          if (defaultLocation) {
            for (const item of itemsAtLocation) {
              await tursoDb.updateIndividualEquipment(item.id, {
                locationId: defaultLocation.id
              });
            }
          }
        }
        
        // Delete the duplicate storage location
        await tursoDb.deleteStorageLocation(location.id);
        removedCount++;
        console.log(`Removed duplicate storage location: ${location.name}`);
      }
    }
    
    if (removedCount > 0) {
      toast.success(`Removed ${removedCount} duplicate job locations from storage`);
      console.log(`✅ Removed ${removedCount} duplicate job locations`);
    }
    
    return removedCount;
  } catch (error) {
    console.error('Error removing duplicate job locations:', error);
    toast.error('Failed to remove duplicate job locations');
    throw error;
  }
}

/**
 * Run all cleanup operations
 */
export async function runFullCleanup() {
  console.log('🧹 Starting full equipment and location cleanup...');
  
  const orphanedCount = await cleanupOrphanedEquipment();
  const duplicatesCount = await removeDuplicateJobLocations();
  
  console.log(`✅ Cleanup complete: ${orphanedCount} orphaned items, ${duplicatesCount} duplicate locations removed`);
  
  return {
    orphanedEquipment: orphanedCount,
    duplicateLocations: duplicatesCount
  };
}