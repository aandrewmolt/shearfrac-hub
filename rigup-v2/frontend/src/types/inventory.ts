
export interface EquipmentType {
  id: string;
  name: string;
  category: 'cables' | 'gauges' | 'adapters' | 'communication' | 'power' | 'other';
  description?: string;
  defaultIdPrefix?: string;
}

export interface StorageLocation {
  id: string;
  name: string;
  address?: string;
  isDefault: boolean;
}

export interface IndividualEquipment {
  id: string;
  equipmentId: string; // User-defined ID like "SS-001"
  name?: string; // User-friendly name
  equipmentTypeId: string; // Consistent naming with database
  storageLocationId: string; // Consistent naming with database
  status: 'available' | 'deployed' | 'maintenance' | 'red-tagged' | 'retired';
  serialNumber?: string;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  notes?: string;
  redTagReason?: string;
  redTagPhoto?: string;
  phoneNumber?: string; // For backward compatibility
  phone?: string; // For backward compatibility
  lastUpdatedDate: string; // Consistent with database format
  
  // Enhanced fields from unified inventory
  allocationState?: 'available' | 'deployed' | 'unavailable';
  allocatedToJob?: string;
  allocatedToNode?: string;
  lastAllocationUpdate?: Date;
  displayLocation?: string;
  hasConflict?: boolean;
  
  // Legacy fields for backward compatibility
  typeId?: string; // Maps to equipmentTypeId
  locationId?: string; // Maps to storageLocationId
  jobId?: string; // Maps to allocatedToJob
  location_type?: string;
  lastUpdated?: Date; // Maps to lastUpdatedDate
}

export interface InventoryData {
  equipmentTypes: EquipmentType[];
  storageLocations: StorageLocation[];
  individualEquipment: IndividualEquipment[];
  equipmentItems: BulkEquipment[]; // For backward compatibility - deprecated
  lastSync: Date;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline';
