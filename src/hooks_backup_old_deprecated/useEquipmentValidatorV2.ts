
import { useCallback } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { DetailedEquipmentUsage } from './useEquipmentUsageAnalyzer';

export const useEquipmentValidatorV2 = (jobId: string) => {
  const { data } = useInventory();

  const validateInventoryConsistency = useCallback((usage: DetailedEquipmentUsage) => {
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
    Object.entries(requiredQuantities).forEach(([typeId, required]) => {
      if (typeId === 'customer-equipment') {
        // Special handling for customer computers/tablets
        const deployed = deployedItems
          .filter(item => item.typeId === 'customer-computer' || item.typeId === 'customer-tablet')
          .length;
        
        if (deployed !== required) {
          isConsistent = false;
        }
      } else {
        const deployed = deployedItems
          .filter(item => item.typeId === typeId)
          .length;
        
        if (deployed !== required) {
          isConsistent = false;
        }
      }
    });

    return isConsistent;
  }, [jobId, data.individualEquipment]);

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

    return { issues, warnings };
  }, [data.individualEquipment]);

  return {
    validateInventoryConsistency,
    validateEquipmentAvailability
  };
};
