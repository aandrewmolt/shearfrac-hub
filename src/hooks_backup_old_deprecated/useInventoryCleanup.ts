
import { EquipmentItem } from '@/types/inventory';
import { useInventoryDefaults } from './useInventoryDefaults';

export const useInventoryCleanup = () => {
  const { cleanupInventoryDuplicates } = useInventoryDefaults();

  const mergeAndCleanupInventory = (existingItems: EquipmentItem[]): EquipmentItem[] => {
    // First, cleanup any existing duplicates
    const cleanedItems = cleanupInventoryDuplicates(existingItems);
    
    // Map to track items by location and type
    const itemMap = new Map<string, EquipmentItem>();
    
    // Process existing cleaned items
    cleanedItems.forEach(item => {
      const key = `${item.typeId}-${item.locationId}-${item.status}`;
      
      if (itemMap.has(key)) {
        // Merge quantities for identical items
        const existing = itemMap.get(key)!;
        existing.quantity += item.quantity;
        existing.lastUpdated = new Date();
      } else {
        itemMap.set(key, { ...item });
      }
    });

    // Ensure all equipment types exist with proper names and IDs
    const typeMapping = {
      'wellside-gauge': 'pressure-gauge-1502', // Map old wellside gauge to pressure gauge
    };

    // Update any old type IDs to new ones
    const updatedItems = Array.from(itemMap.values()).map(item => {
      const newTypeId = typeMapping[item.typeId as keyof typeof typeMapping];
      if (newTypeId) {
        return { ...item, typeId: newTypeId, lastUpdated: new Date() };
      }
      return item;
    });

    // Re-cleanup after type updates to merge any newly matching items
    return cleanupInventoryDuplicates(updatedItems);
  };

  const ensureRequiredItemsExist = (items: EquipmentItem[]): EquipmentItem[] => {
    const requiredItems = [
      { typeId: '100ft-cable', locationId: 'midland-office', minQuantity: 20 },
      { typeId: '200ft-cable', locationId: 'midland-office', minQuantity: 15 },
      { typeId: '300ft-cable-old', locationId: 'midland-office', minQuantity: 15 },
      { typeId: '300ft-cable-new', locationId: 'midland-office', minQuantity: 15 },
      { typeId: 'y-adapter', locationId: 'midland-office', minQuantity: 10 },
      { typeId: 'pressure-gauge-1502', locationId: 'midland-office', minQuantity: 3 },
    ];

    const itemMap = new Map<string, EquipmentItem>();
    
    // Add existing items with proper key structure
    items.forEach(item => {
      const key = `${item.typeId}-${item.locationId}-${item.status}`;
      
      if (itemMap.has(key)) {
        // Merge if duplicate found
        const existing = itemMap.get(key)!;
        existing.quantity += item.quantity;
        existing.lastUpdated = new Date();
      } else {
        itemMap.set(key, item);
      }
    });

    // Ensure required items exist with minimum quantities
    requiredItems.forEach(required => {
      const key = `${required.typeId}-${required.locationId}-available`;
      const existing = itemMap.get(key);
      
      if (!existing) {
        // Mark for creation - will be handled by the component
        itemMap.set(key, {
          id: `new-${required.typeId}-${required.locationId}`, // Temporary marker
          typeId: required.typeId,
          locationId: required.locationId,
          quantity: required.minQuantity,
          status: 'available',
          lastUpdated: new Date(),
        });
      } else if (existing.quantity < required.minQuantity) {
        // Update quantity to minimum
        existing.quantity = Math.max(existing.quantity, required.minQuantity);
        existing.lastUpdated = new Date();
      }
    });

    return Array.from(itemMap.values());
  };

  return {
    mergeAndCleanupInventory,
    ensureRequiredItemsExist,
    cleanupInventoryDuplicates,
  };
};
