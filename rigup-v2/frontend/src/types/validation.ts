
export interface ValidationIssue {
  id: string;
  type: 'quantity_mismatch' | 'missing_equipment' | 'orphaned_deployment' | 'data_inconsistency';
  severity: 'warning' | 'error' | 'info';
  equipmentTypeId: string;
  locationId?: string;
  jobId?: string;
  message: string;
  expectedValue: number;
  actualValue: number;
  suggestedAction: 'update_dialog' | 'update_inventory' | 'manual_review';
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    autoFixableIssues: number;
  };
}
