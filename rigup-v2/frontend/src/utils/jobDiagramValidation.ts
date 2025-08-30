import { JobNode } from '@/types/types';
import { IndividualEquipment } from '@/types/equipment';

export interface ValidationResult {
  isValid: boolean;
  orphanedEquipment: string[];
  warnings: string[];
}

/**
 * Validates job diagram nodes against inventory data
 * Identifies equipment IDs referenced in nodes but not found in inventory
 */
export function validateJobDiagramEquipment(
  nodes: JobNode[],
  inventory: IndividualEquipment[]
): ValidationResult {
  const orphanedEquipment: string[] = [];
  const warnings: string[] = [];
  
  // Get all equipment IDs from inventory for quick lookup
  const inventoryEquipmentIds = new Set(inventory.map(eq => eq.equipmentId));
  
  // Check each node for equipment references
  for (const node of nodes) {
    if (node.data.equipmentId) {
      if (!inventoryEquipmentIds.has(node.data.equipmentId)) {
        orphanedEquipment.push(node.data.equipmentId);
        warnings.push(
          `Node "${node.data.label}" (${node.id}) references equipment "${node.data.equipmentId}" which is not found in inventory`
        );
      }
    }
  }
  
  return {
    isValid: orphanedEquipment.length === 0,
    orphanedEquipment: [...new Set(orphanedEquipment)], // Remove duplicates
    warnings
  };
}

/**
 * Cleans orphaned equipment references from job diagram nodes
 * Returns updated nodes with orphaned equipment IDs removed
 */
export function cleanOrphanedEquipmentReferences(
  nodes: JobNode[],
  inventory: IndividualEquipment[]
): { cleanedNodes: JobNode[]; removedCount: number } {
  const inventoryEquipmentIds = new Set(inventory.map(eq => eq.equipmentId));
  let removedCount = 0;
  
  const cleanedNodes = nodes.map(node => {
    if (node.data.equipmentId && !inventoryEquipmentIds.has(node.data.equipmentId)) {
      removedCount++;
      return {
        ...node,
        data: {
          ...node.data,
          equipmentId: undefined,
          assigned: false,
          customName: undefined
        }
      };
    }
    return node;
  });
  
  return { cleanedNodes, removedCount };
}

/**
 * Logs detailed validation results to console for debugging
 */
export function logValidationResults(result: ValidationResult, jobName?: string): void {
  // Validation logging disabled for production
  return;
}