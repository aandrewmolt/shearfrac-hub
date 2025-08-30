
import { EquipmentItem } from '@/types/inventory';
import { toast } from 'sonner';
import { useInventoryDefaults } from './useInventoryDefaults';
import { useMemo, useCallback } from 'react';

export const useInventoryValidation = () => {
  const { DEFAULT_EQUIPMENT_TYPES } = useInventoryDefaults();

  const cleanupDuplicateDeployments = useCallback((items: EquipmentItem[]): EquipmentItem[] => {
    const cleanedItems: EquipmentItem[] = [];
    const deploymentMap = new Map<string, EquipmentItem>();
    let hasChanges = false;
    let removedCount = 0;
    
    for (const item of items) {
      if (item.status === 'deployed' && item.jobId) {
        const deploymentKey = `${item.typeId}-${item.jobId}`;
        
        if (deploymentMap.has(deploymentKey)) {
          // Found duplicate - consolidate quantities
          const existing = deploymentMap.get(deploymentKey)!;
          existing.quantity += item.quantity;
          removedCount++;
          hasChanges = true;
        } else {
          // First instance of this deployment
          deploymentMap.set(deploymentKey, { ...item });
        }
      } else {
        // Not a deployment - keep as is
        cleanedItems.push(item);
      }
    }
    
    // Add consolidated deployments
    deploymentMap.forEach(deployment => {
      cleanedItems.push(deployment);
    });
    
    // Only return new array if there were actual changes
    if (hasChanges) {
      toast.info(`Cleaned up ${removedCount} duplicate equipment records`);
    }
    
    return cleanedItems;
  }, []);

  const ensureMinimumInventory = useCallback((items: EquipmentItem[]): EquipmentItem[] => {
    const updatedItems = [...items];
    const midlandOfficeId = '1';
    let hasChanges = false;
    
    // Only ensure minimum inventory for equipment types that DON'T require individual tracking
    DEFAULT_EQUIPMENT_TYPES
      .filter(type => !type.requiresIndividualTracking)
      .forEach(type => {
        const existingItem = updatedItems.find(
          item => item.typeId === type.id && item.locationId === midlandOfficeId && item.status === 'available'
        );
        
        if (!existingItem) {
          // Create new item if none exists
          updatedItems.push({
            id: `auto-item-${type.id}-${Date.now()}`,
            typeId: type.id,
            locationId: midlandOfficeId,
            quantity: 25,
            status: 'available',
            lastUpdated: new Date(),
          });
          hasChanges = true;
        } else if (existingItem.quantity < 5) {
          // Top up if quantity is too low
          existingItem.quantity = Math.max(existingItem.quantity + 10, 15);
          existingItem.lastUpdated = new Date();
          hasChanges = true;
        }
      });
    
    // Remove any bulk items for equipment types that require individual tracking
    const itemsToRemove = updatedItems.filter(item => {
      const equipmentType = DEFAULT_EQUIPMENT_TYPES.find(type => type.id === item.typeId);
      return equipmentType?.requiresIndividualTracking || false;
    });

    if (itemsToRemove.length > 0) {
      const filteredItems = updatedItems.filter(item => {
        const equipmentType = DEFAULT_EQUIPMENT_TYPES.find(type => type.id === item.typeId);
        return !equipmentType?.requiresIndividualTracking;
      });
      hasChanges = true;
      return filteredItems;
    }
    
    // Only return new array if there were actual changes
    return hasChanges ? updatedItems : items;
  }, [DEFAULT_EQUIPMENT_TYPES]);

  return {
    cleanupDuplicateDeployments,
    ensureMinimumInventory,
  };
};
