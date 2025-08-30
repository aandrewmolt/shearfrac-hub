/**
 * API Client for RigUp v2 Backend
 * Handles all communication with Express/ClickUp backend
 */

import { API_CONFIG, getAuthHeaders } from './api.config';

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: response.statusText,
        }));
        throw new Error(error.message || `Request failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error(`API Request failed: ${endpoint}`, error);
      throw error;
    }
  }
  
  // Jobs
  async getJobs() {
    return this.request(API_CONFIG.ENDPOINTS.JOBS.LIST);
  }
  
  async getJob(id: string) {
    return this.request(API_CONFIG.ENDPOINTS.JOBS.GET(id));
  }
  
  async createJob(job: any) {
    return this.request(API_CONFIG.ENDPOINTS.JOBS.CREATE, {
      method: 'POST',
      body: JSON.stringify(job),
    });
  }
  
  async updateJob(id: string, updates: any) {
    return this.request(API_CONFIG.ENDPOINTS.JOBS.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
  
  async archiveJob(id: string) {
    // For now, archiving is the same as deleting
    return this.deleteJob(id);
  }
  
  // Job Diagrams
  async saveDiagram(jobId: string, diagram: any) {
    return this.request(API_CONFIG.ENDPOINTS.JOBS.DIAGRAM(jobId), {
      method: 'PUT',
      body: JSON.stringify(diagram),
    });
  }
  
  async getDiagram(jobId: string) {
    return this.request(API_CONFIG.ENDPOINTS.JOBS.DIAGRAM(jobId));
  }
  
  // Equipment - with proper equipment code support
  async getEquipment(id?: string) {
    if (id) {
      return this.request(API_CONFIG.ENDPOINTS.EQUIPMENT.GET(id));
    }
    return this.request(API_CONFIG.ENDPOINTS.EQUIPMENT.LIST);
  }
  
  async getEquipmentItem(id: string) {
    return this.request(API_CONFIG.ENDPOINTS.EQUIPMENT.GET(id));
  }
  
  async createEquipment(equipment: any) {
    return this.request(API_CONFIG.ENDPOINTS.EQUIPMENT.CREATE, {
      method: 'POST',
      body: JSON.stringify(equipment),
    });
  }
  
  async updateEquipment(id: string, updates: any) {
    return this.request(API_CONFIG.ENDPOINTS.EQUIPMENT.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
  
  async deleteEquipment(id: string) {
    return this.request(API_CONFIG.ENDPOINTS.EQUIPMENT.UPDATE_STATUS(id), {
      method: 'PATCH',
      body: JSON.stringify({ status: 'retired' }),
    });
  }
  
  async updateEquipmentStatus(equipmentId: string, status: string, jobId?: string) {
    return this.request(API_CONFIG.ENDPOINTS.EQUIPMENT.UPDATE_STATUS(equipmentId), {
      method: 'PATCH',
      body: JSON.stringify({ status, jobId }),
    });
  }
  
  async deployEquipment(params: { equipmentId?: string; equipmentIds?: string[]; jobId: string; quantity?: number; notes?: string }) {
    const body = params.equipmentId 
      ? { equipmentId: params.equipmentId, jobId: params.jobId, quantity: params.quantity || 1 }
      : { equipmentIds: params.equipmentIds, jobId: params.jobId, notes: params.notes };
    
    return this.request(API_CONFIG.ENDPOINTS.EQUIPMENT.DEPLOY, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
  
  async returnEquipment(params: { equipmentId?: string; deploymentId?: string; equipmentIds?: string[]; jobId?: string; quantity?: number }) {
    const body = params.equipmentId
      ? { equipmentId: params.equipmentId, jobId: params.jobId, quantity: params.quantity || 1 }
      : { deploymentId: params.deploymentId, equipmentIds: params.equipmentIds };
    
    return this.request(API_CONFIG.ENDPOINTS.EQUIPMENT.RETURN, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }
  
  // Contacts
  async getContacts() {
    return this.request(API_CONFIG.ENDPOINTS.CONTACTS.LIST);
  }
  
  async getContact(id: string) {
    return this.request(API_CONFIG.ENDPOINTS.CONTACTS.GET(id));
  }
  
  async createContact(contact: any) {
    return this.request(API_CONFIG.ENDPOINTS.CONTACTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(contact),
    });
  }
  
  async updateContact(id: string, updates: any) {
    return this.request(API_CONFIG.ENDPOINTS.CONTACTS.UPDATE(id), {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
  
  // Delete contact
  async deleteContact(id: string) {
    return this.request(API_CONFIG.ENDPOINTS.CONTACTS.DELETE(id), {
      method: 'DELETE',
    });
  }
  
  // Clients (for managing client names)
  async getClients() {
    return this.request(API_CONFIG.ENDPOINTS.CLIENTS.LIST);
  }
  
  async createClient(name: string) {
    return this.request(API_CONFIG.ENDPOINTS.CLIENTS.CREATE, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }
  
  // Delete job
  async deleteJob(id: string) {
    return this.request(API_CONFIG.ENDPOINTS.JOBS.DELETE(id), {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();