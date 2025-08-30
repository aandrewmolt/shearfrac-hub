import { DATABASE_MODE } from '@/utils/consolidated/databaseUtils';

interface EnvironmentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(): EnvironmentValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // AWS API mode - no database validation needed
  // All data is handled through AWS DynamoDB via Lambda functions
  
  // Check for IndexedDB support (required for local storage)
  if (typeof window !== 'undefined' && !('indexedDB' in window)) {
    errors.push('IndexedDB is not supported in this browser. Local storage will not work.');
  }
  
  // Check for service worker support if trying to use offline features
  if (typeof window !== 'undefined' && !('serviceWorker' in navigator)) {
    warnings.push('Service Workers are not supported. Offline functionality will be limited.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function logEnvironmentStatus(): void {
  const validation = validateEnvironment();
  
  console.log('Environment validation results:', {
    isValid: validation.isValid,
    errors: validation.errors,
    warnings: validation.warnings,
    databaseMode: DATABASE_MODE
  });
  
  if (validation.errors.length > 0) {
    console.error('Environment validation errors:', validation.errors);
  }
  
  if (validation.warnings.length > 0) {
    console.warn('Environment validation warnings:', validation.warnings);
  }
  
  if (validation.isValid) {
    console.log('Environment validation passed successfully');
  } else {
    console.error('Environment validation failed');
  }
}