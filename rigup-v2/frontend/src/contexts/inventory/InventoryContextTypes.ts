
import { InventoryData, IndividualEquipment } from '@/types/inventory';
import { EquipmentLocation } from '@/utils/equipmentLocation';
import { 
  CreateEquipmentTypeInput, 
  UpdateEquipmentTypeInput,
  CreateStorageLocationInput, 
  UpdateStorageLocationInput,
  CreateIndividualEquipmentInput,
  UpdateIndividualEquipmentInput
} from '@/types/types';

export interface InventoryContextType {
  data: InventoryData;
  isLoading: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline';
  
  // Location helpers - SINGLE SOURCE OF TRUTH
  getEquipmentAtLocation: (locationId: string, locationType?: 'storage' | 'job') => IndividualEquipment[];
  getEquipmentGroupedByLocation: () => { storageLocations: Map<string, IndividualEquipment[]>; jobs: Map<string, IndividualEquipment[]>; };
  getEquipmentDisplayLocation: (item: IndividualEquipment) => EquipmentLocation;
  
  // CRUD operations
  deleteEquipmentType: (id: string) => Promise<unknown>;
  deleteStorageLocation: (id: string) => Promise<unknown>;
  deleteIndividualEquipment: (id: string) => Promise<unknown>;
  
  // All mutation operations
  addEquipmentType: (data: CreateEquipmentTypeInput) => Promise<void>;
  updateEquipmentType: (id: string, data: UpdateEquipmentTypeInput) => Promise<void>;
  addStorageLocation: (data: CreateStorageLocationInput) => Promise<void>;
  updateStorageLocation: (id: string, data: UpdateStorageLocationInput) => Promise<void>;
  addIndividualEquipment: (data: CreateIndividualEquipmentInput) => Promise<void>;
  updateIndividualEquipment: (id: string, data: UpdateIndividualEquipmentInput) => Promise<void>;
  
  // Bulk operations
  addBulkIndividualEquipment: (equipment: CreateIndividualEquipmentInput[]) => Promise<IndividualEquipment[]>;
  
  // Utilities and other methods
  refreshData?: () => void;
  getEquipmentTypeName: (typeId: string) => string;
  getLocationName: (locationId: string) => string;
  getIndividualEquipmentByLocation: (locationId: string) => IndividualEquipment[];
  
  // Legacy compatibility
  createEquipmentType: (data: CreateEquipmentTypeInput) => Promise<void>;
  createStorageLocation: (data: CreateStorageLocationInput) => Promise<void>;
  updateSingleIndividualEquipment: (id: string, data: UpdateIndividualEquipmentInput) => Promise<void>;
  updateEquipmentTypes: (id: string, data: UpdateEquipmentTypeInput) => Promise<void>;
  updateStorageLocations: (id: string, data: UpdateStorageLocationInput) => Promise<void>;
  syncData: () => Promise<InventoryData>;
  resetToDefaultInventory: () => void;
}
