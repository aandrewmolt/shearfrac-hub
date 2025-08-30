
import { useCallback } from 'react';
import { useInventoryData } from '@/hooks/useInventoryData';
import { ValidationIssue, ValidationResult } from '@/types/validation';

export const useEquipmentValidator = () => {
  const { data } = useInventoryData();

  const validateEquipmentConsistency = useCallback((): ValidationResult => {
    const issues: ValidationIssue[] = [];

    // Check for orphaned deployments (deployed items without valid job references)
    data.equipmentItems.forEach(item => {
      if (item.status === 'deployed' && item.jobId) {
        // In a real implementation, we'd check against actual job data
        // For now, we'll validate basic data integrity
        const equipmentType = data.equipmentTypes.find(type => type.id === item.typeId);
        const location = data.storageLocations.find(loc => loc.id === item.locationId);
        
        if (!equipmentType || !location) {
          issues.push({
            id: `orphaned-${item.id}`,
            type: 'orphaned_deployment',
            severity: 'error',
            equipmentTypeId: item.typeId,
            locationId: item.locationId,
            jobId: item.jobId,
            message: `Deployed ${equipmentType?.name || 'Unknown'} has invalid references`,
            expectedValue: 0,
            actualValue: item.quantity,
            suggestedAction: 'manual_review'
          });
        }
      }
    });

    // Check for individual equipment tracking consistency
    data.storageLocations.forEach(location => {
      data.equipmentTypes.forEach(type => {
        if (type.requiresIndividualTracking) {
          // For individually tracked equipment, check bulk vs individual counts
          const bulkItems = data.equipmentItems.filter(
            item => item.typeId === type.id && item.locationId === location.id
          );
          const individualItems = data.individualEquipment.filter(
            eq => eq.typeId === type.id && eq.locationId === location.id
          );

          const totalBulkQuantity = bulkItems.reduce((sum, item) => sum + item.quantity, 0);
          const individualCount = individualItems.length;

          // For individually tracked equipment, there should be NO bulk quantities
          if (totalBulkQuantity > 0) {
            issues.push({
              id: `bulk-on-individual-${type.id}-${location.id}`,
              type: 'data_inconsistency',
              severity: 'error',
              equipmentTypeId: type.id,
              locationId: location.id,
              message: `${type.name} at ${location.name} has bulk quantities but requires individual tracking`,
              expectedValue: 0,
              actualValue: totalBulkQuantity,
              suggestedAction: 'update_inventory'
            });
          }

          // Check if individual count matches what would be expected
          if (individualCount !== totalBulkQuantity && totalBulkQuantity > 0) {
            issues.push({
              id: `individual-mismatch-${type.id}-${location.id}`,
              type: 'quantity_mismatch',
              severity: 'warning',
              equipmentTypeId: type.id,
              locationId: location.id,
              message: `Individual tracking count doesn't match bulk quantity for ${type.name}`,
              expectedValue: individualCount,
              actualValue: totalBulkQuantity,
              suggestedAction: 'update_inventory'
            });
          }
        } else {
          // For bulk tracked equipment, check for negative quantities
          const availableItems = data.equipmentItems.filter(
            item => item.typeId === type.id && item.locationId === location.id && item.status === 'available'
          );
          const totalAvailable = availableItems.reduce((sum, item) => sum + item.quantity, 0);

          if (totalAvailable < 0) {
            issues.push({
              id: `negative-${type.id}-${location.id}`,
              type: 'data_inconsistency',
              severity: 'error',
              equipmentTypeId: type.id,
              locationId: location.id,
              message: `Negative quantity detected for ${type.name} at ${location.name}`,
              expectedValue: 0,
              actualValue: totalAvailable,
              suggestedAction: 'update_inventory'
            });
          }
        }
      });
    });

    const result: ValidationResult = {
      isValid: issues.length === 0,
      issues,
      summary: {
        totalIssues: issues.length,
        criticalIssues: issues.filter(issue => issue.severity === 'error').length,
        autoFixableIssues: issues.filter(issue => issue.suggestedAction === 'update_inventory').length,
      }
    };

    return result;
  }, [data]);

  return {
    validateEquipmentConsistency,
  };
};
