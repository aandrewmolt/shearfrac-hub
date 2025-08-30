
import { EquipmentType } from '@/types/inventory';

export const useEquipmentIdGenerator = () => {
  const generateEquipmentId = (equipmentType: EquipmentType, counter: number): string => {
    const prefix = equipmentType.defaultIdPrefix || '';
    
    // Correct padding for different equipment types
    if (prefix === 'SS') {
      // ShearStream: 4 digits (SS0001, SS0002, SS0010, SS0100, SS1000)
      return `${prefix}${counter.toString().padStart(4, '0')}`;
    } else if (prefix === 'CC' || prefix === 'CT') {
      // Company Computer, Customer Tablet: 2 digits (CC01, CT01)
      return `${prefix}${counter.toString().padStart(2, '0')}`;
    } else if (prefix === 'SL') {
      // Starlink: 2 digits (SL01, SL02)
      return `${prefix}${counter.toString().padStart(2, '0')}`;
    } else if (prefix === 'PG' || prefix === 'BP') {
      // Pressure Gauge, Battery Pack: 3 digits (PG001, BP001)
      return `${prefix}${counter.toString().padStart(3, '0')}`;
    } else {
      // Default: 3 digits for any other equipment
      return `${prefix}${counter.toString().padStart(3, '0')}`;
    }
  };

  const generateEquipmentName = (equipmentType: EquipmentType, id: string): string => {
    // Extract number part consistently based on prefix length
    const prefix = id.substring(0, 2);
    const numberPart = id.substring(2);
    
    if (equipmentType.name === 'Customer Computer' || equipmentType.name === 'Company Computer') {
      return `Customer Computer ${numberPart}`;
    }
    
    if (equipmentType.name === 'Customer Tablet') {
      return `Customer Tablet ${numberPart}`;
    }
    
    if (equipmentType.name === 'Starlink') {
      return `Starlink-${numberPart}`;
    }
    
    if (equipmentType.name === 'ShearStream Box') {
      return `ShearStream-${numberPart}`;
    }
    
    if (equipmentType.name === '1502 Pressure Gauge') {
      return `Pressure Gauge ${numberPart}`;
    }
    
    if (equipmentType.name === 'Battery Pack') {
      return `Battery Pack ${numberPart}`;
    }
    
    return `${equipmentType.name} ${numberPart}`;
  };

  const getIdFormat = (equipmentType: EquipmentType): string => {
    const prefix = equipmentType.defaultIdPrefix || '';
    
    if (prefix === 'SS') {
      return `${prefix}#### (e.g., ${prefix}0001)`;
    } else if (prefix === 'SL' || prefix === 'CC' || prefix === 'CT') {
      return `${prefix}## (e.g., ${prefix}01)`;
    } else {
      return `${prefix}### (e.g., ${prefix}001)`;
    }
  };

  return {
    generateEquipmentId,
    generateEquipmentName,
    getIdFormat
  };
};
