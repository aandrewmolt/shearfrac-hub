
import { useInventory } from '@/contexts/InventoryContext';
import { DetailedEquipmentUsage } from './useEquipmentUsageAnalyzer';

interface AvailabilityValidation {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  availability: { [typeId: string]: { required: number; available: number; sufficient: boolean } };
}

export const useEquipmentAvailabilityChecker = () => {
  const { data } = useInventory();

  const validateEquipmentAvailability = (usage: DetailedEquipmentUsage, locationId: string): AvailabilityValidation => {
    const validation: AvailabilityValidation = {
      isValid: true,
      issues: [],
      warnings: [],
      availability: {}
    };

    // Check cable availability - all cables are now individual items
    Object.entries(usage.cables).forEach(([typeId, details]) => {
      const availableEquipment = data.individualEquipment.filter(
        item => 
          item.typeId === typeId && 
          item.locationId === locationId && 
          item.status === 'available'
      );

      const availableQuantity = availableEquipment.length;
      const required = details.quantity;

      validation.availability[typeId] = {
        required,
        available: availableQuantity,
        sufficient: availableQuantity >= required
      };

      if (availableQuantity < required) {
        validation.isValid = false;
        validation.issues.push(`Insufficient ${details.typeName}: need ${required}, have ${availableQuantity}`);
      } else if (availableQuantity === required) {
        validation.warnings.push(`Exact quantity available for ${details.typeName}: ${availableQuantity}`);
      }
    });

    // Check other equipment availability - all are individual items
    const equipmentChecks = [
      { typeId: 'pressure-gauge-1502', quantity: usage.gauges1502 || 0, name: '1502 Pressure Gauge' },
      { typeId: 'pressure-gauge-pencil', quantity: usage.pencilGauges || 0, name: 'Pencil Gauge' },
      { typeId: 'y-adapter', quantity: usage.adapters || 0, name: 'Y Adapter' },
      { typeId: 'shearstream-box', quantity: usage.shearstreamBoxes || 0, name: 'ShearStream Box' },
      { typeId: 'customer-computer', quantity: usage.computers || 0, name: 'Customer Computer' },
      { typeId: 'customer-tablet', quantity: 0, name: 'Customer Tablet' }, // Combined with computers
      { typeId: 'starlink', quantity: usage.satellite || 0, name: 'Starlink' },
    ];

    equipmentChecks.forEach(({ typeId, quantity, name }) => {
      if (quantity > 0) {
        const availableEquipment = data.individualEquipment.filter(
          item => 
            item.typeId === typeId && 
            item.locationId === locationId && 
            item.status === 'available'
        );
        
        const availableQuantity = availableEquipment.length;

        validation.availability[typeId] = {
          required: quantity,
          available: availableQuantity,
          sufficient: availableQuantity >= quantity
        };

        if (availableQuantity < quantity) {
          validation.isValid = false;
          validation.issues.push(`Insufficient ${name}: need ${quantity}, have ${availableQuantity}`);
        }
      }
    });

    // Special handling for customer computers/tablets - they can be used interchangeably
    if (usage.computers > 0) {
      const availableCustomerEquipment = data.individualEquipment.filter(
        item => 
          (item.typeId === 'customer-computer' || item.typeId === 'customer-tablet') &&
          item.locationId === locationId && 
          item.status === 'available'
      );
      
      const totalAvailable = availableCustomerEquipment.length;
      
      if (totalAvailable < usage.computers) {
        validation.isValid = false;
        validation.issues.push(`Insufficient Customer Computers/Tablets: need ${usage.computers}, have ${totalAvailable}`);
      }
    }

    return validation;
  };

  return {
    validateEquipmentAvailability
  };
};
