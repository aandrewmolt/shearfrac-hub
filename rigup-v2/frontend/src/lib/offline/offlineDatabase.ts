import Dexie, { Table } from 'dexie';

export interface LocalJob {
  id?: number;
  cloudId?: string;
  name: string;
  wellCount: number;
  nodes: unknown;
  edges: unknown;
  equipmentAllocations: unknown;
  hasWellsideGauge?: boolean;
  companyComputerNames?: Record<string, string>;
  equipmentAssignment?: unknown;
  equipmentAllocated?: boolean;
  mainBoxName?: string;
  satelliteName?: string;
  wellsideGaugeName?: string;
  selectedCableType?: string;
  fracBaudRate?: string;
  gaugeBaudRate?: string;
  fracComPort?: string;
  gaugeComPort?: string;
  enhancedConfig?: unknown;
  createdAt?: string | Date;
  updatedAt: number;
  syncStatus: 'synced' | 'pending' | 'conflict';
}

export interface LocalEquipment {
  id?: number;
  cloudId?: string;
  name: string;
  type: string;
  status: string;
  locationId: string;
  quantity?: number;
  serialNumber?: string;
  updatedAt: number;
  syncStatus: 'synced' | 'pending' | 'conflict';
}

export interface LocalEquipmentItem {
  id?: number;
  cloudId?: string;
  type_id: string;
  location_id: string;
  quantity: number;
  status: string;
  job_id?: string;
  notes?: string;
  red_tag_reason?: string;
  red_tag_photo?: string;
  location_type?: string;
  created_at?: string;
  updated_at: number;
  syncStatus: 'synced' | 'pending' | 'conflict';
}

export interface LocalIndividualEquipment {
  id?: number;
  cloudId?: string;
  equipment_id: string;
  name: string;
  type_id: string;
  location_id: string;
  status: string;
  job_id?: string;
  serial_number?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  notes?: string;
  red_tag_reason?: string;
  red_tag_photo?: string;
  location_type?: string;
  created_at?: string;
  updated_at: number;
  syncStatus: 'synced' | 'pending' | 'conflict';
}

export interface SyncOperation {
  id?: number;
  operation: 'create' | 'update' | 'delete';
  tableName: string;
  recordId: string;
  data: unknown;
  timestamp: number;
  retryCount: number;
}

export class RigUpOfflineDatabase extends Dexie {
  jobs!: Table<LocalJob>;
  equipment!: Table<LocalEquipment>;
  equipment_types!: Table<unknown>;
  storage_locations!: Table<unknown>;
  equipment_items!: Table<LocalEquipmentItem>;
  individual_equipment!: Table<LocalIndividualEquipment>;
  syncQueue!: Table<SyncOperation>;
  
  constructor() {
    super('RigUpOffline');
    
    this.version(1).stores({
      jobs: '++id, cloudId, name, updatedAt, syncStatus',
      equipment: '++id, cloudId, name, type, status, locationId, serialNumber, syncStatus',
      equipment_types: '++id, cloudId, name, category',
      storage_locations: '++id, cloudId, name',
      syncQueue: '++id, operation, tableName, timestamp'
    });
    
    this.version(2).stores({
      jobs: '++id, cloudId, name, updatedAt, syncStatus, createdAt',
      equipment: '++id, cloudId, name, type, status, locationId, serialNumber, syncStatus',
      equipment_types: '++id, cloudId, name, category',
      storage_locations: '++id, cloudId, name',
      syncQueue: '++id, operation, tableName, timestamp'
    });
    
    this.version(3).stores({
      jobs: '++id, cloudId, name, updatedAt, syncStatus, createdAt',
      equipment: '++id, cloudId, name, type, status, locationId, serialNumber, syncStatus',
      equipment_types: '++id, cloudId, name, category',
      storage_locations: '++id, cloudId, name',
      equipment_items: '++id, cloudId, type_id, location_id, status, job_id, updatedAt, syncStatus',
      individual_equipment: '++id, cloudId, equipment_id, type_id, location_id, status, serial_number, updatedAt, syncStatus',
      syncQueue: '++id, operation, tableName, timestamp'
    });
  }
  
  async getUnsyncedRecords() {
    const unsyncedJobs = await this.jobs.where('syncStatus').equals('pending').toArray();
    const unsyncedEquipment = await this.equipment.where('syncStatus').equals('pending').toArray();
    return { jobs: unsyncedJobs, equipment: unsyncedEquipment };
  }
  
  async markAsSynced(tableName: string, localId: number, cloudId: string) {
    const table = this[tableName as keyof RigUpOfflineDatabase] as Table<unknown>;
    await table.update(localId, { 
      cloudId, 
      syncStatus: 'synced',
      updatedAt: Date.now()
    });
  }
  
  async addToSyncQueue(operation: SyncOperation['operation'], tableName: string, recordId: string, data: unknown) {
    await this.syncQueue.add({
      operation,
      tableName,
      recordId,
      data,
      timestamp: Date.now(),
      retryCount: 0
    });
  }
}

// Lazy-loaded singleton instance
let _offlineDb: RigUpOfflineDatabase | null = null;

export const getOfflineDb = (): RigUpOfflineDatabase => {
  if (!_offlineDb) {
    _offlineDb = new RigUpOfflineDatabase();
  }
  return _offlineDb;
};

// Export for backward compatibility (will be lazy-loaded on first access)
export const offlineDb = new Proxy({} as RigUpOfflineDatabase, {
  get(target, prop) {
    const db = getOfflineDb();
    return (db as Record<string, unknown>)[prop as string];
  }
});