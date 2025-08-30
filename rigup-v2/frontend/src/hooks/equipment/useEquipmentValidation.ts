import { useCallback } from 'react';
import { useEquipmentValidationV2 } from './managers/useEquipmentValidationV2';
import type { Node, Edge } from '@xyflow/react';

/**
 * Legacy compatibility wrapper for useEquipmentValidation
 * 
 * This wrapper maintains the original API while using the new V2 managers internally.
 * This allows existing components to work without modification while we migrate to V2.
 * 
 * @deprecated Use useEquipmentValidationV2 for new code
 */
export const useEquipmentValidation = (jobId?: string, nodes?: Node[], edges?: Edge[]) => {
  const v2Manager = useEquipmentValidationV2(jobId, nodes, edges);
  
  // Legacy API compatibility - pass through all V2 methods
  // The V2 manager already handles the legacy interfaces
  
  return {
    // All V2 methods are available with legacy compatibility
    ...v2Manager,
    
    // Add any additional legacy method aliases if needed
    validateInventoryConsistency: v2Manager.validateInventoryConsistency,
    validateInventoryConsistencyV2: v2Manager.validateInventoryConsistencyV2,
    validateEquipmentAvailability: v2Manager.validateEquipmentAvailability,
    validateAllEquipment: v2Manager.validateAllEquipment,
    quickValidationCheck: v2Manager.quickValidationCheck
  };
};