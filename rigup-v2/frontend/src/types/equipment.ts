
export interface TrackedEquipment {
  id: string;
  equipmentId: string; // User-editable ID like "SS-001", "SL-002"
  type: 'shearstream-box' | 'starlink' | 'customer-computer';
  name: string; // User-friendly name
  serialNumber?: string;
  purchaseDate?: Date;
  notes?: string;
  status: 'available' | 'deployed' | 'maintenance' | 'retired';
  currentJobId?: string;
  currentLocation?: string;
  lastUpdated: Date;
}

export interface EquipmentDeploymentHistory {
  id: string;
  equipmentId: string;
  jobId: string;
  jobName: string;
  customNameUsed: string;
  deploymentDate: Date;
  returnDate?: Date;
  location?: string;
  notes?: string;
}

export interface JobEquipmentAssignment {
  shearstreamBoxIds: string[]; // Changed from shearstreamBoxId to support multiple boxes
  starlinkId?: string;
  customerComputerIds: string[]; // Changed from companyComputerIds
  
  // Legacy properties for backward compatibility
  companyComputerIds?: string[];
  company_computer_ids?: string[];
}

