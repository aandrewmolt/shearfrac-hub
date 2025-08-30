import { apiClient } from '@/services/api.client';
import { equipmentCache } from '@/services/equipmentCache';

// Script to add 5 Starlink units to inventory
export async function addStarlinkEquipment() {
  try {
    console.log('🛰️ Adding Starlink equipment to inventory...');
    
    // First, check if Starlink equipment type exists
    const equipmentTypes = await equipmentCache.get('script-equipment-types', () => apiClient.getEquipment());
    
    // Handle case where equipmentTypes might be undefined or not an array
    if (!equipmentTypes || !Array.isArray(equipmentTypes)) {
      console.log('No equipment types found or invalid response');
      return;
    }
    
    let starlinkType = equipmentTypes.find((type: any) => 
      type && (type.name === 'Starlink' || type.name === 'starlink')
    );
    
    // Create equipment type if it doesn't exist
    if (!starlinkType) {
      console.log('Creating Starlink equipment type...');
      starlinkType = await apiClient.createEquipment({
        name: 'Starlink',
        category: 'communications',
        description: 'Satellite internet system',
        manufacturer: 'SpaceX',
        model: 'Starlink V2',
        specifications: {
          type: 'satellite-internet',
          bandwidth: '100-200 Mbps',
          latency: '20-40ms'
        }
      });
      // Invalidate cache after creating new equipment type
      equipmentCache.invalidate('script-equipment-types');
    }
    
    // Get or create a storage location
    const storageLocations = await equipmentCache.get('script-storage-locations', () => apiClient.request('/api/storage-locations'));
    
    // Handle case where storageLocations might be undefined or not an array
    if (!storageLocations || !Array.isArray(storageLocations)) {
      console.log('No storage locations found or invalid response');
      return;
    }
    
    let mainStorage = storageLocations.find((loc: any) => 
      loc && (loc.name === 'Main Storage' || loc.name === 'Warehouse')
    );
    
    if (!mainStorage) {
      console.log('Creating Main Storage location...');
      mainStorage = await apiClient.request('/api/storage-locations', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Main Storage',
          type: 'warehouse',
          address: '123 Storage Way',
          isDefault: true
        })
      });
      // Invalidate cache after creating new storage location
      equipmentCache.invalidate('script-storage-locations');
    }
    
    // Add 5 Starlink units
    console.log('Adding 5 Starlink units to inventory...');
    const units = [];
    for (let i = 1; i <= 5; i++) {
      const unit = await apiClient.createEquipment({
        equipment_type_id: starlinkType.id,
        serial_number: `SL-2024-${String(i).padStart(3, '0')}`,
        status: 'available',
        storage_location_id: mainStorage.id,
        purchase_date: new Date().toISOString(),
        purchase_price: 2500,
        notes: `Starlink unit ${i} of 5`
      });
      units.push(unit);
      console.log(`✅ Added Starlink unit ${i}: ${unit.serial_number}`);
      // Invalidate equipment cache after each creation
      equipmentCache.invalidate('script-equipment-types');
    }
    
    console.log('🎉 Successfully added 5 Starlink units to inventory!');
    return units;
    
  } catch (error) {
    console.error('❌ Error adding Starlink equipment:', error);
    throw error;
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addStarlinkEquipment()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}