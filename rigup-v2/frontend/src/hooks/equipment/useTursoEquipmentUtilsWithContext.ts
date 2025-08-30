import { useEquipmentCRUDManager } from './managers/useEquipmentCRUDManager';

/**
 * Turso equipment utilities with context
 * For use in components (NOT in InventoryProvider)
 * 
 * This hook uses the InventoryContext so it can only be used
 * inside components that are wrapped by InventoryProvider
 */
export const useTursoEquipmentUtilsWithContext = () => {
  const crudManager = useEquipmentCRUDManager();
  
  // Map legacy API to new CRUD manager
  return {
    // Query utilities with legacy naming
    getEquipmentById: crudManager.getEquipmentById,
    getEquipmentByEquipmentId: crudManager.getEquipmentByEquipmentId,
    getEquipmentByType: crudManager.getEquipmentByType,
    getEquipmentByStatus: crudManager.getEquipmentByStatus,
    getEquipmentByLocation: crudManager.getEquipmentByLocation,
    getAvailableEquipmentByType: crudManager.getAvailableEquipmentByType,
    
    // All other CRUD manager functions are also available
    ...crudManager
  };
};