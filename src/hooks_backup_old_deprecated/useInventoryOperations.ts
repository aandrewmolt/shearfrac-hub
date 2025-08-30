
import { InventoryData, EquipmentType, StorageLocation, EquipmentItem, IndividualEquipment } from '@/types/inventory';

export const useInventoryOperations = (
  data: InventoryData,
  setData: (data: InventoryData) => void
) => {
  // These methods now only update local state, no localStorage
  const updateEquipmentTypes = (types: EquipmentType[]) => {
    const updatedData = { ...data, equipmentTypes: types, lastSync: new Date() };
    setData(updatedData);
  };

  const updateStorageLocations = (locations: StorageLocation[]) => {
    const updatedData = { ...data, storageLocations: locations, lastSync: new Date() };
    setData(updatedData);
  };

  const updateEquipmentItems = (items: EquipmentItem[]) => {
    const updatedData = { 
      ...data, 
      equipmentItems: items,
      lastSync: new Date()
    };
    setData(updatedData);
  };

  const updateIndividualEquipment = (equipment: IndividualEquipment[]) => {
    const updatedData = { 
      ...data, 
      individualEquipment: equipment,
      lastSync: new Date()
    };
    setData(updatedData);
  };

  const updateSingleEquipmentItem = (itemId: string, updates: Partial<EquipmentItem>) => {
    const updatedItems = data.equipmentItems.map(item =>
      item.id === itemId
        ? { ...item, ...updates, lastUpdated: new Date() }
        : item
    );
    updateEquipmentItems(updatedItems);
  };

  const updateSingleIndividualEquipment = (equipmentId: string, updates: Partial<IndividualEquipment>) => {
    const updatedEquipment = data.individualEquipment.map(equipment =>
      equipment.id === equipmentId
        ? { ...equipment, ...updates, lastUpdated: new Date() }
        : equipment
    );
    updateIndividualEquipment(updatedEquipment);
  };

  return {
    updateEquipmentTypes,
    updateStorageLocations,
    updateEquipmentItems,
    updateIndividualEquipment,
    updateSingleEquipmentItem,
    updateSingleIndividualEquipment,
  };
};
