// Shared types for equipment allocation to break circular dependencies

export interface EquipmentConflict {
  equipmentId: string;
  equipmentName: string;
  currentJobId: string;
  currentJobName: string;
  requestedJobId: string;
  requestedJobName: string;
  timestamp: Date;
}

export interface EquipmentAllocation {
  equipmentId: string;
  jobId: string;
  jobName: string;
  allocatedAt: Date;
  status: 'allocated' | 'deployed' | 'released';
}

export interface SharedEquipmentState {
  status: string;
  jobId?: string;
  lastUpdated: Date;
}