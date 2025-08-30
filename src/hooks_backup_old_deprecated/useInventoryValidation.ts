
import { useCallback } from 'react';
import { EquipmentItem, IndividualEquipment, EquipmentType } from '@/types/inventory';
import { toast } from 'sonner';

export const useInventoryValidation = () => {
  const validateEquipmentConsistency = useCallback((
    equipmentItems: EquipmentItem[],
    individualEquipment: IndividualEquipment[],
    equipmentTypes: EquipmentType[]
  ) => {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check for orphaned equipment (equipment without valid types)
    const typeIds = new Set(equipmentTypes.map(t => t.id));
    
    const orphanedItems = equipmentItems.filter(item => !typeIds.has(item.typeId));
    const orphanedIndividual = individualEquipment.filter(eq => !typeIds.has(eq.typeId));
    
    if (orphanedItems.length > 0) {
      issues.push(`${orphanedItems.length} equipment items reference non-existent types`);
    }
    
    if (orphanedIndividual.length > 0) {
      issues.push(`${orphanedIndividual.length} individual equipment items reference non-existent types`);
    }

    // Check for duplicate individual equipment IDs
    const individualIds = individualEquipment.map(eq => eq.equipmentId);
    const duplicateIds = individualIds.filter((id, index) => individualIds.indexOf(id) !== index);
    
    if (duplicateIds.length > 0) {
      issues.push(`Duplicate individual equipment IDs found: ${[...new Set(duplicateIds)].join(', ')}`);
    }

    // Check for equipment types that require individual tracking but have bulk items
    const typesRequiringIndividual = equipmentTypes.filter(t => t.requiresIndividualTracking);
    const problemTypes = typesRequiringIndividual.filter(type => 
      equipmentItems.some(item => item.typeId === type.id)
    );
    
    if (problemTypes.length > 0) {
      warnings.push(`Types requiring individual tracking have bulk items: ${problemTypes.map(t => t.name).join(', ')}`);
    }

    // Check for negative quantities
    const negativeQuantities = equipmentItems.filter(item => item.quantity < 0);
    if (negativeQuantities.length > 0) {
      issues.push(`${negativeQuantities.length} equipment items have negative quantities`);
    }

    // Check for equipment with invalid status
    const validStatuses = ['available', 'deployed', 'red-tagged', 'maintenance', 'retired'];
    const invalidStatusItems = [
      ...equipmentItems.filter(item => !validStatuses.includes(item.status)),
      ...individualEquipment.filter(eq => !validStatuses.includes(eq.status))
    ];
    
    if (invalidStatusItems.length > 0) {
      issues.push(`${invalidStatusItems.length} items have invalid status values`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      warnings,
      totalIssues: issues.length,
      totalWarnings: warnings.length
    };
  }, []);

  const autoFixIssues = useCallback((
    equipmentItems: EquipmentItem[],
    individualEquipment: IndividualEquipment[],
    equipmentTypes: EquipmentType[]
  ) => {
    let fixedItems = [...equipmentItems];
    let fixedIndividual = [...individualEquipment];
    const fixes: string[] = [];

    // Fix negative quantities
    fixedItems = fixedItems.map(item => {
      if (item.quantity < 0) {
        fixes.push(`Fixed negative quantity for ${item.id}`);
        return { ...item, quantity: 0 };
      }
      return item;
    });

    // Fix invalid statuses
    const validStatuses = ['available', 'deployed', 'red-tagged', 'maintenance', 'retired'];
    
    fixedItems = fixedItems.map(item => {
      if (!validStatuses.includes(item.status)) {
        fixes.push(`Fixed invalid status for equipment item ${item.id}`);
        return { ...item, status: 'available' as const };
      }
      return item;
    });

    fixedIndividual = fixedIndividual.map(eq => {
      if (!validStatuses.includes(eq.status)) {
        fixes.push(`Fixed invalid status for individual equipment ${eq.equipmentId}`);
        return { ...eq, status: 'available' as const };
      }
      return eq;
    });

    // Remove orphaned equipment
    const typeIds = new Set(equipmentTypes.map(t => t.id));
    
    const originalItemCount = fixedItems.length;
    fixedItems = fixedItems.filter(item => typeIds.has(item.typeId));
    if (fixedItems.length !== originalItemCount) {
      fixes.push(`Removed ${originalItemCount - fixedItems.length} orphaned equipment items`);
    }

    const originalIndividualCount = fixedIndividual.length;
    fixedIndividual = fixedIndividual.filter(eq => typeIds.has(eq.typeId));
    if (fixedIndividual.length !== originalIndividualCount) {
      fixes.push(`Removed ${originalIndividualCount - fixedIndividual.length} orphaned individual equipment`);
    }

    if (fixes.length > 0) {
      toast.success(`Applied ${fixes.length} automatic fixes to inventory data`);
      console.log('Inventory fixes applied:', fixes);
    }

    return {
      equipmentItems: fixedItems,
      individualEquipment: fixedIndividual,
      fixes
    };
  }, []);

  const validateBeforeSave = useCallback((data: unknown) => {
    const validation = validateEquipmentConsistency(
      data.equipmentItems,
      data.individualEquipment,
      data.equipmentTypes
    );

    if (!validation.isValid) {
      toast.error(`Cannot save: ${validation.totalIssues} validation issues found`);
      return false;
    }

    if (validation.totalWarnings > 0) {
      toast.warning(`${validation.totalWarnings} warnings found - review recommended`);
    }

    return true;
  }, [validateEquipmentConsistency]);

  return {
    validateEquipmentConsistency,
    autoFixIssues,
    validateBeforeSave
  };
};
