
import { useCallback } from 'react';
import { EquipmentItem, IndividualEquipment, EquipmentType } from '@/types/inventory';
import { useInventory } from '@/contexts/InventoryContext';
import { toast } from 'sonner';

export const useDataConsistencyFixer = () => {
  const { data, updateEquipmentItems, updateIndividualEquipment } = useInventory();

  const fixDataConsistency = useCallback(() => {
    const individualTrackingTypes = data.equipmentTypes.filter(type => type.requiresIndividualTracking);
    const bulkTrackingTypes = data.equipmentTypes.filter(type => !type.requiresIndividualTracking);
    const fixes: string[] = [];
    let fixesMade = 0;

    const updatedEquipmentItems = [...data.equipmentItems];
    const updatedIndividualEquipment = [...data.individualEquipment];

    // Fix 1: Remove bulk quantities for equipment types that require individual tracking
    individualTrackingTypes.forEach(type => {
      const bulkItems = updatedEquipmentItems.filter(item => item.typeId === type.id);
      if (bulkItems.length > 0) {
        fixes.push(`Removed bulk quantities for ${type.name}`);
        fixesMade++;
      }
    });

    // Fix 2: Ensure minimum stock for bulk tracking types
    const defaultLocation = data.storageLocations.find(loc => loc.isDefault);
    if (defaultLocation) {
      bulkTrackingTypes.forEach(type => {
        const existingItem = updatedEquipmentItems.find(
          item => item.typeId === type.id && item.locationId === defaultLocation.id && item.status === 'available'
        );

        if (!existingItem) {
          // Create new bulk item if none exists
          updatedEquipmentItems.push({
            id: `bulk-${type.id}-${Date.now()}`,
            typeId: type.id,
            locationId: defaultLocation.id,
            quantity: 25,
            status: 'available',
            lastUpdated: new Date(),
          });
          fixes.push(`Added bulk inventory for ${type.name}`);
          fixesMade++;
        } else if (existingItem.quantity < 5) {
          // Top up if quantity is too low
          existingItem.quantity = 25;
          existingItem.lastUpdated = new Date();
          fixes.push(`Restocked ${type.name} to 25 units`);
          fixesMade++;
        }
      });
    }

    // Fix 3: Create default individual equipment for types that require it but have none
    individualTrackingTypes.forEach(type => {
      const existingIndividual = updatedIndividualEquipment.filter(eq => eq.typeId === type.id);
      
      if (existingIndividual.length === 0 && defaultLocation) {
        // Create some default individual equipment
        const defaultCount = type.name.includes('Computer') ? 2 : 1;
        const prefix = type.defaultIdPrefix || 'EQ-';
        
        for (let i = 1; i <= defaultCount; i++) {
          const equipmentId = `${prefix}${i.toString().padStart(3, '0')}`;
          updatedIndividualEquipment.push({
            id: `individual-${type.id}-${i}-${Date.now()}`,
            equipmentId,
            name: `${type.name} ${equipmentId}`,
            typeId: type.id,
            locationId: defaultLocation.id,
            status: 'available',
            lastUpdated: new Date(),
          });
        }
        fixes.push(`Created ${defaultCount} default ${type.name} items`);
        fixesMade++;
      }
    });

    // Apply fixes if any were made
    if (fixesMade > 0) {
      updateEquipmentItems(updatedEquipmentItems);
      updateIndividualEquipment(updatedIndividualEquipment);
      
      toast.success(`Fixed ${fixesMade} data consistency issues: ${fixes.join(', ')}`);
    } else {
      toast.info('No data consistency issues found');
    }
  }, [data, updateEquipmentItems, updateIndividualEquipment]);

  const validateDataConsistency = useCallback(() => {
    const issues: string[] = [];

    // Check for bulk quantities on individual tracking types
    data.equipmentTypes.forEach(type => {
      if (type.requiresIndividualTracking) {
        const bulkItems = data.equipmentItems.filter(item => item.typeId === type.id);
        if (bulkItems.length > 0) {
          issues.push(`${type.name} has bulk quantities but requires individual tracking`);
        }
      }
    });

    // Check for missing individual equipment on required types
    data.equipmentTypes.forEach(type => {
      if (type.requiresIndividualTracking) {
        const individualItems = data.individualEquipment.filter(eq => eq.typeId === type.id);
        if (individualItems.length === 0) {
          issues.push(`${type.name} requires individual tracking but has no individual items`);
        }
      }
    });

    return issues;
  }, [data]);

  return {
    fixDataConsistency,
    validateDataConsistency,
  };
};
