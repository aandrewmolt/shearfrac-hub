// Standardized equipment interfaces
export interface StandardizedEquipment {
  id: string;
  equipmentId: string;
  name: string;
  typeId: string;  // Standardized to always use typeId
  locationId: string;
  status: 'available' | 'deployed' | 'maintenance' | 'red-tagged';
  jobId?: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentType {
  id: string;
  name: string;
  category: string;
  description?: string;
  requiresIndividualTracking: boolean;
  defaultIdPrefix?: string;
}

export interface StorageLocation {
  id: string;
  name: string;
  address?: string;
  isDefault: boolean;
}
