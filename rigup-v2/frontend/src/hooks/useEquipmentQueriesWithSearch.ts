import { useEquipmentSearchManager } from './equipment/managers/useEquipmentSearchManager';

/**
 * Equipment queries with search functionality
 * For use in components (NOT in InventoryProvider)
 * 
 * This hook uses the InventoryContext so it can only be used
 * inside components that are wrapped by InventoryProvider
 */
export const useEquipmentQueriesWithSearch = () => {
  const searchManager = useEquipmentSearchManager();
  
  return {
    // Equipment Types Query (legacy format)
    data: searchManager.equipmentTypes,
    equipmentTypes: searchManager.equipmentTypes,
    isLoading: searchManager.typesLoading,
    typesLoading: searchManager.typesLoading,
    refetch: searchManager.refetchTypes,
    refetchTypes: searchManager.refetchTypes,
    
    // Storage Locations Query
    storageLocations: searchManager.storageLocations,
    locationsLoading: searchManager.locationsLoading,
    refetchLocations: searchManager.refetchLocations,
    
    // Individual Equipment Query
    individualEquipment: searchManager.individualEquipment,
    equipmentLoading: searchManager.equipmentLoading,
    refetchEquipment: searchManager.refetchEquipment,
    
    // Combined loading state
    isLoadingAll: searchManager.isLoading,
    
    // Refetch all
    refetchAll: searchManager.refetchAllData,
    
    // All search manager functions are also available
    ...searchManager
  };
};