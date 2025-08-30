import { turso } from '../client';
import { toast } from 'sonner';

/**
 * Migration to clean up old deployment records from equipment_items table
 * These were incorrectly created by the old bulk allocation system
 */
export async function cleanupDeploymentRecords() {
  console.log('🧹 Starting deployment records cleanup migration...');
  
  try {
    // Find all equipment_items that are actually deployment records
    // These will have status 'deployed' and a job_id
    const deploymentRecords = await turso.execute(`
      SELECT * FROM equipment_items 
      WHERE status = 'deployed' 
      AND job_id IS NOT NULL
      AND location_type = 'job'
    `);

    console.log(`Found ${deploymentRecords.rows.length} deployment records to clean up`);

    if (deploymentRecords.rows.length === 0) {
      console.log('✅ No deployment records found to clean up');
      return;
    }

    // Start transaction
    await turso.execute('BEGIN TRANSACTION');

    try {
      // For each deployment record, we need to:
      // 1. Return the quantity to the source location
      // 2. Delete the deployment record
      for (const deployment of deploymentRecords.rows) {
        const typeId = deployment.type_id;
        const quantity = deployment.quantity as number;
        const jobId = deployment.job_id;
        
        // Try to find a source location from the notes or default to first storage location
        let sourceLocationId: string | null = null;
        
        if (deployment.notes && typeof deployment.notes === 'string') {
          const match = deployment.notes.match(/Deployed from (\S+)/);
          if (match) {
            sourceLocationId = match[1];
          }
        }

        // If we couldn't determine source location, find the default storage location
        if (!sourceLocationId) {
          const defaultLocation = await turso.execute(`
            SELECT id FROM storage_locations 
            WHERE is_default = 1 
            LIMIT 1
          `);
          
          if (defaultLocation.rows.length > 0) {
            sourceLocationId = defaultLocation.rows[0].id as string;
          }
        }

        if (sourceLocationId) {
          // Find the source inventory item
          const sourceItem = await turso.execute({
            sql: `SELECT * FROM equipment_items 
                  WHERE type_id = ? 
                  AND location_id = ? 
                  AND status = 'available'
                  AND location_type = 'storage'
                  LIMIT 1`,
            args: [typeId, sourceLocationId]
          });

          if (sourceItem.rows.length > 0) {
            // Update the quantity
            const currentQuantity = sourceItem.rows[0].quantity as number;
            await turso.execute({
              sql: `UPDATE equipment_items 
                    SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
                    WHERE id = ?`,
              args: [currentQuantity + quantity, sourceItem.rows[0].id]
            });
            console.log(`✅ Returned ${quantity} of ${typeId} to ${sourceLocationId}`);
          } else {
            // Create new inventory item if it doesn't exist
            await turso.execute({
              sql: `INSERT INTO equipment_items 
                    (id, type_id, location_id, quantity, status, location_type) 
                    VALUES (?, ?, ?, ?, 'available', 'storage')`,
              args: [
                `returned-${typeId}-${sourceLocationId}-${Date.now()}`,
                typeId,
                sourceLocationId,
                quantity
              ]
            });
            console.log(`✅ Created new inventory item for ${quantity} of ${typeId} at ${sourceLocationId}`);
          }
        }

        // Delete the deployment record
        await turso.execute({
          sql: 'DELETE FROM equipment_items WHERE id = ?',
          args: [deployment.id]
        });
        console.log(`🗑️ Deleted deployment record ${deployment.id}`);
      }

      // Commit transaction
      await turso.execute('COMMIT');
      
      console.log('✅ Deployment records cleanup completed successfully');
      toast.success(`Cleaned up ${deploymentRecords.rows.length} deployment records`);
      
    } catch (error) {
      // Rollback on error
      await turso.execute('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Failed to cleanup deployment records:', error);
    toast.error('Failed to cleanup deployment records');
    throw error;
  }
}

// Function to check if migration is needed
export async function needsDeploymentCleanup(): Promise<boolean> {
  try {
    const result = await turso.execute(`
      SELECT COUNT(*) as count FROM equipment_items 
      WHERE status = 'deployed' 
      AND job_id IS NOT NULL
      AND location_type = 'job'
    `);
    
    const count = result.rows[0]?.count as number || 0;
    return count > 0;
  } catch (error) {
    console.error('Failed to check deployment cleanup status:', error);
    return false;
  }
}