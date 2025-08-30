
import React, { createContext, useContext, useState } from 'react';
import { InventoryData } from '@/types/inventory';
import { useApiEquipmentQueries } from '@/hooks/api/useApiEquipmentQueries';
// import { useTursoEquipmentUtils } from '@/hooks/equipment/useTursoEquipmentUtils';  // Not needed with AWS
import { InventoryContextType } from './inventory/InventoryContextTypes';
import { useApiInventoryMutations } from './inventory/useApiInventoryMutations';  // Using AWS API
import { useInventoryRealtime } from './inventory/useInventoryRealtime';
import { useInventoryUtils } from './inventory/useInventoryUtils';
import { safeArray, safeFilter } from '@/utils/safeDataAccess';
import { getEquipmentDisplayLocation, filterEquipmentByLocation, groupEquipmentByLocation } from '@/utils/equipmentLocation';
import { normalizeEquipmentArray } from '@/utils/equipmentNormalizer';

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    equipmentTypes,
    storageLocations,
    individualEquipment,
    isLoading: queriesLoading,
    refetch
  } = useApiEquipmentQueries();  // Using AWS API now

  // const tursoUtils = useTursoEquipmentUtils(individualEquipment);  // Not needed with AWS
  const inventoryUtils = useInventoryUtils(equipmentTypes, storageLocations);
  const mutations = useApiInventoryMutations(storageLocations);  // Using AWS API
  
  // Set up real-time subscriptions with optimistic delete handling
  const { optimisticDeletes } = useInventoryRealtime(refetch);

  // Filter out optimistically deleted items
  const filteredIndividualEquipment = safeFilter(
    individualEquipment,
    item => !optimisticDeletes.has(item.id)
  );

  // Normalize equipment data for consistent field names
  const normalizedEquipment = normalizeEquipmentArray(filteredIndividualEquipment);

  // Combined data object with filtered and normalized equipment - NO LOCAL STORAGE
  const data: InventoryData = {
    equipmentTypes: safeArray(equipmentTypes),
    storageLocations: safeArray(storageLocations),
    individualEquipment: safeArray(normalizedEquipment),
    equipmentItems: safeArray([]), // Empty array for backward compatibility
    lastSync: new Date(),
  };

  // Helper methods using centralized location logic
  const getEquipmentAtLocation = (locationId: string, locationType: 'storage' | 'job' = 'storage') => {
    return filterEquipmentByLocation(data.individualEquipment, locationId, locationType);
  };
  
  const getEquipmentGroupedByLocation = () => {
    return groupEquipmentByLocation(data.individualEquipment);
  };
  
  const contextValue: InventoryContextType = {
    data,
    isLoading: queriesLoading || isLoading || mutations.isLoading,
    syncStatus: 'synced' as const,
    
    // Location helpers
    getEquipmentAtLocation,
    getEquipmentGroupedByLocation,
    getEquipmentDisplayLocation,
    
    // Enhanced CRUD operations
    deleteEquipmentType: mutations.deleteEquipmentType,
    deleteStorageLocation: mutations.deleteStorageLocation,
    deleteIndividualEquipment: mutations.deleteIndividualEquipment,
    
    // All mutation operations with proper wrapper functions
    addEquipmentType: mutations.addEquipmentTypeWrapper,
    updateEquipmentType: mutations.updateEquipmentTypeWrapper,
    addStorageLocation: mutations.addStorageLocationWrapper,
    updateStorageLocation: mutations.updateStorageLocationWithDefault,
    addIndividualEquipment: mutations.addIndividualEquipmentWrapper,
    updateIndividualEquipment: mutations.updateIndividualEquipmentWrapper,
    
    // Legacy compatibility
    createEquipmentType: mutations.addEquipmentTypeWrapper,
    createStorageLocation: mutations.addStorageLocationWrapper,
    updateSingleIndividualEquipment: mutations.updateIndividualEquipmentWrapper,
    
    // Bulk operations
    addBulkIndividualEquipment: mutations.addBulkIndividualEquipment,

    // Utilities
    refreshData: refetch,
    // ...tursoUtils,  // Removed - using AWS API
    ...inventoryUtils,

    // Legacy compatibility methods - NO LOCAL STORAGE
    updateEquipmentTypes: mutations.updateEquipmentTypeWrapper,
    updateStorageLocations: mutations.updateStorageLocationWithDefault,
    syncData: async () => data,
    resetToDefaultInventory: () => {},
  };

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
