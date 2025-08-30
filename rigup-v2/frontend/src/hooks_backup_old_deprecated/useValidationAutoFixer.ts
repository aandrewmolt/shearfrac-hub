
import { useCallback } from 'react';
import { useInventoryData } from '@/hooks/useInventoryData';
import { useAuditTrail } from '@/hooks/useAuditTrail';
import { ValidationIssue } from '@/types/validation';
import { toast } from 'sonner';

export const useValidationAutoFixer = () => {
  const { data, updateEquipmentItems } = useInventoryData();
  const { addAuditEntry } = useAuditTrail();

  const autoFixIssues = useCallback(async (issues: ValidationIssue[]) => {
    let fixedCount = 0;

    try {
      const updatedItems = [...data.equipmentItems];

      for (const issue of issues) {
        if (issue.suggestedAction === 'update_inventory') {
          // Auto-fix inventory issues
          const affectedItems = updatedItems.filter(
            item => item.typeId === issue.equipmentTypeId && 
                   item.locationId === issue.locationId
          );

          if (issue.type === 'data_inconsistency' && issue.actualValue < 0) {
            // Fix negative quantities
            affectedItems.forEach(item => {
              if (item.quantity < 0) {
                item.quantity = 0;
                item.lastUpdated = new Date();
              }
            });
            fixedCount++;
          }
        }
      }

      if (fixedCount > 0) {
        updateEquipmentItems(updatedItems);
        
        addAuditEntry({
          action: 'modify',
          entityType: 'equipment',
          entityId: 'system',
          details: {
            reason: `Auto-fixed ${fixedCount} validation issues`
          },
          metadata: { source: 'auto-sync' }
        });

        toast.success(`Auto-fixed ${fixedCount} validation issues`);
      }
    } catch (error) {
      console.error('Error auto-fixing issues:', error);
      toast.error('Failed to auto-fix some validation issues');
    }

    return fixedCount;
  }, [data, updateEquipmentItems, addAuditEntry]);

  return {
    autoFixIssues,
  };
};
