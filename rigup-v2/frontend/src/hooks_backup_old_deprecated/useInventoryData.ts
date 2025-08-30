
/**
 * @deprecated Use useUnifiedInventory instead
 * 
 * This hook has been replaced by useUnifiedInventory which provides:
 * - Database-backed storage (instead of localStorage)
 * - Unified allocation state management
 * - Better performance with React Query caching
 * - Consistent data across all components
 */

import { useUnifiedInventory } from './useUnifiedInventory';
import { toast } from 'sonner';

// Re-export types for backward compatibility
export type {
  EquipmentType,
  StorageLocation,
  EquipmentItem,
  IndividualEquipment,
  InventoryData
} from '@/types/inventory';

/**
 * Migration wrapper for useInventoryData
 * Routes to useUnifiedInventory with compatible API
 */
export const useInventoryData = () => {
  // Silently redirect to unified inventory - migration wrapper
  const unified = useUnifiedInventory();

  // Compatibility layer - map unified API to old API
  return {
    data: unified.data,
    isLoading: unified.isLoading,
    syncStatus: unified.syncStatus,
    
    // Mapped operations for backward compatibility
    syncData: unified.refreshData,
    resetToDefaultInventory: () => {
      toast.info('Reset functionality moved to inventory management interface');
    },
    cleanupDuplicateDeployments: (items: unknown[]) => items, // No-op, handled automatically
    
    // Legacy query functions mapped to unified equivalents
    getEquipmentByType: (typeId: string) => {
      // Return empty array since equipmentItems is deprecated
      // Silently handle for backward compatibility
      return [];
    },
    
    getIndividualEquipmentByType: unified.getEquipmentByType,
    
    getEquipmentByLocation: (locationId: string) => {
      // Return empty array since equipmentItems is deprecated
      console.warn('getEquipmentByLocation for equipmentItems is deprecated. Use getEquipmentByLocation from useUnifiedInventory for individualEquipment.');
      return [];
    },
    
    getIndividualEquipmentByLocation: (locationId: string) => 
      unified.getEquipmentByLocation(locationId, 'storage'),
    
    // Legacy operations - most are deprecated
    addEquipmentType: () => {
      console.warn('addEquipmentType moved to unified inventory operations');
    },
    updateEquipmentType: () => {
      console.warn('updateEquipmentType moved to unified inventory operations');
    },
    deleteEquipmentType: () => {
      console.warn('deleteEquipmentType moved to unified inventory operations');
    },
    addStorageLocation: () => {
      console.warn('addStorageLocation moved to unified inventory operations');
    },
    updateStorageLocation: () => {
      console.warn('updateStorageLocation moved to unified inventory operations');
    },
    deleteStorageLocation: () => {
      console.warn('deleteStorageLocation moved to unified inventory operations');
    },
    addEquipmentItem: () => {
      console.warn('addEquipmentItem is deprecated. Use individual equipment instead.');
    },
    updateEquipmentItem: () => {
      console.warn('updateEquipmentItem is deprecated. Use individual equipment instead.');
    },
    deleteEquipmentItem: () => {
      console.warn('deleteEquipmentItem is deprecated. Use individual equipment instead.');
    },
    addIndividualEquipment: (equipment: Partial<IndividualEquipment>) => {
      console.warn('addIndividualEquipment moved to unified inventory operations');
    },
    updateIndividualEquipment: unified.updateEquipment,
    deleteIndividualEquipment: unified.deleteEquipment,
  };
};
