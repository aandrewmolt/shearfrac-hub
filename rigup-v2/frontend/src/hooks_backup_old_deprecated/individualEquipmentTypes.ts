
export interface FormData {
  equipmentId: string;
  name: string;
  locationId: string;
  serialNumber: string;
  notes: string;
  selectedPrefix?: string;
}

export interface BulkCreateData {
  count: number;
  prefix: string;
  startNumber: number;
  locationId: string;
  selectedPrefix?: string;
}
