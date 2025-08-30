import { DATABASE_MODE } from '@/utils/consolidated/databaseUtils';

interface EnvironmentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(): EnvironmentValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check database mode
  if (!DATABASE_MODE) {
    errors.push('DATABASE_MODE is not set. Please set VITE_DATABASE_MODE to "local", "vercel-blob", or "turso".');
  }
  
  // Validate database mode values
  if (!['local', 'vercel-blob', 'turso'].includes(DATABASE_MODE)) {
    errors.push(`Invalid DATABASE_MODE "${DATABASE_MODE}". Must be "local", "vercel-blob", or "turso".`);
  }
  
  if (DATABASE_MODE === 'vercel-blob') {
    // Check if we're in production (Vercel deployment)
    const isProduction = import.meta.env.PROD;
    
    if (isProduction) {
      // These will be available as runtime env vars in Vercel
      warnings.push('Vercel Blob storage requires BLOB_READ_WRITE_TOKEN to be set in Vercel environment variables.');
    } else {
      warnings.push('Vercel Blob storage will use mock implementation in development mode.');
    }
  }
  
  if (DATABASE_MODE === 'turso') {
    // Check for Turso environment variables
    if (!import.meta.env.VITE_TURSO_DATABASE_URL) {
      errors.push('VITE_TURSO_DATABASE_URL is required when using Turso database mode.');
    }
    if (!import.meta.env.VITE_TURSO_AUTH_TOKEN) {
      warnings.push('VITE_TURSO_AUTH_TOKEN is recommended for production Turso databases.');
    }
  }
  
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