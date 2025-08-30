
import { useInventoryData, EquipmentType } from '../useInventoryData';
import { useAuditTrail } from '../useAuditTrail';
import { toast } from 'sonner';
import { EquipmentUsage } from './useEquipmentUsageCalculator';

export const useEquipmentTypeManager = () => {
  const { data, updateEquipmentTypes } = useInventoryData();
  const { addAuditEntry } = useAuditTrail();

  const ensureEquipmentTypesExist = (usage: EquipmentUsage) => {
    const typeMapping: { [key: string]: { id: string; name: string; category: string; requiresIndividualTracking: boolean; defaultIdPrefix?: string } } = {
      '100ft': { id: '1', name: '100ft Cable', category: 'cables', requiresIndividualTracking: false },
      '200ft': { id: '2', name: '200ft Cable', category: 'cables', requiresIndividualTracking: false },
      '300ft': { id: '4', name: '300ft Cable (New)', category: 'cables', requiresIndividualTracking: false },
      'gauge': { id: '7', name: '1502 Pressure Gauge', category: 'gauges', requiresIndividualTracking: true, defaultIdPrefix: 'PG' },
      'adapter': { id: '9', name: 'Y Adapter Cable', category: 'adapters', requiresIndividualTracking: false },
      'computer': { id: '11', name: 'Customer Computer', category: 'communication', requiresIndividualTracking: true, defaultIdPrefix: 'CC' },
      'tablet': { id: '14', name: 'Customer Tablet', category: 'communication', requiresIndividualTracking: true, defaultIdPrefix: 'CT' },
      'satellite': { id: '10', name: 'Starlink', category: 'communication', requiresIndividualTracking: true, defaultIdPrefix: 'SL' },
      'shearstream': { id: '15', name: 'ShearStream Box', category: 'communication', requiresIndividualTracking: true, defaultIdPrefix: 'SS' },
    };

    const missingTypes: EquipmentType[] = [];
    
    // Check cables
    Object.keys(usage.cables).forEach(cableType => {
      const typeInfo = typeMapping[cableType];
      if (typeInfo && !data.equipmentTypes.find(t => t.id === typeInfo.id)) {
        missingTypes.push({
          id: typeInfo.id,
          name: typeInfo.name,
          category: typeInfo.category as 'cables' | 'gauges' | 'adapters' | 'communication' | 'power' | 'control-units' | 'it-equipment' | 'other',
          requiresIndividualTracking: typeInfo.requiresIndividualTracking,
          defaultIdPrefix: typeInfo.defaultIdPrefix,
        });
      }
    });

    // Check other equipment types
    const equipmentChecks = [
      { usage: usage.gauges, key: 'gauge' },
      { usage: usage.adapters, key: 'adapter' },
      { usage: usage.computers, key: 'computer' },
      { usage: usage.satellite, key: 'satellite' },
    ];

    equipmentChecks.forEach(({ usage: count, key }) => {
      if (count > 0) {
        const typeInfo = typeMapping[key];
        if (typeInfo && !data.equipmentTypes.find(t => t.id === typeInfo.id)) {
          missingTypes.push({
            id: typeInfo.id,
            name: typeInfo.name,
            category: typeInfo.category as 'cables' | 'gauges' | 'adapters' | 'communication' | 'power' | 'control-units' | 'it-equipment' | 'other',
            requiresIndividualTracking: typeInfo.requiresIndividualTracking,
            defaultIdPrefix: typeInfo.defaultIdPrefix,
          });
        }
      }
    });

    if (missingTypes.length > 0) {
      const updatedTypes = [...data.equipmentTypes, ...missingTypes];
      updateEquipmentTypes(updatedTypes);
      
      // Audit trail for equipment type creation
      missingTypes.forEach(type => {
        addAuditEntry({
          action: 'create',
          entityType: 'type',
          entityId: type.id,
          details: { after: type },
          metadata: { source: 'manual' },
        });
      });
      
      toast.info(`Created ${missingTypes.length} missing equipment types`);
    }
  };

  return {
    ensureEquipmentTypesExist,
  };
};
