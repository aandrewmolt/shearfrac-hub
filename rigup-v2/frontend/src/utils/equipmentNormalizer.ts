import { StandardizedEquipment, EquipmentType, StorageLocation } from '@/types/equipment';

/**
 * Normalizes equipment data from various sources into a standardized format
 */
export function normalizeEquipment(equipment: any): StandardizedEquipment {
  // Handle null/undefined
  if (!equipment) {
    throw new Error('Equipment data is null or undefined');
  }

  return {
    id: equipment.id || '',
    equipmentId: equipment.equipmentId || equipment.equipment_id || equipment.EquipmentId || '',
    name: equipment.name || equipment.Name || equipment.equipmentName || '',
    // Normalize typeId from various possible fields
    typeId: equipment.typeId || 
            equipment.equipmentTypeId || 
            equipment.Type || 
            equipment.type_id || 
            equipment.equipment_type_id || 
            '',
    // Normalize locationId from various possible fields
    locationId: equipment.locationId || 
                equipment.storageLocationId || 
                equipment.location_id || 
                equipment.storage_location_id || 
                '',
    status: normalizeStatus(equipment.status || equipment.Status || 'available'),
    jobId: equipment.jobId || equipment.job_id || equipment.JobId || undefined,
    serialNumber: equipment.serialNumber || equipment.serial_number || equipment.SerialNumber || undefined,
    purchaseDate: equipment.purchaseDate || equipment.purchase_date || equipment.PurchaseDate || undefined,
    warrantyExpiry: equipment.warrantyExpiry || equipment.warranty_expiry || equipment.WarrantyExpiry || undefined,
    notes: equipment.notes || equipment.Notes || undefined,
    redTagReason: equipment.redTagReason || equipment.red_tag_reason || undefined,
    redTagPhoto: equipment.redTagPhoto || equipment.red_tag_photo || undefined,
    locationType: equipment.locationType || equipment.location_type || 'storage',
    createdAt: equipment.createdAt || 
               equipment.created_at || 
               equipment.createdDate || 
               equipment.created_date || 
               new Date().toISOString(),
    updatedAt: equipment.updatedAt || 
               equipment.updated_at || 
               equipment.lastUpdatedDate || 
               equipment.last_updated_date || 
               new Date().toISOString()
  };
}

/**
 * Normalizes equipment status to valid values
 */
function normalizeStatus(status: string): 'available' | 'deployed' | 'maintenance' | 'red-tagged' {
  const normalizedStatus = status.toLowerCase().trim();
  
  switch (normalizedStatus) {
    case 'available':
      return 'available';
    case 'deployed':
    case 'in use':
    case 'in-use':
    case 'allocated':
      return 'deployed';
    case 'maintenance':
    case 'repair':
    case 'servicing':
      return 'maintenance';
    case 'red-tagged':
    case 'red tagged':
    case 'redtagged':
    case 'damaged':
      return 'red-tagged';
    default:
      console.warn(`Unknown status "${status}" defaulting to "available"`);
      return 'available';
  }
}

/**
 * Normalizes an array of equipment
 */
export function normalizeEquipmentArray(equipmentArray: any[]): StandardizedEquipment[] {
  if (!Array.isArray(equipmentArray)) {
    console.warn('Expected array for equipment normalization, received:', typeof equipmentArray);
    return [];
  }
  
  return equipmentArray
    .filter(item => item != null) // Filter out null/undefined items
    .map(item => {
      try {
        return normalizeEquipment(item);
      } catch (error) {
        console.error('Failed to normalize equipment item:', item, error);
        return null;
      }
    })
    .filter(item => item !== null) as StandardizedEquipment[];
}

/**
 * Normalizes equipment type data
 */
