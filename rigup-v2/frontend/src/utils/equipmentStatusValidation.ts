import { toast } from "@/hooks/use-toast";

export const VALID_EQUIPMENT_STATUSES = [
  'available',
  'deployed', 
  'maintenance',
  'red-tagged',
  'retired'
] as const;

export type ValidEquipmentStatus = typeof VALID_EQUIPMENT_STATUSES[number];

export interface StatusValidationResult {
  isValid: boolean;
  status: ValidEquipmentStatus | null;
  error?: string;
}

export function validateEquipmentStatus(status: unknown): StatusValidationResult {
  // Check for null, undefined, or empty string
  if (!status || (typeof status === 'string' && status.trim() === '')) {
    return {
      isValid: false,
      status: null,
      error: 'Equipment status cannot be empty'
    };
  }

  // Ensure status is a string
  if (typeof status !== 'string') {
    return {
      isValid: false,
      status: null,
      error: 'Equipment status must be a string'
    };
  }

  // Normalize the status (trim whitespace, lowercase)
  const normalizedStatus = status.trim().toLowerCase();

  // Check if it's a valid status
  if (!VALID_EQUIPMENT_STATUSES.includes(normalizedStatus as ValidEquipmentStatus)) {
    return {
      isValid: false,
      status: null,
      error: `Invalid equipment status: "${status}". Valid statuses are: ${VALID_EQUIPMENT_STATUSES.join(', ')}`
    };
  }

  return {
    isValid: true,
    status: normalizedStatus as ValidEquipmentStatus,
    error: undefined
  };
}

export function validateAndNormalizeStatus(status: unknown, defaultStatus: ValidEquipmentStatus = 'available'): ValidEquipmentStatus {
  const validation = validateEquipmentStatus(status);
  
  if (!validation.isValid) {
    return defaultStatus;
  }

  return validation.status!;
}

export function validateStatusTransition(
  currentStatus: ValidEquipmentStatus,
  newStatus: unknown
): StatusValidationResult {
  const validation = validateEquipmentStatus(newStatus);
  
  if (!validation.isValid) {
    return validation;
  }

  // Additional business logic validations
  const validatedNewStatus = validation.status!;

  // Can't change status from retired back to anything else
  if (currentStatus === 'retired' && validatedNewStatus !== 'retired') {
    return {
      isValid: false,
      status: null,
      error: 'Cannot change status from retired to another status'
    };
  }

  // Can't deploy equipment that's in maintenance or red-tagged
  if (validatedNewStatus === 'deployed' && (currentStatus === 'maintenance' || currentStatus === 'red-tagged')) {
    return {
      isValid: false,
      status: null,
      error: `Cannot deploy equipment that is currently ${currentStatus}`
    };
  }

  return {
    isValid: true,
    status: validatedNewStatus
  };
}

export function showStatusValidationError(error: string, equipmentId?: string) {
  const message = equipmentId 
    ? `Equipment ${equipmentId}: ${error}`
    : error;
    
  toast({
    title: "Invalid Equipment Status",
    description: message,
    variant: "destructive"
  });
}

export function isValidEquipmentStatus(status: unknown): status is ValidEquipmentStatus {
  return validateEquipmentStatus(status).isValid;
}

// Utility to fix common status issues
export function sanitizeEquipmentStatus(status: unknown): ValidEquipmentStatus {
  // Handle common misspellings or variations
  if (typeof status === 'string') {
    const normalized = status.trim().toLowerCase();
    
    // Map common variations
    const statusMap: Record<string, ValidEquipmentStatus> = {
      'active': 'available',
      'in-use': 'deployed',
      'in use': 'deployed',
      'in service': 'available',
      'out of service': 'maintenance',
      'repair': 'maintenance',
      'repairs': 'maintenance',
      'red tagged': 'red-tagged',
      'redtagged': 'red-tagged',
      'decommissioned': 'retired',
      'scrapped': 'retired'
    };

    if (statusMap[normalized]) {
      return statusMap[normalized];
    }
  }

  // Fall back to validation
  return validateAndNormalizeStatus(status);
}