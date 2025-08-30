import { offlineDb } from './offlineDatabase';
import { v4 as uuidv4 } from 'uuid';

export const initializeLocalData = async () => {
  try {
    // Check if we already have data
    const equipmentTypesCount = await offlineDb.equipment_types.count();
    const locationsCount = await offlineDb.storage_locations.count();
    
    if (equipmentTypesCount > 0 && locationsCount > 0) {
      console.log('Local data already initialized');
      return;
    }

    console.log('Initializing local data...');
    
    // Create default storage locations
    const locations = [
      {
        id: uuidv4(),
        name: 'Main Warehouse',
        address: '123 Main St',
        isDefault: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Field Storage',
        address: '456 Field Rd',
        isDefault: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    // Create default equipment types
    const equipmentTypes = [
      {
        id: uuidv4(),
        name: 'Shearstream Box',
        category: 'main-equipment',
        description: 'Main control unit',
        requiresIndividualTracking: true,
        defaultIdPrefix: 'SS',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Satellite Box',
        category: 'auxiliary-equipment',
        description: 'Remote satellite unit',
        requiresIndividualTracking: true,
        defaultIdPrefix: 'SAT',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Wellside Gauge',
        category: 'sensors',
        description: 'Pressure monitoring gauge',
        requiresIndividualTracking: true,
        defaultIdPrefix: 'WG',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Y-Adapter',
        category: 'cables',
        description: 'Y-shaped cable adapter',
        requiresIndividualTracking: false,
        defaultIdPrefix: 'Y',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'StarLink Antenna',
        category: 'communication',
        description: 'Satellite internet antenna',
        requiresIndividualTracking: true,
        defaultIdPrefix: 'SL',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Computer',
        category: 'communication',
        description: 'Field computer',
        requiresIndividualTracking: true,
        defaultIdPrefix: 'PC',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    // Add data to database
    await offlineDb.storage_locations.bulkAdd(locations);
    await offlineDb.equipment_types.bulkAdd(equipmentTypes);
    
    console.log('Local data initialized successfully');
  } catch (error) {
    console.error('Error initializing local data:', error);
  }
};