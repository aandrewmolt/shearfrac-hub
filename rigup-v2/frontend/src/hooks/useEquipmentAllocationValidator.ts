
import { useState, useCallback } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { toast } from 'sonner';

export interface EquipmentAllocationIssue {
  type: 'double_allocation' | 'insufficient_stock' | 'missing_equipment';
  equipmentId: string;
  equipmentName: string;
  conflictingJobs: string[];
  description: string;
  severity: 'error' | 'warning' | 'info';
}

export const useEquipmentAllocationValidator = () => {
  const { data, updateEquipmentItems } = useInventory();
  const [validationResults, setValidationResults] = useState<EquipmentAllocationIssue[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const validateEquipmentAllocations = useCallback(() => {
    console.log('Starting equipment allocation validation...');
    setIsValidating(true);
    
    const issues: EquipmentAllocationIssue[] = [];
    const deployedEquipment = data.equipmentItems.filter(item => item.status === 'deployed');
    
    // Group deployed equipment by type and job
    const deploymentMap = new Map<string, { jobIds: Set<string>; items: unknown[] }>();
    
    deployedEquipment.forEach(item => {
      if (!item.jobId) return;
      
      const key = `${item.typeId}-${item.locationId}`;
      if (!deploymentMap.has(key)) {
        deploymentMap.set(key, { jobIds: new Set(), items: [] });
      }
      
      const deployment = deploymentMap.get(key)!;
      deployment.jobIds.add(item.jobId);
      deployment.items.push(item);
    });

    // Check for double allocations
    deploymentMap.forEach((deployment, key) => {
      if (deployment.jobIds.size > 1) {
        const [typeId] = key.split('-');
        const equipmentType = data.equipmentTypes.find(type => type.id === typeId);
        
        issues.push({
          type: 'double_allocation',
          equipmentId: typeId,
          equipmentName: equipmentType?.name || 'Unknown Equipment',
          conflictingJobs: Array.from(deployment.jobIds),
          description: `Equipment allocated to ${deployment.jobIds.size} different jobs simultaneously`,
          severity: 'error'
        });
      }
    });

    // Check for negative quantities
    data.equipmentItems.forEach(item => {
      if (item.quantity < 0) {
        const equipmentType = data.equipmentTypes.find(type => type.id === item.typeId);
        issues.push({
          type: 'insufficient_stock',
          equipmentId: item.id,
          equipmentName: equipmentType?.name || 'Unknown Equipment',
          conflictingJobs: item.jobId ? [item.jobId] : [],
          description: `Negative quantity detected: ${item.quantity}`,
          severity: 'error'
        });
      }
    });

    setValidationResults(issues);
    setIsValidating(false);
    
    console.log('Equipment validation completed:', {
      totalIssues: issues.length,
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length
    });

    return issues;
  }, [data]);

  const fixEquipmentAllocations = useCallback((issues: EquipmentAllocationIssue[]) => {
    console.log('Attempting to fix equipment allocation issues...');
    
    let updatedItems = [...data.equipmentItems];
    let fixedCount = 0;

    issues.forEach(issue => {
      if (issue.type === 'double_allocation') {
        // Return all deployed equipment of this type to available status
        updatedItems = updatedItems.map(item => {
          if (item.typeId === issue.equipmentId && item.status === 'deployed') {
            // Find corresponding available item to add quantity back
            const availableItemIndex = updatedItems.findIndex(
              availItem => 
                availItem.typeId === item.typeId && 
                availItem.locationId === item.locationId && 
                availItem.status === 'available'
            );

            if (availableItemIndex >= 0) {
              updatedItems[availableItemIndex].quantity += item.quantity;
            } else {
              // Create new available item
              updatedItems.push({
                ...item,
                id: `available-${item.typeId}-${item.locationId}-${Date.now()}`,
                status: 'available',
                jobId: null,
                lastUpdated: new Date(),
              });
            }

            fixedCount++;
            return null; // Mark for removal
          }
          return item;
        }).filter((item): item is NonNullable<typeof item> => Boolean(item));
      }

      if (issue.type === 'insufficient_stock') {
        // Set negative quantities to 0
        updatedItems = updatedItems.map(item => {
          if (item.id === issue.equipmentId && item.quantity < 0) {
            fixedCount++;
            return { ...item, quantity: 0 };
          }
          return item;
        });
      }
    });

    if (fixedCount > 0) {
      updateEquipmentItems(updatedItems);
      toast.success(`Fixed ${fixedCount} equipment allocation issues`);
    }

    return fixedCount;
  }, [data, updateEquipmentItems]);

  const checkEquipmentAvailability = useCallback((typeId: string, locationId: string, quantity: number, excludeJobId?: string) => {
    const availableItems = data.equipmentItems.filter(
      item => 
        item.typeId === typeId && 
        item.locationId === locationId && 
        item.status === 'available'
    );

    const deployedItems = data.equipmentItems.filter(
      item => 
        item.typeId === typeId && 
        item.locationId === locationId && 
        item.status === 'deployed' &&
        item.jobId !== excludeJobId // Exclude current job to allow reallocation
    );

    const availableQuantity = availableItems.reduce((sum, item) => sum + item.quantity, 0);
    const deployedQuantity = deployedItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      available: availableQuantity,
      deployed: deployedQuantity,
      sufficient: availableQuantity >= quantity,
      total: availableQuantity + deployedQuantity
    };
  }, [data]);

  return {
    validateEquipmentAllocations,
    fixEquipmentAllocations,
    checkEquipmentAvailability,
    validationResults,
    isValidating,
  };
};
