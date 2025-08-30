/**
 * AWS API Service
 * Handles all communication with AWS Lambda functions via API Gateway
 */

// Get API configuration from environment
const API_BASE_URL = import.meta.env.VITE_AWS_API_URL || 
  import.meta.env.VITE_API_URL;

// API Key for AWS API Gateway
const API_KEY = import.meta.env.VITE_AWS_API_KEY;

// Rate limiter implementation
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly timeWindow: number;

  constructor(maxRequests: number = 5, timeWindowMs: number = 1000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMs;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    // If we're at the limit, wait until we can make another request
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (now - oldestRequest);
      
      if (waitTime > 0) {
        console.log(`Rate limit reached. Waiting ${waitTime}ms before next request...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.waitForSlot(); // Recursively check again
      }
    }
    
    // Add current request timestamp
    this.requests.push(now);
  }
}

// Create global rate limiter instance (5 requests per second)
const rateLimiter = new RateLimiter(5, 1000);

// Common headers for API requests
const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('aws_api_token');
  return {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// Error handling wrapper
class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic fetch wrapper with error handling and rate limiting
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Apply rate limiting before making the request
  await rateLimiter.waitForSlot();
  
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      let parsedError;
      try {
        parsedError = JSON.parse(errorData);
      } catch {
        parsedError = { message: errorData };
      }
      // Log errors but handle them gracefully
      if (response.status !== 400 || !parsedError.error?.includes('already exists')) {
        console.error(`API Error (${response.status}):`, parsedError);
        console.error('Request URL:', url);
        console.error('Request body:', options.body);
      }
      throw new ApiError(response.status, parsedError.message || parsedError.error || 'API request failed', parsedError);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Jobs API
export const jobsApi = {
  // List all jobs
  list: () => apiFetch<any[]>('/jobs'),
  
  // Get a specific job
  get: (id: string) => apiFetch<any>(`/jobs/${id}`),
  
  // Create a new job
  create: (data: any) => apiFetch<any>('/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Update a job
  update: (id: string, data: any) => apiFetch<any>(`/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  // Delete/archive a job
  delete: (id: string) => apiFetch<void>(`/jobs/${id}`, {
    method: 'DELETE',
  }),
  
  // Get job diagram
  getDiagram: (id: string) => apiFetch<any>(`/jobs/${id}/diagram`),
  
  // Update job diagram
  updateDiagram: (id: string, data: any) => apiFetch<any>(`/jobs/${id}/diagram`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};

// Equipment API
export const equipmentApi = {
  // List all equipment
  list: () => apiFetch<any[]>('/equipment'),
  
  // Get specific equipment
  get: (id: string) => apiFetch<any>(`/equipment/${id}`),
  
  // Create new equipment
  create: (data: any) => {
    console.log('Creating equipment with data:', data);
    return apiFetch<any>('/equipment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // Update equipment
  update: (id: string, data: any) => apiFetch<any>(`/equipment/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  // Update equipment status
  updateStatus: (id: string, status: string) => apiFetch<any>(`/equipment/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  
  // Deploy equipment to a job
  deploy: (data: { equipmentId: string; jobId: string; quantity?: number }) => 
    apiFetch<any>('/equipment/deploy', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Return equipment from a job
  return: (data: { equipmentId: string; jobId: string; quantity?: number }) => 
    apiFetch<any>('/equipment/return', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Contacts API
export const contactsApi = {
  // List all contacts
  list: () => apiFetch<any[]>('/contacts'),
  
  // Get specific contact
  get: (id: string) => apiFetch<any>(`/contacts/${id}`),
  
  // Create new contact
  create: (data: any) => apiFetch<any>('/contacts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Update contact
  update: (id: string, data: any) => apiFetch<any>(`/contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  // Delete contact
  delete: (id: string) => apiFetch<void>(`/contacts/${id}`, {
    method: 'DELETE',
  }),
};

// Clients API
export const clientsApi = {
  // List all clients
  list: () => apiFetch<string[]>('/clients'),
  
  // Create new client
  create: (name: string) => apiFetch<{ name: string }>('/clients', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }),
};

// Authentication helper
export const authApi = {
  // Set API token
  setToken: (token: string) => {
    localStorage.setItem('aws_api_token', token);
  },
  
  // Remove API token
  clearToken: () => {
    localStorage.removeItem('aws_api_token');
  },
  
  // Check if authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('aws_api_token');
  },
};

// Export all APIs
export const awsApi = {
  jobs: jobsApi,
  equipment: equipmentApi,
  contacts: contactsApi,
  clients: clientsApi,
  auth: authApi,
};

export default awsApi;