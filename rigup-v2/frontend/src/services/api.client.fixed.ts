/**
 * FIXED API Client for RigUp v2 Backend
 * Addresses architectural issues causing request storms
 */

import { API_CONFIG, getAuthHeaders } from './api.config';
import { equipmentCache } from './equipmentCache';

// Static equipment types to avoid fetching entire inventory
const STATIC_EQUIPMENT_TYPES = [
  { id: 'shearstream', name: 'Shearstream Box', category: 'main', defaultIdPrefix: 'SS' },
  { id: 'cable-tester', name: 'Cable Tester', category: 'testing', defaultIdPrefix: 'CT' },
  { id: 'satellite', name: 'Satellite', category: 'communication', defaultIdPrefix: 'SAT' },
  { id: 'gauge', name: 'Gauge', category: 'monitoring', defaultIdPrefix: 'G' },
  { id: 'server', name: 'Server', category: 'computing', defaultIdPrefix: 'SRV' },
  { id: 'junction-box', name: 'Junction Box', category: 'connectivity', defaultIdPrefix: 'JB' },
  { id: 'starlink', name: 'Starlink', category: 'communication', defaultIdPrefix: 'SL' }
];

class FixedApiClient {
  private requestQueue: Map<string, Promise<any>> = new Map();
  private lastRequestTime = 0;
  private readonly MIN_REQUEST_INTERVAL = 200; // 200ms between requests
  
  /**
   * Rate-limited request with deduplication
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const method = options.method || 'GET';
    const cacheKey = `${method}-${endpoint}`;
    
    // For GET requests, check if we have a pending request
    if (method === 'GET' && this.requestQueue.has(cacheKey)) {
      console.log(`[FixedApiClient] Returning existing request for: ${endpoint}`);
      return this.requestQueue.get(cacheKey)!;
    }
    
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => 
        setTimeout(resolve, this.MIN_REQUEST_INTERVAL - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();
    
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    const requestPromise = fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    }).then(async response => {
      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: response.statusText,
          status: response.status,
        }));
        throw new Error(error.message || `Request failed: ${response.status}`);
      }
      return response.json();
    }).finally(() => {
      // Clean up request queue
      if (method === 'GET') {
        this.requestQueue.delete(cacheKey);
      }
    });
    
    if (method === 'GET') {
      this.requestQueue.set(cacheKey, requestPromise);
    }
    
    return requestPromise;
  }

  /**
   * Get equipment types WITHOUT fetching all equipment
   */
  async getEquipmentTypes() {
    return equipmentCache.get('equipment-types-only', async () => {
      // Return static types to avoid API call
      // In production, this should be a dedicated endpoint
      console.log('[FixedApiClient] Returning static equipment types');
      return STATIC_EQUIPMENT_TYPES;
    });
  }

  /**
   * Batch fetch equipment by IDs to prevent N+1 problem
   */
  async getEquipmentBatch(ids: string[]) {
    if (!ids.length) return [];
    
    return equipmentCache.get(`equipment-batch-${ids.join(',')}`, async () => {
      // In a real implementation, this would be:
      // return this.request(`/equipment/batch`, {
      //   method: 'POST',
      //   body: JSON.stringify({ ids })
      // });
      
      // For now, fetch all and filter
      const all = await this.getEquipment();
      return all.filter((item: any) => ids.includes(item.id));
    });
  }

  /**
   * Get all equipment with proper caching
   */
  async getEquipment() {
    return equipmentCache.get('all-equipment', () => 
      this.request(API_CONFIG.ENDPOINTS.EQUIPMENT.LIST)
    );
  }

  /**
   * Get single equipment item
   */
  async getEquipmentById(id: string) {
    return equipmentCache.get(`equipment-${id}`, () => 
      this.request(API_CONFIG.ENDPOINTS.EQUIPMENT.GET(id))
    );
  }

  // Jobs
  async getJobs() {
    return equipmentCache.get('all-jobs', () => 
      this.request(API_CONFIG.ENDPOINTS.JOBS.LIST)
    );
  }

  async getJobById(id: string) {
    return equipmentCache.get(`job-${id}`, () => 
      this.request(API_CONFIG.ENDPOINTS.JOBS.GET(id))
    );
  }

  // Contacts
  async getContacts() {
    return equipmentCache.get('all-contacts', () => 
      this.request(API_CONFIG.ENDPOINTS.CONTACTS.LIST)
    );
  }

  // Mutations (not cached)
  async createEquipment(data: any) {
    const result = await this.request(API_CONFIG.ENDPOINTS.EQUIPMENT.CREATE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    equipmentCache.invalidate('all-equipment');
    return result;
  }

  async updateEquipment(id: string, data: any) {
    const result = await this.request(API_CONFIG.ENDPOINTS.EQUIPMENT.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    equipmentCache.invalidate('all-equipment');
    equipmentCache.invalidate(`equipment-${id}`);
    return result;
  }

  async deleteEquipment(id: string) {
    const result = await this.request(API_CONFIG.ENDPOINTS.EQUIPMENT.UPDATE(id), {
      method: 'DELETE',
    });
    equipmentCache.invalidate('all-equipment');
    equipmentCache.invalidate(`equipment-${id}`);
    return result;
  }
}

export const fixedApiClient = new FixedApiClient();