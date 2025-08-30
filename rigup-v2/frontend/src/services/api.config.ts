/**
 * API Configuration for RigUp v2 AWS Backend
 * Connects to AWS Lambda via API Gateway
 */

// Hardcoded for Vercel deployment - replace with env vars in production
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  'https://wmh8r4eixg.execute-api.us-east-1.amazonaws.com/dev';

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
  // Hardcoded API key for Vercel deployment
  const apiKey = import.meta.env.VITE_API_KEY || 'C5b4WeRnJ82JRJo5ePOF36vfbB6AaBBS8MeLyx6A';
  
  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};