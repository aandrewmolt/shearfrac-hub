import { useEquipmentSearchManager } from '../equipment/managers/useEquipmentSearchManager';
import { EquipmentItem, IndividualEquipment, EquipmentType, StorageLocation } from '@/types/inventory';

interface UseEquipmentSearchProps {
  equipmentItems: EquipmentItem[];
  individualEquipment: IndividualEquipment[];
  equipmentTypes: EquipmentType[];
  storageLocations: StorageLocation[];
}

/**
 * Legacy compatibility wrapper for useEquipmentSearch
 * 
 * @deprecated Use useEquipmentSearchManager for new code
 */
export const useEquipmentSearch = (props: UseEquipmentSearchProps) => {
  // For backward compatibility, we ignore the props and use current inventory data
  const searchManager = useEquipmentSearchManager();
  
  return {
    // Legacy API compatibility
    searchTerm: searchManager.searchFilters.query,
    setSearchTerm: (term: string) => searchManager.searchByQuery(term),
    filterStatus: searchManager.searchFilters.status,
    setFilterStatus: (status: string) => searchManager.searchByStatus(status),
    filterLocation: searchManager.searchFilters.location,
    setFilterLocation: (location: string) => searchManager.searchByLocation(location),
    filterCategory: searchManager.searchFilters.category,
    setFilterCategory: (category: string) => searchManager.searchByCategory(category),
    
    // Search results
    filteredResults: searchManager.searchResults,
    
    // Utilities
    getEquipmentTypeName: searchManager.getEquipmentTypeName,
    getEquipmentTypeCategory: searchManager.getEquipmentTypeCategory,
    
    // All search manager functions are also available
    ...searchManager
  };
};