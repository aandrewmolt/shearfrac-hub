import { useCallback } from 'react';
import { useInventoryData } from '@/hooks/useInventoryData';
import { useInventory } from '@/contexts/InventoryContext';
import { useComprehensiveEquipmentTracking } from './useComprehensiveEquipmentTracking';
import { DetailedEquipmentUsage } from './useEquipmentUsageAnalyzer';
import { toast } from 'sonner';
import type { Node, Edge } from '@xyflow/react';

/**
 * Consolidated equipment validation hook combining:
 * - useEquipmentValidation (V1)
 * - useEquipmentValidatorV2
 * - useEquipmentAllocationValidator  
 * - useEquipmentAvailabilityChecker
 * - All equipment validation logic
 */
export const useEquipmentValidation = (jobId?: string, nodes?: Node[], edges?: Edge[]) => {
  const { data: legacyData } = useInventoryData();
  const { data } = useInventory();
  const { analyzeEquipmentUsage } = useComprehensiveEquipmentTracking(nodes || [], edges || []);

  // --- V1 VALIDATION METHODS (for legacy bulk equipment) ---

  const validateInventoryConsistency = useCallback(() => {
    if (!jobId || !nodes || !edges) {
      return true; // No validation needed if no job context
    }

    const usage = analyzeEquipmentUsage();
    const deployedItems = legacyData.equipmentItems.filter(
      item => item.status === 'deployed' && item.jobId === jobId
    );

    const inconsistencies: string[] = [];
    const warnings: string[] = [];

    // Check if deployed quantities match diagram requirements
    Object.entries(usage.cables).forEach(([typeId, details]) => {
      const deployed = deployedItems
        .filter(item => item.typeId === typeId)
        .reduce((sum, item) => sum + item.quantity, 0);

      if (deployed !== details.quantity) {
        const equipmentType = legacyData.equipmentTypes.find(type => type.id === typeId);
        if (deployed > details.quantity) {
          warnings.push(
            `${equipmentType?.name}: ${deployed} deployed but only ${details.quantity} required`
          );
        } else {
          inconsistencies.push(
            `${equipmentType?.name}: Diagram requires ${details.quantity}, but only ${deployed} deployed`
          );
        }
      }
    });

    // Check other equipment types
    const equipmentChecks = [
      { typeId: 'pressure-gauge-1502', usage: usage.gauges, name: '1502 Pressure Gauge' },
      { typeId: 'y-adapter', usage: usage.adapters, name: 'Y Adapter' },
      { typeId: 'customer-computer', usage: usage.computers, name: 'Customer Computer' },
      { typeId: 'starlink', usage: usage.satellite, name: 'Starlink' },
    ];

    equipmentChecks.forEach(({ typeId, usage: requiredQuantity, name }) => {
      if (requiredQuantity > 0) {
        const deployed = deployedItems
          .filter(item => item.typeId === typeId)
          .reduce((sum, item) => sum + item.quantity, 0);

        if (deployed !== requiredQuantity) {
          if (deployed > requiredQuantity) {
            warnings.push(
              `${name}: ${deployed} deployed but only ${requiredQuantity} required`
            );
          } else {
            inconsistencies.push(
              `${name}: Diagram requires ${requiredQuantity}, but only ${deployed} deployed`
            );
          }
        }
      }
    });

    // Provide user feedback based on validation results
    if (inconsistencies.length > 0) {
      toast.error(`Equipment shortfalls: ${inconsistencies.length} items need attention`);
      return false;
    }

    if (warnings.length > 0) {
      toast.warning(`Equipment over-allocation: ${warnings.length} items have excess`);
      return true; // Still consistent, just over-allocated
    }

    if (deployedItems.length > 0) {
      toast.success('Equipment allocation is perfectly consistent');
    }

    return true;
  }, [jobId, nodes, edges, analyzeEquipmentUsage, legacyData.equipmentItems, legacyData.equipmentTypes]);

  // --- V2 VALIDATION METHODS (for individual equipment) ---

  const validateInventoryConsistencyV2 = useCallback((usage: DetailedEquipmentUsage) => {
    if (!jobId) return true;

    const deployedItems = data.individualEquipment.filter(
      item => item.status === 'deployed' && item.jobId === jobId
    );

    const requiredQuantities: { [typeId: string]: number } = {};

    // Calculate required quantities
    Object.entries(usage.cables).forEach(([typeId, details]) => {
      requiredQuantities[typeId] = details.quantity;
    });

    // Add other equipment requirements
    if (usage.gauges1502 > 0) requiredQuantities['pressure-gauge-1502'] = usage.gauges1502;
    if (usage.pencilGauges > 0) requiredQuantities['pressure-gauge-pencil'] = usage.pencilGauges;
    if (usage.adapters > 0) requiredQuantities['y-adapter'] = usage.adapters;
    if (usage.shearstreamBoxes > 0) requiredQuantities['shearstream-box'] = usage.shearstreamBoxes;
    if (usage.computers > 0) {
      // For computers, we need to count both customer-computer and customer-tablet
      requiredQuantities['customer-equipment'] = usage.computers;
    }
    if (usage.satellite > 0) requiredQuantities['starlink'] = usage.satellite;

    // Check consistency
    let isConsistent = true;
    const issues: string[] = [];
    
    Object.entries(requiredQuantities).forEach(([typeId, required]) => {
      if (typeId === 'customer-equipment') {
        // Special handling for customer computers/tablets
        const deployed = deployedItems
          .filter(item => item.typeId === 'customer-computer' || item.typeId === 'customer-tablet')
          .length;
        
        if (deployed !== required) {
          isConsistent = false;
          issues.push(`Customer Equipment: required ${required}, deployed ${deployed}`);
        }
      } else {
        const deployed = deployedItems
          .filter(item => item.typeId === typeId)
          .length;
        
        if (deployed !== required) {
          isConsistent = false;
          const typeName = data.equipmentTypes.find(t => t.id === typeId)?.name || typeId;
          issues.push(`${typeName}: required ${required}, deployed ${deployed}`);
        }
      }
    });

    if (!isConsistent) {
      toast.error(`Equipment allocation inconsistency: ${issues.join(', ')}`);
    } else {
      toast.success('Equipment allocation is consistent');
    }

    return isConsistent;
  }, [jobId, data.individualEquipment, data.equipmentTypes]);

  // --- AVAILABILITY VALIDATION ---

  const validateEquipmentAvailability = useCallback((usage: DetailedEquipmentUsage, locationId: string) => {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check cable availability
    Object.entries(usage.cables).forEach(([typeId, details]) => {
      if (details.quantity > 0) {
        const availableEquipment = data.individualEquipment.filter(
          eq => eq.typeId === typeId && eq.locationId === locationId && eq.status === 'available'
        );

        if (availableEquipment.length < details.quantity) {
          issues.push(`Insufficient ${details.typeName} (need ${details.quantity}, have ${availableEquipment.length})`);
        }
      }
    });

    // Check other equipment availability
    const equipmentChecks = [
      { typeId: 'pressure-gauge-1502', quantity: usage.gauges1502 || 0, name: '1502 Pressure Gauge' },
      { typeId: 'pressure-gauge-pencil', quantity: usage.pencilGauges || 0, name: 'Pencil Gauge' },
      { typeId: 'y-adapter', quantity: usage.adapters || 0, name: 'Y Adapter' },
      { typeId: 'shearstream-box', quantity: usage.shearstreamBoxes || 0, name: 'ShearStream Box' },
      { typeId: 'starlink', quantity: usage.satellite || 0, name: 'Starlink' },
    ];

    equipmentChecks.forEach(({ typeId, quantity, name }) => {
      if (quantity > 0) {
        const availableEquipment = data.individualEquipment.filter(
          eq => eq.typeId === typeId && eq.locationId === locationId && eq.status === 'available'
        );

        if (availableEquipment.length < quantity) {
          issues.push(`Insufficient ${name} (need ${quantity}, have ${availableEquipment.length})`);
        }
      }
    });

    // Special check for customer computers/tablets
    if (usage.computers > 0) {
      const availableCustomerEquipment = data.individualEquipment.filter(
        eq => (eq.typeId === 'customer-computer' || eq.typeId === 'customer-tablet') && 
              eq.locationId === locationId && 
              eq.status === 'available'
      );

      if (availableCustomerEquipment.length < usage.computers) {
        issues.push(`Insufficient Customer Computers/Tablets (need ${usage.computers}, have ${availableCustomerEquipment.length})`);
      }
    }

    // Check for bulk equipment availability (legacy)
    Object.entries(usage.cables).forEach(([typeId, details]) => {
      if (details.quantity > 0) {
        const availableBulk = legacyData.equipmentItems?.filter(
          item => item.typeId === details.typeId && item.locationId === locationId && item.status === 'available'
        ) || [];
        
        const totalAvailable = availableBulk.reduce((sum, item) => sum + item.quantity, 0);
        if (totalAvailable < details.quantity) {
          warnings.push(`Insufficient bulk ${details.typeName} (need ${details.quantity}, have ${totalAvailable})`);
        }
      }
    });

    if (issues.length > 0) {
      toast.error(`Availability issues: ${issues.slice(0, 3).join(', ')}${issues.length > 3 ? '...' : ''}`);
    }

    if (warnings.length > 0) {
      toast.warning(`Availability warnings: ${warnings.slice(0, 2).join(', ')}${warnings.length > 2 ? '...' : ''}`);
    }

    return { issues, warnings };
  }, [data.individualEquipment, legacyData.equipmentItems]);

  // --- COMPREHENSIVE VALIDATION ---

  const getEquipmentSummary = () => {
    if (!jobId || !nodes || !edges) {
      return {
        required: { cables: {}, gauges: 0, adapters: 0, computers: 0, satellite: 0 },
        deployed: [],
        isConsistent: true,
        totalRequired: 0,
        totalDeployed: 0,
      };
    }

    const usage = analyzeEquipmentUsage();
    const deployedItems = legacyData.equipmentItems.filter(
      item => item.status === 'deployed' && item.jobId === jobId
    );

    const summary = {
      required: usage,
      deployed: deployedItems,
      isConsistent: validateInventoryConsistency(),
      totalRequired: Object.values(usage.cables).reduce((sum, cable) => sum + cable.quantity, 0) + 
                    usage.gauges + usage.adapters + usage.computers + usage.satellite,
      totalDeployed: deployedItems.reduce((sum, item) => sum + item.quantity, 0),
    };

    return summary;
  };

  const getEquipmentSummaryV2 = useCallback((usage: DetailedEquipmentUsage) => {
    if (!jobId) return null;

    const deployedItems = data.individualEquipment.filter(
      item => item.status === 'deployed' && item.jobId === jobId
    );

    const summary = {
      required: usage,
      deployed: deployedItems,
      isConsistent: validateInventoryConsistencyV2(usage),
      totalRequired: Object.values(usage.cables).reduce((sum, cable) => sum + cable.quantity, 0) + 
                    (usage.gauges1502 || 0) + (usage.pencilGauges || 0) + (usage.adapters || 0) + 
                    (usage.computers || 0) + (usage.satellite || 0) + (usage.shearstreamBoxes || 0),
      totalDeployed: deployedItems.length,
    };

    return summary;
  }, [jobId, data.individualEquipment, validateInventoryConsistencyV2]);

  // --- VALIDATION FIXES ---

  const performQuickValidationFix = async () => {
    const summary = getEquipmentSummary();
    
    if (summary.isConsistent) {
      toast.info('Equipment allocation is already consistent');
      return true;
    }

    toast.info('Use the Quick Allocate feature to resolve equipment issues');
    return false;
  };

  const runFullValidation = async () => {
    if (!jobId) {
      toast.info('No job context available for validation');
      return;
    }

    const isConsistent = validateInventoryConsistency();
    
    if (!isConsistent) {
      await performQuickValidationFix();
    }
  };

  // --- UNIFIED VALIDATION METHOD ---

  const validateAllEquipment = useCallback(async (usage: DetailedEquipmentUsage, locationId: string) => {
    if (!jobId) {
      toast.info('No job context available for validation');
      return { isValid: false, issues: ['No job context'] };
    }

    // Run both V1 and V2 validations
    const consistencyV1 = validateInventoryConsistency();
    const consistencyV2 = validateInventoryConsistencyV2(usage);
    const availability = validateEquipmentAvailability(usage, locationId);

    const isValid = consistencyV1 && consistencyV2 && availability.issues.length === 0;
    const allIssues = [...availability.issues, ...availability.warnings];

    return {
      isValid,
      issues: allIssues,
      consistency: {
        legacy: consistencyV1,
        individual: consistencyV2
      },
      availability: availability
    };
  }, [jobId, validateInventoryConsistency, validateInventoryConsistencyV2, validateEquipmentAvailability]);

  return {
    // V1 validation methods (legacy bulk equipment)
    validateInventoryConsistency,
    getEquipmentSummary,
    performQuickValidationFix,
    runFullValidation,
    
    // V2 validation methods (individual equipment)
    validateInventoryConsistencyV2,
    validateEquipmentAvailability,
    getEquipmentSummaryV2,
    
    // Unified validation
    validateAllEquipment,
    
    // Utility methods
    analyzeEquipmentUsage,
  };
};