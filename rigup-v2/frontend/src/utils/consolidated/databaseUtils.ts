// AWS API Mode - No Turso client needed
// All database operations go through AWS API Gateway

// =============================================================================
// DATABASE CLIENT MANAGEMENT - DISABLED FOR AWS
// =============================================================================

// Mock Turso client that throws errors - we shouldn't be using this
export function getTursoClient() {
  throw new Error('Turso is disabled. Use AWS API instead.');
}

// Export mock that throws errors for any Turso operations
export const turso = new Proxy({} as any, {
  get(target, prop: string | symbol) {
    if (prop === 'execute') {
      return () => {
        throw new Error('Direct database access is not allowed. Use AWS API instead.');
      };
    }
    throw new Error('Turso is disabled. Use AWS API instead.');
  }
});

// Test connection - always returns true for AWS
export async function testConnection() {
  console.log('✅ Using AWS API - no direct database connection');
  return true;
}

// =============================================================================
// DATABASE CONFIGURATION
// =============================================================================

// Database configuration types
interface DatabaseConfig {
  mode: string;
  turso: {
    available: boolean;
    url: string;
  };
  features: {
    realtime: boolean;
    fileStorage: boolean;
    authentication: boolean;
    cloudSync: boolean;
  };
}

// Database configuration - AWS API Mode
// All operations go through AWS API Gateway
export const DATABASE_MODE = 'aws';

// Lazy-loaded configuration to avoid accessing env vars at module level
let _databaseConfig: DatabaseConfig | null = null;

export const getDatabaseConfig = () => {
  if (!_databaseConfig) {
    _databaseConfig = {
      mode: DATABASE_MODE,
      
      // Turso config - disabled for AWS
      turso: {
        available: false,
        get url() {
          return '';  // No Turso URL - using AWS API
        },
      },
      
      // Feature flags
      features: {
        realtime: true, // AWS provides real-time updates
        fileStorage: true, // Using AWS S3 for file storage
        authentication: true, // Using AWS Cognito for auth
        cloudSync: true, // AWS syncs automatically
      }
    };
  }
  return _databaseConfig;
};

// Export for backward compatibility
export const databaseConfig = new Proxy({} as DatabaseConfig, {
  get(target, prop: keyof DatabaseConfig) {
    const config = getDatabaseConfig();
    return config[prop];
  }
});

// Helper to check if we're in offline mode
export const isOfflineMode = () => {
  const url = import.meta.env?.VITE_TURSO_DATABASE_URL;
  return !url || url.includes('file:');
};

// Helper to check if we have cloud features
export const hasCloudFeatures = () => {
  const url = import.meta.env?.VITE_TURSO_DATABASE_URL;
  return url && !url.includes('file:');
};

// =============================================================================
// SCHEMA INITIALIZATION - DISABLED FOR AWS
// =============================================================================

let schemaInitialized = true;  // Always true for AWS

export async function ensureSchemaInitialized() {
  // AWS handles schema through DynamoDB - no initialization needed
  console.log('✅ Using AWS DynamoDB - no schema initialization needed');
  return true;
}

// =============================================================================
// DATABASE MIGRATIONS
// =============================================================================

export async function addJobStatusFields() {
  console.log('🔧 Adding job status fields...');
  
  try {
    // Check if columns already exist
    const tableInfo = await turso.execute("PRAGMA table_info(jobs)");
    const columns = tableInfo.rows.map(row => row.name as string);
    
    // Add status column if it doesn't exist
    if (!columns.includes('status')) {
      console.log('Adding status column...');
      await turso.execute(`
        ALTER TABLE jobs 
        ADD COLUMN status TEXT DEFAULT 'pending'
      `);
    }
    
    // Add start_date column if it doesn't exist
    if (!columns.includes('start_date')) {
      console.log('Adding start_date column...');
      await turso.execute(`
        ALTER TABLE jobs 
        ADD COLUMN start_date DATETIME
      `);
    }
    
    // Add end_date column if it doesn't exist
    if (!columns.includes('end_date')) {
      console.log('Adding end_date column...');
      await turso.execute(`
        ALTER TABLE jobs 
        ADD COLUMN end_date DATETIME
      `);
    }
    
    console.log('✅ Job status fields added successfully');
  } catch (error) {
    console.error('❌ Error adding job status fields:', error);
    throw error;
  }
}

export async function addClientToJobs() {
  console.log('🔧 Adding client column to jobs table...');
  
  try {
    // Add client column to jobs table
    await turso.execute(`
      ALTER TABLE jobs ADD COLUMN client TEXT
    `);
    
    console.log('✅ Successfully added client column to jobs table');
  } catch (error: unknown) {
    if (error.message?.includes('duplicate column name')) {
      console.log('ℹ️ Client column already exists in jobs table');
    } else {
      console.error('❌ Error adding client column:', error);
      throw error;
    }
  }
}