export function normalizeEquipmentType(type: any): EquipmentType {
  if (!type) {
    throw new Error('Equipment type data is null or undefined');
  }

  return {
    id: type.id || '',
    name: type.name || type.Name || '',
    category: type.category || type.Category || 'other',
    description: type.description || type.Description || undefined,
    requiresIndividualTracking: 
      type.requiresIndividualTracking || 
      type.requires_individual_tracking || 
      type.RequiresIndividualTracking || 
      false,
    defaultIdPrefix: 
      type.defaultIdPrefix || 
      type.default_id_prefix || 
      type.DefaultIdPrefix || 
      undefined
  };
}

/**
 * Normalizes storage location data
 */
export function normalizeStorageLocation(location: any): StorageLocation {
  if (!location) {
    throw new Error('Storage location data is null or undefined');
  }

  return {
    id: location.id || '',
    name: location.name || location.Name || '',
    address: location.address || location.Address || undefined,
    isDefault: 
      location.isDefault || 
      location.is_default || 
      location.IsDefault || 
      false,
    createdAt: location.createdAt || location.created_at || undefined,
    updatedAt: location.updatedAt || location.updated_at || undefined
  };
}

/**
 * Checks if equipment matches a specific type
 */
export function equipmentMatchesType(
  equipment: StandardizedEquipment, 
  typeId: string, 
  equipmentTypes: EquipmentType[]
): boolean {
  // Direct type ID match
  if (equipment.typeId === typeId) {
    return true;
  }
  
  // Check if the equipment's type name matches the requested type's name
  const equipmentType = equipmentTypes.find(t => t.id === equipment.typeId);
  const requestedType = equipmentTypes.find(t => t.id === typeId);
  
  if (equipmentType && requestedType) {
    return equipmentType.name === requestedType.name;
  }
  
  return false;
}

/**
 * Checks if equipment is at a specific location
 */
export function isEquipmentAtLocation(
  equipment: StandardizedEquipment,
  locationId: string,
  locationType?: 'storage' | 'job'
): boolean {
  if (locationType === 'job') {
    return equipment.jobId === locationId;
  }
  
  return equipment.locationId === locationId;
}

/**
 * Gets available equipment count for a specific type at a location
 */
export function getAvailableEquipmentCount(
  equipment: StandardizedEquipment[],
  typeId: string,
  locationId: string,
  equipmentTypes: EquipmentType[]
): number {
  return equipment.filter(item => 
    item.status === 'available' &&
    equipmentMatchesType(item, typeId, equipmentTypes) &&
    isEquipmentAtLocation(item, locationId, 'storage')
  ).length;
}

/**
 * Groups equipment by type
 */
export function groupEquipmentByType(
  equipment: StandardizedEquipment[]
): Record<string, StandardizedEquipment[]> {
  return equipment.reduce((groups, item) => {
    const typeId = item.typeId;
    if (!groups[typeId]) {
      groups[typeId] = [];
    }
    groups[typeId].push(item);
    return groups;
  }, {} as Record<string, StandardizedEquipment[]>);
}

/**
 * Filters equipment by multiple criteria
 */
export interface EquipmentFilter {
  typeId?: string;
  locationId?: string;
  status?: 'available' | 'deployed' | 'maintenance' | 'red-tagged';
  jobId?: string;
}

export function filterEquipment(
  equipment: StandardizedEquipment[],
  filters: EquipmentFilter,
  equipmentTypes?: EquipmentType[]
): StandardizedEquipment[] {
  return equipment.filter(item => {
    if (filters.typeId && equipmentTypes) {
      if (!equipmentMatchesType(item, filters.typeId, equipmentTypes)) {
        return false;
      }
    } else if (filters.typeId && item.typeId !== filters.typeId) {
      return false;
    }
    
    if (filters.locationId && !isEquipmentAtLocation(item, filters.locationId, 'storage')) {
      return false;
    }
    
    if (filters.status && item.status !== filters.status) {
      return false;
    }
    
    if (filters.jobId && item.jobId !== filters.jobId) {
      return false;
    }
    
    return true;
  });
}