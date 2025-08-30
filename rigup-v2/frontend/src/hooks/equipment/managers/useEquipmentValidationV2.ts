import { useEquipmentInventoryValidator } from './useEquipmentInventoryValidator';
import { useEquipmentAvailabilityValidator } from './useEquipmentAvailabilityValidator';
import type { Node, Edge } from '@xyflow/react';

/**
 * Unified Equipment Validation - Version 2
 * 
 * Replaces the monolithic useEquipmentValidation (366 lines) with focused validators:
 * - Inventory consistency validation
 * - Equipment availability validation
 * - Deployment status validation
 * 
 * Benefits:
 * - Clearer separation of concerns
 * - Better testability
 * - Easier to maintain and extend
 * - Focused error handling
 */
export const useEquipmentValidationV2 = (jobId?: string, nodes?: Node[], edges?: Edge[], locationId?: string) => {
  // Inventory validation manager
  const inventoryValidator = useEquipmentInventoryValidator(jobId, nodes, edges);
  
  // Availability validation manager
  const availabilityValidator = useEquipmentAvailabilityValidator(locationId);

  return {
    // Inventory validation
    ...inventoryValidator,
    
    // Availability validation
    ...availabilityValidator,
    
    // Convenience method for full validation
    validateComplete: async (usage: any, targetLocationId: string) => {
      const inventoryResult = inventoryValidator.validateInventoryConsistencyV2(usage);
      const availabilityResult = availabilityValidator.validateEquipmentAvailability(usage, targetLocationId);
      const deploymentResult = inventoryValidator.validateDeploymentStatus(usage);
      
      return {
        inventory: inventoryResult,
        availability: availabilityResult,
        deployment: deploymentResult,
        
        // Overall status
        isValid: inventoryResult.isValid && availabilityResult.isValid && deploymentResult.isValid,
        canProceed: availabilityResult.canProceed && deploymentResult.isValid,
        
        // Combined summary
        totalIssues: (inventoryResult.totalIssues || 0) + 
                    availabilityResult.issues.length + 
                    deploymentResult.issues.length,
        
        totalErrors: (inventoryResult.errors?.length || 0) + 
                    availabilityResult.summary.errors + 
                    deploymentResult.errorCount,
                    
        totalWarnings: (inventoryResult.warnings?.length || 0) + 
                      availabilityResult.summary.warnings + 
                      deploymentResult.warningCount
      };
    }
  };
};