// Enhanced type definitions to replace 'any' types throughout the codebase

// Database Types
export interface DatabaseUser {
  id: string;
  email: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseEquipmentType {
  id: string;
  name: string;
  category: 'cables' | 'gauges' | 'adapters' | 'communication' | 'power' | 'control-units' | 'it-equipment' | 'other';
  description?: string;
  requires_individual_tracking: boolean;
  default_id_prefix?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseStorageLocation {
  id: string;
  name: string;
  address?: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseIndividualEquipment {
  id: string;
  equipment_id: string;
  name: string;
  type_id: string;
  location_id: string;
  status: 'available' | 'deployed' | 'maintenance' | 'red-tagged' | 'retired';
  job_id?: string;
  serial_number?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  notes?: string;
  red_tag_reason?: string;
  red_tag_photo?: string;
  location_type: 'storage' | 'job';
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseJob {
  id: string;
  name: string;
  client?: string;
  well_count: number;
  has_wellside_gauge: boolean;
  nodes: string; // JSON string
  edges: string; // JSON string
  company_computer_names?: string; // JSON string
  equipment_assignment?: string; // JSON string
  equipment_allocated: boolean;
  main_box_name?: string;
  satellite_name?: string;
  wellside_gauge_name?: string;
  selected_cable_type: string;
  frac_baud_rate: string;
  gauge_baud_rate: string;
  frac_com_port: string;
  gauge_com_port: string;
  enhanced_config?: string; // JSON string
  photos?: string; // JSON string
  status: 'pending' | 'active' | 'completed';
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseJobPhoto {
  id: string;
  job_id: string;
  section_label: string;
  photo_url: string;
  caption?: string;
  sort_order: number;
  created_at?: string;
}

export interface DatabaseEquipmentItem {
  id: string;
  type_id: string;
  location_id: string;
  quantity: number;
  status: 'available' | 'deployed' | 'maintenance' | 'red-tagged';
  job_id?: string;
  notes?: string;
  red_tag_reason?: string;
  red_tag_photo?: string;
  location_type: 'storage' | 'job';
  created_at?: string;
  updated_at?: string;
}

// Application Types (transformed from database)
export interface Job {
  id: string;
  name: string;
  client?: string;
  wellCount: number;
  hasWellsideGauge: boolean;
  nodes: JobNode[];
  edges: JobEdge[];
  companyComputerNames: Record<string, string>;
  equipmentAssignment: Record<string, string>;
  equipmentAllocated: boolean;
  mainBoxName?: string;
  satelliteName?: string;
  wellsideGaugeName?: string;
  selectedCableType: string;
  fracBaudRate: string;
  gaugeBaudRate: string;
  fracComPort: string;
  gaugeComPort: string;
  enhancedConfig: JobEnhancedConfig;
  photos: JobPhoto[];
  status: 'pending' | 'active' | 'completed';
  startDate?: string;
  endDate?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JobNode {
  id: string;
  type: 'well' | 'shearStreamBox' | 'starlink' | 'customerComputer' | 'yAdapter' | 'wellsideGauge';
  position: {
    x: number;
    y: number;
  };
  data: {
    label: string;
    customName?: string;
    wellNumber?: number;
    equipmentId?: string;
  };
}

export interface JobEdge {
  id: string;
  source: string;
  target: string;
  type?: 'cable' | 'direct';
  data?: {
    label?: string;
    connectionType?: string;
    cableTypeId?: string;
  };
}

export interface JobEnhancedConfig {
  baudRates?: {
    frac: string;
    gauge: string;
  };
  comPorts?: {
    frac: string;
    gauge: string;
  };
  equipmentNames?: Record<string, string>;
  additionalSettings?: Record<string, unknown>;
}

export interface JobPhoto {
  id: string;
  url: string;
  caption?: string;
  sectionLabel: string;
  sortOrder: number;
}

// Equipment Types
export interface Equipment {
  id: string;
  equipmentId: string;
  name: string;
  typeId: string;
  locationId: string;
  status: EquipmentStatus;
  jobId?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  notes?: string;
  redTagReason?: string;
  redTagPhoto?: string;
  locationType: 'storage' | 'job';
  lastUpdated: Date;
}

export type EquipmentStatus = 
  | 'available'
  | 'deployed'
  | 'maintenance'
  | 'red-tagged'
  | 'retired';

// Contact Types
export interface BaseContact {
  id: string;
  name: string;
  company: string;
  job: string;
  email?: string;
  phone?: string;
  shift?: 'days' | 'nights' | 'off';
  notes?: string;
  lastUpdatedDate: string;
  lastUpdatedTime: string;
  createdDate: string;
}

export interface ClientContact extends BaseContact {
  type: 'client';
  title: string;
  crew?: string;
  dateOfRotation?: string;
}

export interface FracContact extends BaseContact {
  type: 'frac';
  crew: string;
  title: string;
  dateOfRotation?: string;
}

export interface CustomContact extends BaseContact {
  type: string; // Any custom type
  crew: string;
  title: string;
  dateOfRotation?: string;
}

export type Contact = ClientContact | FracContact | CustomContact;

// Inventory Types
export interface InventoryData {
  equipmentTypes: EquipmentType[];
  storageLocations: StorageLocation[];
  individualEquipment: IndividualEquipment[];
  equipmentItems: EquipmentItem[];
  lastSync: Date;
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

export interface IndividualEquipment {
  id: string;
  equipmentId: string;
  name?: string;
  typeId: string;
  locationId: string;
  status: EquipmentStatus;
  jobId?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  notes?: string;
  redTagReason?: string;
  redTagPhoto?: string;
  locationType: 'storage' | 'job';
  lastUpdatedDate: string;
}

export interface EquipmentItem {
  id: string;
  typeId: string;
  locationId: string;
  quantity: number;
  status: EquipmentStatus;
  jobId?: string;
  notes?: string;
  redTagReason?: string;
  redTagPhoto?: string;
  locationType: 'storage' | 'job';
}

// Mutation Types
export interface CreateEquipmentTypeInput {
  name: string;
  category: string;
  description?: string;
  requiresIndividualTracking?: boolean;
  defaultIdPrefix?: string;
}

export interface UpdateEquipmentTypeInput {
  name?: string;
  category?: string;
  description?: string;
  requiresIndividualTracking?: boolean;
  defaultIdPrefix?: string;
}

export interface CreateStorageLocationInput {
  name: string;
  address?: string;
  isDefault?: boolean;
}

export interface UpdateStorageLocationInput {
  name?: string;
  address?: string;
  isDefault?: boolean;
}

export interface CreateIndividualEquipmentInput {
  equipmentId: string;
  name: string;
  typeId: string;
  locationId: string;
  status?: EquipmentStatus;
  jobId?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  notes?: string;
}

export interface UpdateIndividualEquipmentInput {
  equipmentId?: string;
  name?: string;
  typeId?: string;
  locationId?: string;
  status?: EquipmentStatus;
  jobId?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  notes?: string;
  redTagReason?: string;
  redTagPhoto?: string;
}

export interface CreateJobInput {
  name: string;
  client?: string;
  wellCount: number;
  hasWellsideGauge?: boolean;
  nodes?: JobNode[];
  edges?: JobEdge[];
}

export interface UpdateJobInput {
  name?: string;
  client?: string;
  wellCount?: number;
  hasWellsideGauge?: boolean;
  nodes?: JobNode[];
  edges?: JobEdge[];
  status?: 'pending' | 'active' | 'completed';
  equipmentAssignment?: Record<string, string>;
  equipmentAllocated?: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Event Types
export interface EquipmentEvent {
  type: 'created' | 'updated' | 'deleted' | 'transferred' | 'deployed' | 'returned';
  equipmentId: string;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export interface JobEvent {
  type: 'created' | 'updated' | 'deleted' | 'started' | 'completed';
  jobId: string;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, unknown>;
}

// Filter Types
export interface EquipmentFilter {
  typeId?: string;
  locationId?: string;
  status?: EquipmentStatus;
  jobId?: string;
  search?: string;
}

export interface JobFilter {
  client?: string;
  status?: 'pending' | 'active' | 'completed';
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ContactFilter {
  type?: string;
  company?: string;
  job?: string;
  shift?: 'days' | 'nights' | 'off';
  search?: string;
}

// Sort Types
export interface SortConfig<T> {
  field: keyof T;
  direction: 'asc' | 'desc';
}

// Export helper type guards
export function isClientContact(contact: Contact): contact is ClientContact {
  return contact.type === 'client';
}

export function isFracContact(contact: Contact): contact is FracContact {
  return contact.type === 'frac';
}

export function isCustomContact(contact: Contact): contact is CustomContact {
  return contact.type !== 'client' && contact.type !== 'frac';
}

export function isValidEquipmentStatus(status: string): status is EquipmentStatus {
  return ['available', 'deployed', 'maintenance', 'red-tagged', 'retired'].includes(status);
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type AsyncResult<T> = Promise<ApiResponse<T>>;
