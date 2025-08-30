import { useEquipmentCRUDManager } from './managers/useEquipmentCRUDManager';

/**
 * Turso equipment mutations with context
 * For use in components (NOT in InventoryProvider)
 * 
 * This hook uses the InventoryContext so it can only be used
 * inside components that are wrapped by InventoryProvider
 */
export const useTursoEquipmentMutationsWithContext = () => {
  const crudManager = useEquipmentCRUDManager();
  
  // Map legacy API to new CRUD manager
  return {
    // Equipment Type operations
    addEquipmentType: crudManager.addEquipmentType,
    updateEquipmentType: crudManager.updateEquipmentType,
    deleteEquipmentType: crudManager.deleteEquipmentType,
    
    // Individual Equipment operations  
    addIndividualEquipment: crudManager.addIndividualEquipment,
    updateIndividualEquipment: crudManager.updateIndividualEquipment,
    deleteIndividualEquipment: crudManager.deleteIndividualEquipment,
    
    // Storage Location operations
    addStorageLocation: crudManager.addStorageLocation,
    updateStorageLocation: crudManager.updateStorageLocation, 
    deleteStorageLocation: crudManager.deleteStorageLocation,
    
    // All other CRUD manager functions are also available
    ...crudManager
  };
};