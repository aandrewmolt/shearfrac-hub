
import { useState, useMemo } from 'react';
import { useInventoryData } from './useInventoryData';
import { useJobLocationIntegration } from './useJobLocationIntegration';

export const useAdvancedEquipmentSearch = () => {
  const { data } = useInventoryData();
  const { getLocationName } = useJobLocationIntegration();
  const [searchFilters, setSearchFilters] = useState({
    query: '',
    category: '',
    status: '',
    location: '',
    equipmentType: '',
    showIndividualOnly: false,
    showBulkOnly: false
  });

  const searchResults = useMemo(() => {
    let results: unknown[] = [];

    // Combine all equipment into searchable format - deduplicate by ID
    const equipmentMap = new Map();
    
    // Add bulk equipment items
    data.equipmentItems.forEach(item => {
      if (!equipmentMap.has(item.id)) {
        equipmentMap.set(item.id, {
          ...item,
          type: 'bulk',
          displayName: data.equipmentTypes.find(t => t.id === item.typeId)?.name || 'Unknown',
          searchableText: `${data.equipmentTypes.find(t => t.id === item.typeId)?.name} ${item.notes || ''}`
        });
      }
    });
    
    // Add individual equipment items
    data.individualEquipment.forEach(eq => {
      if (!equipmentMap.has(eq.id)) {
        equipmentMap.set(eq.id, {
          ...eq,
          type: 'individual',
          displayName: `${eq.equipmentId} - ${eq.name}`,
          searchableText: `${eq.equipmentId} ${eq.name} ${eq.serialNumber || ''} ${eq.notes || ''}`
        });
      }
    });
    
    const allEquipment = Array.from(equipmentMap.values());

    // Apply filters
    results = allEquipment.filter(item => {
      // Text search
      if (searchFilters.query) {
        const query = searchFilters.query.toLowerCase();
        if (!item.searchableText.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Category filter
      if (searchFilters.category) {
        const equipmentType = data.equipmentTypes.find(t => t.id === item.typeId);
        if (!equipmentType || equipmentType.category !== searchFilters.category) {
          return false;
        }
      }

      // Status filter
      if (searchFilters.status && item.status !== searchFilters.status) {
        return false;
      }

      // Location filter
      if (searchFilters.location && item.locationId !== searchFilters.location) {
        return false;
      }

      // Equipment type filter
      if (searchFilters.equipmentType && item.typeId !== searchFilters.equipmentType) {
        return false;
      }

      // Individual/bulk filter
      if (searchFilters.showIndividualOnly && item.type !== 'individual') {
        return false;
      }

      if (searchFilters.showBulkOnly && item.type !== 'bulk') {
        return false;
      }

      return true;
    });

    return results;
  }, [data, searchFilters]);

  const updateFilter = (key: keyof typeof searchFilters, value: string | boolean) => {
    setSearchFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setSearchFilters({
      query: '',
      category: '',
      status: '',
      location: '',
      equipmentType: '',
      showIndividualOnly: false,
      showBulkOnly: false
    });
  };

  const getFilterSummary = () => {
    const activeFilters = Object.entries(searchFilters)
      .filter(([key, value]) => {
        if (typeof value === 'boolean') return value;
        return value && value !== '';
      })
      .map(([key, value]) => {
        switch (key) {
          case 'query': return `Text: "${value}"`;
          case 'category': return `Category: ${value}`;
          case 'status': return `Status: ${value}`;
          case 'location': 
            return `Location: ${getLocationName(value)}`;
          case 'equipmentType': {
            const type = data.equipmentTypes.find(t => t.id === value);
            return `Type: ${type?.name || value}`;
          }
          case 'showIndividualOnly': return 'Individual equipment only';
          case 'showBulkOnly': return 'Bulk equipment only';
          default: return `${key}: ${value}`;
        }
      });

    return activeFilters;
  };

  return {
    searchFilters,
    searchResults,
    updateFilter,
    clearFilters,
    getFilterSummary,
    hasActiveFilters: Object.values(searchFilters).some(value => 
      typeof value === 'boolean' ? value : value && value !== ''
    ),
    resultCount: searchResults.length
  };
};
