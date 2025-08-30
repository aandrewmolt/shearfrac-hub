import { useEquipmentCRUDManager } from './managers/useEquipmentCRUDManager';
import { useCallback } from 'react';

/**
 * Legacy compatibility wrapper for useEquipmentTypeManager
 * 
 * @deprecated Use useEquipmentCRUDManager for new code
 */
export const useEquipmentTypeManager = () => {
  const crudManager = useEquipmentCRUDManager();
  
  // Legacy method that ensured types existed based on usage patterns
  const ensureEquipmentTypesExist = useCallback(async (usage?: any) => {
    // For backward compatibility, just ensure default types exist
    return await crudManager.ensureDefaultEquipmentTypes();
  }, [crudManager]);
  
  return {
    // Legacy API
    ensureEquipmentTypesExist,
    
    // All CRUD manager functions are also available
    ...crudManager
  };
};