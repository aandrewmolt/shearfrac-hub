
import { useState } from 'react';
import { Node, Edge } from '@xyflow/react';
import { useInventoryData } from './useInventoryData';
import { toast } from 'sonner';
import { useEquipmentUsageCalculator, EquipmentUsage } from './equipment/useEquipmentUsageCalculator';
import { useEquipmentTypeManager } from './equipment/useEquipmentTypeManager';
import { useEquipmentAllocator } from './equipment/useEquipmentAllocator';
import { useEquipmentReturner } from './equipment/useEquipmentReturner';

export const useEnhancedEquipmentTracking = (jobId: string, nodes: Node[], edges: Edge[]) => {
  const { data, updateEquipmentItems } = useInventoryData();
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(false);

  const { calculateEquipmentUsage } = useEquipmentUsageCalculator(nodes, edges);
  const { ensureEquipmentTypesExist } = useEquipmentTypeManager();
  const { performEquipmentAllocation, createAuditEntries, cleanupDuplicateDeployments } = useEquipmentAllocator(jobId);
  const { returnAllJobEquipment, returnEquipmentToLocation } = useEquipmentReturner(jobId);

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

    // Update inventory
    updateEquipmentItems(updatedItems);
    
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
