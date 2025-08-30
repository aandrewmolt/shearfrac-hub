import { IndividualEquipment } from '@/types/inventory';
import { v4 as uuidv4 } from 'uuid';

export const useCreateDefaultIndividualEquipment = () => {
  const createDefaultIndividualEquipment = (): IndividualEquipment[] => {
    const defaultLocation = 'midland-office';
    const equipment: IndividualEquipment[] = [];
    
    // Create 1502 Pressure Gauges (user has these in inventory)
    for (let i = 1; i <= 10; i++) {
      equipment.push({
        id: uuidv4(),
        equipmentId: `PG${i.toString().padStart(3, '0')}`,
        name: `Pressure Gauge ${i.toString().padStart(3, '0')}`,
        typeId: 'pressure-gauge-1502',
        locationId: defaultLocation,
        status: 'available',
        serialNumber: '',
        notes: 'Default equipment',
        lastUpdated: new Date(),
        createdAt: new Date(),
      });
    }
    
    // Create Customer Computers CC01-CC18
    for (let i = 1; i <= 18; i++) {
      equipment.push({
        id: uuidv4(),
        equipmentId: `CC${i.toString().padStart(2, '0')}`,
        name: `Customer Computer ${i.toString().padStart(2, '0')}`,
        typeId: 'customer-computer',
        locationId: defaultLocation,
        status: 'available',
        serialNumber: '',
        notes: 'Default equipment',
        lastUpdated: new Date(),
        createdAt: new Date(),
      });
    }
    
    // Create ShearStream Boxes SS01-SS09
    for (let i = 1; i <= 9; i++) {
      equipment.push({
        id: uuidv4(),
        equipmentId: `SS${i.toString().padStart(2, '0')}`,
        name: `ShearStream Box ${i.toString().padStart(2, '0')}`,
        typeId: 'shearstream-box',
        locationId: defaultLocation,
        status: 'available',
        serialNumber: '',
        notes: 'Default equipment',
        lastUpdated: new Date(),
        createdAt: new Date(),
      });
    }
    
    // Create Starlink SL01-SL09
    for (let i = 1; i <= 9; i++) {
      equipment.push({
        id: uuidv4(),
        equipmentId: `SL${i.toString().padStart(2, '0')}`,
        name: `Starlink-${i.toString().padStart(2, '0')}`,
        typeId: 'starlink',
        locationId: defaultLocation,
        status: 'available',
        serialNumber: '',
        notes: 'Default equipment',
        lastUpdated: new Date(),
        createdAt: new Date(),
      });
    }
    
    // Create Y Adapters (if they need individual tracking)
    for (let i = 1; i <= 15; i++) {
      equipment.push({
        id: uuidv4(),
        equipmentId: `YA${i.toString().padStart(3, '0')}`,
        name: `Y Adapter ${i.toString().padStart(3, '0')}`,
        typeId: 'y-adapter',
        locationId: defaultLocation,
        status: 'available',
        serialNumber: '',
        notes: 'Default equipment',
        lastUpdated: new Date(),
        createdAt: new Date(),
      });
    }
    
    return equipment;
  };
  
  return {
    createDefaultIndividualEquipment
  };
};