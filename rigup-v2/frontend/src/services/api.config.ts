/**
 * API Configuration for RigUp v2 AWS Backend
 * Connects to AWS Lambda via API Gateway
 */

// Use environment variable or default to AWS API Gateway endpoint
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  'https://your-api-gateway-id.execute-api.us-east-1.amazonaws.com/dev';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  
  ENDPOINTS: {
    // Jobs
    JOBS: {
      LIST: '/jobs',
      GET: (id: string) => `/jobs/${id}`,
      CREATE: '/jobs',
      UPDATE: (id: string) => `/jobs/${id}`,
      DELETE: (id: string) => `/jobs/${id}`,
      DIAGRAM: (id: string) => `/jobs/${id}/diagram`,
      ARCHIVE: (id: string) => `/jobs/${id}`, // Uses DELETE for now
    },
    
    // Equipment - with proper code support (SS01, CT03, etc.)
    EQUIPMENT: {
      LIST: '/equipment',
      GET: (id: string) => `/equipment/${id}`,
      CREATE: '/equipment',
      UPDATE: (id: string) => `/equipment/${id}`,
      UPDATE_STATUS: (id: string) => `/equipment/${id}/status`,
      DEPLOY: '/equipment/deploy',
      RETURN: '/equipment/return',
    },
    
    // Contacts
    CONTACTS: {
      LIST: '/contacts',
      GET: (id: string) => `/contacts/${id}`,
      CREATE: '/contacts',
      UPDATE: (id: string) => `/contacts/${id}`,
      DELETE: (id: string) => `/contacts/${id}`,
    },
    
    // Clients (for managing client names)
    CLIENTS: {
      LIST: '/clients',
      CREATE: '/clients',
    },
  },
};

export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('api_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};