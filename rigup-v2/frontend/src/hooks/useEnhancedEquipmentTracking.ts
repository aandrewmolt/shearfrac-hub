
import { useState } from 'react';
import { Node, Edge } from '@xyflow/react';
import { useInventory } from '@/contexts/InventoryContext';
import { toast } from 'sonner';
import { useEquipmentUsageCalculator, EquipmentUsage } from './equipment/useEquipmentUsageCalculator';
import { useEquipmentTypeManager } from './equipment/useEquipmentTypeManager';
import { useEquipmentAllocatorV2 } from './equipment/useEquipmentAllocatorV2';
import { useEquipmentReturnerV2 } from './equipment/useEquipmentReturnerV2';

export const useEnhancedEquipmentTracking = (jobId: string, nodes: Node[], edges: Edge[]) => {
  const { data, refreshData } = useInventory();
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(false);

  const { calculateEquipmentUsage } = useEquipmentUsageCalculator(nodes, edges);
  const { ensureEquipmentTypesExist } = useEquipmentTypeManager();
  const { performEquipmentAllocation, createAuditEntries, cleanupDuplicateDeployments } = useEquipmentAllocatorV2(jobId);
  const { returnAllJobEquipment, returnEquipmentToLocation } = useEquipmentReturnerV2(jobId);

  const autoAllocateEquipment = (locationId: string, usage?: EquipmentUsage) => {
    if (!locationId) {
      toast.error('Please select a location before allocating equipment');
      return;
    }

    console.log(`Equipment allocation requested for job ${jobId} from location ${locationId}`);

    const currentUsage = usage || calculateEquipmentUsage();
    console.log('Calculated equipment usage:', currentUsage);
    
    ensureEquipmentTypesExist(currentUsage);

    // Start with clean data
    let updatedItems = [...data.equipmentItems];
    
    // Remove duplicates first
    updatedItems = cleanupDuplicateDeployments(updatedItems);

    // Check existing deployments
    const existingDeployments = updatedItems.filter(
      item => item.status === 'deployed' && item.jobId === jobId
    );

    console.log(`Found ${existingDeployments.length} existing deployments for job ${jobId}`);

    // Perform allocation
    const allocatedItems = performEquipmentAllocation(locationId, currentUsage, updatedItems);

    // Refresh inventory to get updated data
    await refreshData();
    
    // Create audit entries
    createAuditEntries(allocatedItems, locationId);

    // Provide user feedback
    const updatedCount = allocatedItems.filter(item => item.updated).length;
    const totalTypes = allocatedItems.length;

    if (existingDeployments.length > 0 && updatedCount > 0) {
      toast.success(`Equipment updated: ${updatedCount} of ${totalTypes} types modified`);
    } else if (existingDeployments.length > 0 && updatedCount === 0) {
      toast.info('Equipment allocation unchanged - already up to date');
    } else {
      toast.success(`Equipment allocated: ${totalTypes} types deployed`);
    }

    console.log('Equipment allocation completed successfully');
  };

  return {
    calculateEquipmentUsage,
    autoAllocateEquipment,
    returnAllJobEquipment,
    returnEquipmentToLocation,
    ensureEquipmentTypesExist,
    isAutoSyncEnabled,
    setIsAutoSyncEnabled,
  };
};
