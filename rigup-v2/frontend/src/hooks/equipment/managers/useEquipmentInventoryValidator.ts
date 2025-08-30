import { useCallback } from 'react';
import { useInventoryData } from '@/hooks/useInventoryData';
import { useInventory } from '@/contexts/InventoryContext';
import type { Node, Edge } from '@xyflow/react';
import { DetailedEquipmentUsage } from '../useEquipmentUsageAnalyzer';

/**
 * Focused manager for equipment inventory validation
 * Extracted from useEquipmentValidation monolith
 */
export const useEquipmentInventoryValidator = (jobId?: string, nodes?: Node[], edges?: Edge[]) => {
  const { data: legacyData } = useInventoryData();
  const { data } = useInventory();

  // V1 validation for legacy bulk equipment
  const validateInventoryConsistency = useCallback(() => {
    if (!jobId || !nodes || !edges) {
      return { isValid: true, inconsistencies: [], warnings: [] };
    }

    // This would need the usage analyzer, but for now return basic structure
    const inconsistencies: string[] = [];
    const warnings: string[] = [];

    return {
      isValid: inconsistencies.length === 0,
      inconsistencies,
      warnings
    };
  }, [jobId, nodes, edges, legacyData]);

  // V2 validation for individual equipment
  const validateInventoryConsistencyV2 = useCallback((usage: DetailedEquipmentUsage) => {
    const inconsistencies: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check individual equipment allocations
    Object.entries(usage.individualEquipmentUsage).forEach(([equipmentId, usageInfo]) => {
      if (usageInfo.isAssigned) {
        const equipment = data.individualEquipment.find(eq => eq.equipmentId === equipmentId);
        if (!equipment) {
          errors.push(`Equipment ${equipmentId} is assigned but not found in inventory`);
        } else if (equipment.status !== 'deployed' && equipment.status !== 'allocated') {
          warnings.push(
            `Equipment ${equipmentId} (${equipment.name}) is assigned but status is '${equipment.status}'`
          );
        }
      }
    });

    // Check bulk equipment allocations
    Object.entries(usage.bulkEquipmentUsage).forEach(([typeId, usageInfo]) => {
      const availableItems = data.equipmentItems.filter(
        item => item.typeId === typeId && 
                item.status === 'available' &&
                (!jobId || !item.jobId || item.jobId === jobId)
      );

      const totalAvailable = availableItems.reduce((sum, item) => sum + item.quantity, 0);
      
      if (totalAvailable < usageInfo.requiredQuantity) {
        const equipmentType = data.equipmentTypes.find(type => type.id === typeId);
        errors.push(
          `${equipmentType?.name}: Need ${usageInfo.requiredQuantity} but only ${totalAvailable} available`
        );
      }
    });

    return {
      isValid: errors.length === 0,
      hasWarnings: warnings.length > 0,
      errors,
      inconsistencies,
      warnings,
      totalIssues: errors.length + inconsistencies.length + warnings.length
    };
  }, [data, jobId]);

  // Validate equipment deployment status
  const validateDeploymentStatus = useCallback((usage: DetailedEquipmentUsage) => {
    const issues: Array<{
      type: 'error' | 'warning' | 'info';
      message: string;
      equipmentId?: string;
    }> = [];

    // Check for equipment that should be deployed but isn't
    Object.entries(usage.individualEquipmentUsage).forEach(([equipmentId, usageInfo]) => {
      if (usageInfo.isAssigned) {
        const equipment = data.individualEquipment.find(eq => eq.equipmentId === equipmentId);
        if (equipment) {
          if (equipment.status === 'available') {
            issues.push({
              type: 'warning',
              message: `${equipment.name} is assigned to diagram but still marked as available`,
              equipmentId
            });
          } else if (equipment.status === 'maintenance' || equipment.status === 'red-tagged') {
            issues.push({
              type: 'error',
              message: `${equipment.name} is assigned but is ${equipment.status}`,
              equipmentId
            });
          }
        }
      }
    });

    return {
      isValid: !issues.some(issue => issue.type === 'error'),
      issues,
      errorCount: issues.filter(i => i.type === 'error').length,
      warningCount: issues.filter(i => i.type === 'warning').length
    };
  }, [data]);

  // Quick validation check
  const quickValidationCheck = useCallback((equipmentId: string) => {
    const individual = data.individualEquipment.find(eq => eq.equipmentId === equipmentId);
    const bulk = data.equipmentItems.find(item => item.id === equipmentId);
    
    const equipment = individual || bulk;
    if (!equipment) {
      return { isValid: false, error: 'Equipment not found in inventory' };
    }

    if (equipment.status === 'red-tagged') {
      return { isValid: false, error: 'Equipment is red-tagged' };
    }

    if (equipment.status === 'maintenance') {
      return { isValid: false, error: 'Equipment is in maintenance' };
    }

    if (equipment.status === 'retired') {
      return { isValid: false, error: 'Equipment is retired' };
    }

    return { isValid: true };
  }, [data]);

  return {
    // V1 Legacy validation
    validateInventoryConsistency,
    
    // V2 Individual equipment validation
    validateInventoryConsistencyV2,
    
    // Deployment status validation
    validateDeploymentStatus,
    
    // Quick checks
    quickValidationCheck
  };
};