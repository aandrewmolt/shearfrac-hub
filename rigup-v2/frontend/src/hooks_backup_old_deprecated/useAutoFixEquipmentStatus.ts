import { useEffect, useState, useCallback } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { tursoDb } from '@/services/tursoDb';
import { toast } from '@/hooks/use-toast';

export const useAutoFixEquipmentStatus = () => {
  const { data, refreshData } = useInventory();
  const [isFixing, setIsFixing] = useState(false);
  const [fixedCount, setFixedCount] = useState(0);

  const findInconsistentEquipment = useCallback(() => {
    // Find equipment marked as deployed but not actually deployed to any job
    return data.individualEquipment.filter(eq => 
      eq.status === 'deployed' && !eq.jobId
    );
  }, [data.individualEquipment]);

  const autoFixEquipmentStatus = async () => {
    const inconsistentEquipment = findInconsistentEquipment();
    
    if (inconsistentEquipment.length === 0) {
      return { success: true, fixed: 0 };
    }

    setIsFixing(true);
    let fixed = 0;

    try {
      // Fix each inconsistent item
      for (const item of inconsistentEquipment) {
        try {
          await tursoDb.updateIndividualEquipment(item.id, {
            status: 'available', // Set to available since it's not actually deployed
            jobId: null
          });
          fixed++;
        } catch (error) {
          // Log error but continue with other items
        }
      }

      toast({
        title: "Equipment Status Fixed",
        description: `Updated ${fixed} equipment items to 'available' status`,
      });

      setFixedCount(fixed);
      return { success: true, fixed };
    } catch (error) {
      return { success: false, fixed: 0 };
    } finally {
      setIsFixing(false);
    }
  };

  // Auto-fix on mount if there are inconsistencies
  useEffect(() => {
    const inconsistent = findInconsistentEquipment();
    if (inconsistent.length > 0) {
      // Optional: Auto-fix on mount
      // autoFixEquipmentStatus();
    }
  }, [findInconsistentEquipment]); // Run once on mount

  return {
    findInconsistentEquipment,
    autoFixEquipmentStatus,
    isFixing,
    fixedCount,
    inconsistentCount: findInconsistentEquipment().length
  };
};