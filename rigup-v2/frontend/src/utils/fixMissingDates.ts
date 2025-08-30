import { turso } from '@/utils/consolidated/databaseUtils';

export async function fixMissingJobDates() {
  try {
    const result = await turso.execute('SELECT * FROM jobs WHERE created_at IS NULL OR updated_at IS NULL');
    const jobs = result.rows;
    
    if (!jobs || jobs.length === 0) {
      console.log('No jobs with missing dates found');
      return { success: true, updated: 0 };
    }
    
    console.log(`Found ${jobs.length} jobs with missing dates`);
    
    // Set date to 1 week ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const dateString = oneWeekAgo.toISOString();
    
    // Update each job
    let updatedCount = 0;
    for (const job of jobs) {
      const updates: string[] = [];
      const args: (string | number)[] = [];
      
      if (!job.created_at) {
        updates.push('created_at = ?');
        args.push(dateString);
      }
      if (!job.updated_at) {
        updates.push('updated_at = ?');
        args.push(dateString);
      }
      
      if (updates.length > 0) {
        args.push(job.id);
        
        try {
          await turso.execute({
            sql: `UPDATE jobs SET ${updates.join(', ')} WHERE id = ?`,
            args
          });
          
          console.log('Updated job', job.id);
          updatedCount++;
        } catch (error) {
          console.error(`Failed to update job ${job.id}:`, error);
          continue;
        }
      }
    }
    
    console.log(`Updated ${updatedCount} jobs with missing dates`);
    return { success: true, updated: updatedCount };
  } catch (error) {
    console.error('Error fixing missing job dates:', error);
    return { success: false, error };
  }
}

// Function to fix dates for all tables that might have missing dates
export async function fixAllMissingDates() {
  try {
    const jobResult = await fixMissingJobDates();
    
    // Add more table fixes as needed
    // const equipmentResult = await fixMissingEquipmentDates();
    // const locationResult = await fixMissingLocationDates();
    
    return {
      success: true,
      results: {
        jobs: jobResult
      }
    };
  } catch (error) {
    console.error('Error fixing all missing dates:', error);
    return { success: false, error };
  }
}