// Equipment Usage Tracking Types

export interface EquipmentUsageSession {
  id: string;
  equipmentId: string;
  jobId: string;
  jobName: string;
  startTime: Date;
  endTime?: Date;
  totalHours: number;
  sessionType: 'deployment' | 'maintenance' | 'testing';
  notes?: string;
  endNotes?: string;
}

export interface EquipmentLifecycle {
  equipmentId: string;
  equipmentName: string;
  totalHours: number;
  deploymentCount: number;
  maintenanceCount: number;
  currentStatus: 'available' | 'deployed' | 'maintenance' | 'red-tagged' | 'retired';
  createdDate: Date;
  lastUsed: number | null;
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  startDate: Date;
  endDate?: Date;
  type: 'preventive' | 'corrective' | 'emergency';
  description: string;
  cost?: number;
  performedBy?: string;
  hoursAtMaintenance: number; // Total hours used when maintenance started
}

export interface EquipmentUsageStats {
  equipmentId: string;
  equipmentName: string;
  totalHours: number;
  totalSessions: number;
  deploymentHours: number;
  maintenanceHours: number;
  averageSessionHours: number;
  jobUsage: Record<string, { jobName: string; hours: number; sessions: number }>;
  currentStatus: string;
  isCurrentlyInUse: boolean;
  lastUsed: number;
  utilizationRate: number;
}

export interface JobEquipmentUsage {
  jobId: string;
  jobName: string;
  equipmentCount: number;
  totalHours: number;
  activeSessions: number;
  completedSessions: number;
  equipmentBreakdown: Record<string, number>;
  startDate: number;
  endDate: number | null;
}

export interface RedTagEvent {
  id: string;
  equipmentId: string;
  equipmentName: string;
  eventDate: Date;
  reportedBy: string;
  reason: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved';
  resolved: boolean;
  resolvedDate?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
}