import { useState } from 'react';
import { tursoDb } from '@/services/tursoDb';
import { toast } from 'sonner';
import { useInventory } from '@/contexts/InventoryContext';

export const useEquipmentStatusFix = () => {
  const [isFixing, setIsFixing] = useState(false);
  const { syncData } = useInventory();

  const fixEquipmentStatuses = async () => {
    setIsFixing(true);
    
    try {
      console.log('Starting equipment status fix...');
      
      // Get all individual equipment
      const allEquipment = await tursoDb.getIndividualEquipment();
      
      // Filter equipment that needs fixing (null or empty status)
      const equipmentToFix = allEquipment.filter(eq => !eq.status || eq.status === '');
      
      console.log(`Found ${equipmentToFix.length} equipment items without status`);
      
      if (equipmentToFix.length === 0) {
        toast.info('No equipment needs status fixing');
        return { fixed: 0, alreadyOk: 0 };
      }
      
      // Update all equipment without status to 'available' (if not assigned to a job)
      const updates = equipmentToFix.map(async (equipment) => {
        const newStatus = equipment.job_id || equipment.jobId ? 'deployed' : 'available';
        
        try {
          await tursoDb.updateIndividualEquipment(equipment.id, { 
            status: newStatus,
          });
          
          console.log(`Updated ${equipment.equipment_id || equipment.equipmentId} status to: ${newStatus}`);
          return equipment.equipment_id || equipment.equipmentId;
        } catch (error) {
          console.error(`Failed to update ${equipment.equipment_id || equipment.equipmentId}:`, error);
          throw error;
        }
      });
      
      const results = await Promise.allSettled(updates);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;
      
      // Check for equipment with non-standard statuses
      const validStatuses = ['available', 'deployed', 'maintenance', 'red-tagged', 'retired'];
      const nonStandardEquipment = allEquipment.filter(eq => 
        eq.status && !validStatuses.includes(eq.status)
      );
      
      if (nonStandardEquipment.length > 0) {
        console.log(`Found ${nonStandardEquipment.length} equipment with non-standard status`);
        
        // Fix non-standard statuses
        const nonStandardUpdates = nonStandardEquipment.map(async (equipment) => {
          try {
            await tursoDb.updateIndividualEquipment(equipment.id, { 
              status: 'available',
            });
            
            return equipment.equipment_id || equipment.equipmentId;
          } catch (error) {
            console.error(`Failed to fix non-standard status for ${equipment.equipment_id || equipment.equipmentId}:`, error);
            throw error;
          }
        });
        
        await Promise.allSettled(nonStandardUpdates);
      }
      
      // Sync inventory data
      await syncData();
      
      if (failureCount > 0) {
        toast.warning(`Fixed ${successCount} items, ${failureCount} failed`);
      } else {
        toast.success(`Successfully fixed status for ${successCount} equipment items`);
      }
      
      return { fixed: successCount, failed: failureCount };
      
    } catch (error) {
      console.error('Error fixing equipment statuses:', error);
      toast.error('Failed to fix equipment statuses');
      throw error;
    } finally {
      setIsFixing(false);
    }
  };

  const checkEquipmentStatuses = async () => {
    try {
      // Get all individual equipment
      const allEquipment = await tursoDb.getIndividualEquipment();
      
      // Filter for problem equipment (null or empty status)
      const problemEquipment = allEquipment.filter(eq => !eq.status || eq.status === '');
      
      // Filter for non-standard status
      const validStatuses = ['available', 'deployed', 'maintenance', 'red-tagged', 'retired'];
      const nonStandardEquipment = allEquipment.filter(eq => 
        eq.status && !validStatuses.includes(eq.status)
      );
      
      return {
        missingStatus: problemEquipment,
        nonStandardStatus: nonStandardEquipment,
        totalProblems: problemEquipment.length + nonStandardEquipment.length
      };
      
    } catch (error) {
      console.error('Error checking equipment statuses:', error);
      toast.error('Failed to check equipment statuses');
      throw error;
    }
  };

  return {
    fixEquipmentStatuses,
    checkEquipmentStatuses,
    isFixing
  };
};