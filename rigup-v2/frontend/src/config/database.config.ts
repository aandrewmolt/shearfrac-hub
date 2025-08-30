// Database configuration - Using AWS API only
// AWS provides DynamoDB backend through API Gateway
export const DATABASE_MODE = 'aws';

// Lazy-loaded configuration to avoid accessing env vars at module level
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

let _databaseConfig: DatabaseConfig | null = null;

export const getDatabaseConfig = () => {
  if (!_databaseConfig) {
    _databaseConfig = {
      mode: DATABASE_MODE,
      
      // Turso config - disabled, using AWS
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
  get(target, prop) {
    const config = getDatabaseConfig();
    return config[prop as keyof DatabaseConfig];
  }
});

// Helper to check if we're in offline mode - always false with AWS
export const isOfflineMode = () => {
  return false;  // AWS is always online
};

// Helper to check if we have cloud features - always true with AWS
export const hasCloudFeatures = () => {
  return true;  // AWS always has cloud features
};