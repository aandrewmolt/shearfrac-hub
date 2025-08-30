
import { useState, useEffect, useCallback } from 'react';
import { useAwsInventory as useInventory } from '@/hooks/useAwsInventory';
import { toast } from 'sonner';

interface InventoryAlert {
  id: string;
  type: 'low-stock' | 'missing-equipment' | 'validation-error';
  message: string;
  severity: 'warning' | 'error' | 'info';
  timestamp: Date;
  equipmentTypeId?: string;
  locationId?: string;
}

export const useRealTimeInventory = () => {
  const { data, updateEquipmentItems } = useInventory();
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [lastValidation, setLastValidation] = useState<Date>(() => new Date());

  const validateInventoryIntegrity = useCallback(() => {
    const newAlerts: InventoryAlert[] = [];
    
    // Check for equipment types without any inventory
    data.equipmentTypes.forEach(type => {
      const hasInventory = data.equipmentItems.some(item => item.typeId === type.id);
      if (!hasInventory) {
        newAlerts.push({
          id: `missing-${type.id}`,
          type: 'missing-equipment',
          message: `No inventory found for ${type.name}`,
          severity: 'warning',
          timestamp: new Date(),
          equipmentTypeId: type.id,
        });
      }
    });

    // Check for low stock warnings
    const lowStockThreshold = 5;
    data.storageLocations.forEach(location => {
      data.equipmentTypes.forEach(type => {
        const availableStock = data.equipmentItems
          .filter(item => 
            item.typeId === type.id && 
            item.locationId === location.id && 
            item.status === 'available'
          )
          .reduce((sum, item) => sum + item.quantity, 0);

        if (availableStock > 0 && availableStock < lowStockThreshold) {
          newAlerts.push({
            id: `low-stock-${type.id}-${location.id}`,
            type: 'low-stock',
            message: `Low stock: ${type.name} at ${location.name} (${availableStock} remaining)`,
            severity: 'warning',
            timestamp: new Date(),
            equipmentTypeId: type.id,
            locationId: location.id,
          });
        }
      });
    });

    // Check for orphaned equipment items
    data.equipmentItems.forEach(item => {
      const typeExists = data.equipmentTypes.find(type => type.id === item.typeId);
      const locationExists = data.storageLocations.find(loc => loc.id === item.locationId);
      
      if (!typeExists || !locationExists) {
        newAlerts.push({
          id: `orphaned-${item.id}`,
          type: 'validation-error',
          message: `Orphaned equipment item: ${!typeExists ? 'Unknown type' : 'Unknown location'}`,
          severity: 'error',
          timestamp: new Date(),
        });
      }
    });

    setAlerts(newAlerts);
    setLastValidation(new Date());
    
    return newAlerts;
  }, [data.equipmentItems, data.equipmentTypes, data.storageLocations]);

  const autoCorrectInventory = () => {
    const correctionsMade: string[] = [];
    const updatedItems = [...data.equipmentItems];

    // Ensure minimum stock for each equipment type at default location
    const defaultLocation = data.storageLocations.find(loc => loc.isDefault);
    if (defaultLocation) {
      data.equipmentTypes.forEach(type => {
        const availableStock = updatedItems
          .filter(item => 
            item.typeId === type.id && 
            item.locationId === defaultLocation.id && 
            item.status === 'available'
          )
          .reduce((sum, item) => sum + item.quantity, 0);

        if (availableStock < 5) {
          const existingItem = updatedItems.find(
            item => item.typeId === type.id && 
                   item.locationId === defaultLocation.id && 
                   item.status === 'available'
          );

          if (existingItem) {
            existingItem.quantity = Math.max(15, existingItem.quantity + 10);
            existingItem.lastUpdated = new Date();
          } else {
            updatedItems.push({
              id: `auto-stock-${type.id}-${Date.now()}`,
              typeId: type.id,
              locationId: defaultLocation.id,
              quantity: 15,
              status: 'available',
              lastUpdated: new Date(),
            });
          }
          correctionsMade.push(`Restocked ${type.name} at ${defaultLocation.name}`);
        }
      });
    }

    if (correctionsMade.length > 0) {
      updateEquipmentItems(updatedItems);
      toast.success(`Auto-corrected inventory: ${correctionsMade.join(', ')}`);
    }

    return correctionsMade;
  };

  const getInventorySnapshot = () => ({
    totalItems: data.equipmentItems.length,
    totalEquipment: data.equipmentItems.reduce((sum, item) => sum + item.quantity, 0),
    availableEquipment: data.equipmentItems
      .filter(item => item.status === 'available')
      .reduce((sum, item) => sum + item.quantity, 0),
    deployedEquipment: data.equipmentItems
      .filter(item => item.status === 'deployed')
      .reduce((sum, item) => sum + item.quantity, 0),
    alertCount: alerts.length,
    criticalAlerts: alerts.filter(alert => alert.severity === 'error').length,
    lastValidation,
  });

  // Run validation when inventory data changes
  useEffect(() => {
    validateInventoryIntegrity();
  }, [data.equipmentItems, data.equipmentTypes, data.storageLocations, validateInventoryIntegrity]);

  return {
    alerts,
    validateInventoryIntegrity,
    autoCorrectInventory,
    getInventorySnapshot,
    clearAlert: (alertId: string) => setAlerts(prev => prev.filter(a => a.id !== alertId)),
  };
};
