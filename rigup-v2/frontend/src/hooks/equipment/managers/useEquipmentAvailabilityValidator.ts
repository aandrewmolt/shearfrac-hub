import { useCallback } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { toast } from 'sonner';
import { DetailedEquipmentUsage } from '../useEquipmentUsageAnalyzer';

/**
 * Focused manager for equipment availability validation
 * Extracted from useEquipmentValidation monolith
 */
export const useEquipmentAvailabilityValidator = (locationId?: string) => {
  const { data } = useInventory();

  // Validate equipment availability for a specific location
  const validateEquipmentAvailability = useCallback((usage: DetailedEquipmentUsage, targetLocationId: string) => {
    const issues: Array<{
      type: 'error' | 'warning' | 'info';
      category: string;
      message: string;
      equipmentId?: string;
      suggestion?: string;
    }> = [];

    // Check individual equipment availability
    Object.entries(usage.individualEquipmentUsage).forEach(([equipmentId, usageInfo]) => {
      if (usageInfo.isAssigned) {
        const equipment = data.individualEquipment.find(eq => eq.equipmentId === equipmentId);
        
        if (!equipment) {
          issues.push({
            type: 'error',
            category: 'missing',
            message: `Individual equipment ${equipmentId} not found in inventory`,
            equipmentId,
            suggestion: 'Remove from diagram or add to inventory'
          });
          return;
        }

        // Check if equipment is at wrong location
        if (equipment.locationId !== targetLocationId) {
          const currentLocation = data.locations.find(loc => loc.id === equipment.locationId);
          const targetLocation = data.locations.find(loc => loc.id === targetLocationId);
          
          issues.push({
            type: 'warning',
            category: 'location',
            message: `${equipment.name} is at ${currentLocation?.name || 'unknown location'} but needed at ${targetLocation?.name || 'unknown location'}`,
            equipmentId,
            suggestion: 'Transfer equipment or use local alternative'
          });
        }

        // Check availability status
        if (equipment.status !== 'available' && equipment.status !== 'allocated') {
          const statusMessages = {
            'deployed': 'already deployed to another job',
            'maintenance': 'currently in maintenance',
            'red-tagged': 'red-tagged and unavailable',
            'retired': 'retired and cannot be used'
          };
          
          issues.push({
            type: equipment.status === 'red-tagged' || equipment.status === 'retired' ? 'error' : 'warning',
            category: 'status',
            message: `${equipment.name} is ${statusMessages[equipment.status as keyof typeof statusMessages] || equipment.status}`,
            equipmentId,
            suggestion: equipment.status === 'deployed' ? 'Find alternative equipment' : 'Resolve status issue first'
          });
        }
      }
    });

    // Check bulk equipment availability
    Object.entries(usage.bulkEquipmentUsage).forEach(([typeId, usageInfo]) => {
      const equipmentType = data.equipmentTypes.find(type => type.id === typeId);
      const availableItems = data.equipmentItems.filter(item => 
        item.typeId === typeId && 
        item.locationId === targetLocationId &&
        item.status === 'available'
      );

      const totalAvailable = availableItems.reduce((sum, item) => sum + item.quantity, 0);
      
      if (totalAvailable < usageInfo.requiredQuantity) {
        const shortage = usageInfo.requiredQuantity - totalAvailable;
        
        // Check if equipment is available at other locations
        const otherLocations = data.equipmentItems.filter(item =>
          item.typeId === typeId && 
          item.locationId !== targetLocationId &&
          item.status === 'available'
        );
        
        const otherTotal = otherLocations.reduce((sum, item) => sum + item.quantity, 0);
        
        issues.push({
          type: otherTotal >= shortage ? 'warning' : 'error',
          category: 'quantity',
          message: `${equipmentType?.name}: Need ${usageInfo.requiredQuantity}, only ${totalAvailable} available at location`,
          suggestion: otherTotal >= shortage 
            ? `Transfer ${shortage} from other locations` 
            : `Need to source additional ${shortage} units`
        });
      }
    });

    return {
      isValid: !issues.some(issue => issue.type === 'error'),
      canProceed: issues.filter(issue => issue.type === 'error').length === 0,
      issues,
      summary: {
        total: issues.length,
        errors: issues.filter(i => i.type === 'error').length,
        warnings: issues.filter(i => i.type === 'warning').length,
        byCategory: {
          missing: issues.filter(i => i.category === 'missing').length,
          location: issues.filter(i => i.category === 'location').length,
          status: issues.filter(i => i.category === 'status').length,
          quantity: issues.filter(i => i.category === 'quantity').length
        }
      }
    };
  }, [data]);

  // Validate complete equipment allocation
  const validateAllEquipment = useCallback(async (usage: DetailedEquipmentUsage, targetLocationId: string) => {
    const validationResult = validateEquipmentAvailability(usage, targetLocationId);
    
    // Show toast notifications for critical issues
    if (validationResult.summary.errors > 0) {
      toast.error(`${validationResult.summary.errors} critical equipment issues found`, {
        description: 'Please resolve errors before proceeding with job'
      });
    } else if (validationResult.summary.warnings > 0) {
      toast.warning(`${validationResult.summary.warnings} equipment warnings found`, {
        description: 'Review warnings before proceeding'
      });
    } else {
      toast.success('All equipment validated successfully', {
        description: 'Equipment is available and ready for deployment'
      });
    }

    return validationResult;
  }, [validateEquipmentAvailability]);

  // Quick availability check for single equipment
  const checkSingleEquipmentAvailability = useCallback((equipmentId: string) => {
    const individual = data.individualEquipment.find(eq => eq.equipmentId === equipmentId);
    const bulk = data.equipmentItems.find(item => item.id === equipmentId);
    
    const equipment = individual || bulk;
    if (!equipment) {
      return { 
        available: false, 
        reason: 'Equipment not found',
        severity: 'error' as const
      };
    }

    if (equipment.status === 'available') {
      return { 
        available: true, 
        reason: 'Available for deployment',
        severity: 'success' as const
      };
    }

    if (equipment.status === 'allocated') {
      return { 
        available: true, 
        reason: 'Already allocated but can be deployed',
        severity: 'info' as const
      };
    }

    const reasonMap = {
      'deployed': 'Already deployed to another job',
      'maintenance': 'Currently in maintenance',
      'red-tagged': 'Equipment is red-tagged',
      'retired': 'Equipment is retired'
    };

    return {
      available: false,
      reason: reasonMap[equipment.status as keyof typeof reasonMap] || `Status: ${equipment.status}`,
      severity: (equipment.status === 'red-tagged' || equipment.status === 'retired') ? 'error' as const : 'warning' as const
    };
  }, [data]);

  // Get equipment alternatives
  const getEquipmentAlternatives = useCallback((typeId: string, excludeLocationId?: string) => {
    const equipmentType = data.equipmentTypes.find(t => t.id === typeId);
    if (!equipmentType) return [];

    // For individual equipment, find others of same type
    const individualAlternatives = data.individualEquipment.filter(eq => 
      eq.typeId === typeId &&
      eq.status === 'available' &&
      (!excludeLocationId || eq.locationId !== excludeLocationId)
    );

    // For bulk equipment, find available stock
    const bulkAlternatives = data.equipmentItems.filter(item =>
      item.typeId === typeId &&
      item.status === 'available' &&
      item.quantity > 0 &&
      (!excludeLocationId || item.locationId !== excludeLocationId)
    );

    return {
      individual: individualAlternatives.map(eq => ({
        equipmentId: eq.equipmentId,
        name: eq.name,
        location: data.locations.find(loc => loc.id === eq.locationId)?.name,
        locationId: eq.locationId
      })),
      bulk: bulkAlternatives.map(item => ({
        id: item.id,
        quantity: item.quantity,
        location: data.locations.find(loc => loc.id === item.locationId)?.name,
        locationId: item.locationId
      }))
    };
  }, [data]);

  return {
    // Core validation
    validateEquipmentAvailability,
    validateAllEquipment,
    
    // Quick checks
    checkSingleEquipmentAvailability,
    
    // Alternatives
    getEquipmentAlternatives
  };
};