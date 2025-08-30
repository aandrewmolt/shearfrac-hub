import awsDatabase from '@/services/awsDatabase';
import { toast } from 'sonner';

/**
 * Clean up equipment that's allocated to non-existent jobs
 */
export async function cleanupOrphanedEquipment() {
  try {
    // Get all active jobs
    const jobs = await awsDatabase.getJobs();
    const activeJobIds = new Set(jobs.map(job => job.id));
    
    console.log('Active job IDs:', Array.from(activeJobIds));
    
    // Get all equipment
    const equipment = await awsDatabase.getEquipment();
    
    console.log(`Found ${equipment.length} equipment items to check`);
    
    let cleanedCount = 0;
    
    // Find equipment allocated to non-existent jobs
    for (const item of equipment) {
      if (item.jobId) {
        console.log(`Equipment ${item.equipmentId} has jobId: ${item.jobId}, exists: ${activeJobIds.has(item.jobId)}`);
      }
      if (item.jobId && !activeJobIds.has(item.jobId)) {
        // Reset equipment to available status and clear job assignment
        await awsDatabase.updateEquipment(item.id, {
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
    const jobs = await awsDatabase.getJobs();
    // AWS doesn't have separate storage locations - this is a no-op
    console.log('✅ No duplicate job locations to remove (AWS backend)');
    return 0;
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