import { useEquipmentSearchManager } from './equipment/managers/useEquipmentSearchManager';

/**
 * Legacy compatibility wrapper for useAdvancedEquipmentSearch
 * 
 * @deprecated Use useEquipmentSearchManager for new code
 */
export const useAdvancedEquipmentSearch = () => {
  const searchManager = useEquipmentSearchManager();
  
  return {
    // Legacy API compatibility
    searchFilters: searchManager.searchFilters,
    setSearchFilters: (filters: any) => {
      Object.entries(filters).forEach(([key, value]) => {
        searchManager.updateSearchFilter(key as any, value);
      });
    },
    searchResults: searchManager.searchResults,
    
    // All search manager functions are also available
    ...searchManager
  };
};