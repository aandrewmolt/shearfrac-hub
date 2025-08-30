/**
 * Edge Function Sync Service
 * Handles synchronization with Vercel Edge Functions for Turso database
 */

const API_BASE = import.meta.env.VITE_SYNC_API_BASE || '/api';
const SYNC_PROVIDER = import.meta.env.VITE_SYNC_PROVIDER || 'vercel-turso';

// Check if edge functions are configured
export const isEdgeSyncEnabled = () => {
  return SYNC_PROVIDER === 'vercel-turso' && API_BASE;
};

// Health check for sync service
export const checkSyncHealth = async (): Promise<{ healthy: boolean; message: string }> => {
  if (!isEdgeSyncEnabled()) {
    return { healthy: false, message: 'Sync not configured' };
  }
  
  // Check if we're in development mode
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isDevelopment) {
    // In development, edge functions don't work - show appropriate message
    return { 
      healthy: false, 
      message: 'Edge functions only work in production (Vercel)' 
    };
  }
  
  try {
    // Try to fetch from the test endpoint
    const response = await fetch(`${API_BASE}/test-turso`);
    if (!response.ok) {
      return { healthy: false, message: `Server error: ${response.status}` };
    }
    
    const data = await response.json();
    if (data.success) {
      return { healthy: true, message: 'Connected to database' };
    } else {
      return { healthy: false, message: data.message || 'Database connection failed' };
    }
  } catch (error) {
    return { healthy: false, message: 'Cannot reach sync service' };
  }
};

// Helper to make API requests with proper error handling
async function apiRequest(
  endpoint: string, 
  options: RequestInit = {}
): Promise<any> {
  try {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Edge function error (${endpoint}):`, error);
    throw error;
  }
}

// Equipment sync functions (using v3 API with normalization)
export const equipmentSync = {
  // Get all equipment
  async getAll() {
    return apiRequest('/sync-equipment-v3');
  },

  // Get equipment by ID
  async getById(id: string) {
    return apiRequest(`/sync-equipment-v3?id=${id}`);
  },

  // Get deployed equipment for a job
  async getDeployedForJob(jobId: string) {
    return apiRequest(`/sync-equipment-v3?type=deployed&jobId=${jobId}`);
  },

  // Create new equipment
  async create(equipment: {
    equipmentId: string;
    name: string;
    typeId: string;
    locationId: string;
    status?: string;
  }) {
    return apiRequest('/sync-equipment-v3', {
      method: 'POST',
      body: JSON.stringify(equipment),
    });
  },

  // Update equipment
  async update(id: string, updates: Record<string, any>) {
    return apiRequest(`/sync-equipment-v3?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Allocate equipment to job
  async allocate(equipmentId: string, jobId: string, nodeId?: string) {
    return apiRequest('/sync-equipment-v3?action=allocate', {
      method: 'POST',
      body: JSON.stringify({ equipmentId, jobId, nodeId }),
    });
  },

  // Deallocate equipment from job
  async deallocate(equipmentId: string) {
    return apiRequest('/sync-equipment-v3?action=deallocate', {
      method: 'POST',
      body: JSON.stringify({ equipmentId }),
    });
  },

  // Batch update equipment status
  async batchUpdateStatus(equipmentIds: string[], status: string, jobId?: string) {
    return apiRequest('/sync-equipment-v3?action=sync-status', {
      method: 'POST',
      body: JSON.stringify({ equipmentIds, status, jobId }),
    });
  },

  // Delete equipment (soft delete)
  async delete(id: string) {
    return apiRequest(`/sync-equipment-v3?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// Contact sync functions
export const contactSync = {
  // Get all contacts
  async getAll() {
    return apiRequest('/contacts');
  },

  // Get contact by ID
  async getById(id: string) {
    return apiRequest(`/contacts?id=${id}`);
  },

  // Get contacts for a job
  async getByJob(jobId: string) {
    return apiRequest(`/contacts?jobId=${jobId}`);
  },

  // Create new contact
  async create(contact: {
    type: string;
    name: string;
    company?: string;
    title?: string;
    phone?: string;
    email?: string;
    job?: string;
    crew?: string;
    shift?: string;
    notes?: string;
    jobAssignments?: any[];
  }) {
    return apiRequest('/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    });
  },

  // Update contact
  async update(id: string, updates: Record<string, any>) {
    return apiRequest(`/contacts?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Assign contact to job
  async assignToJob(contactId: string, jobId: string, jobName?: string, client?: string) {
    return apiRequest('/contacts?action=assign-job', {
      method: 'POST',
      body: JSON.stringify({ contactId, jobId, jobName, client }),
    });
  },

  // Unassign contact from job
  async unassignFromJob(contactId: string, jobId: string) {
    return apiRequest('/contacts?action=unassign-job', {
      method: 'POST',
      body: JSON.stringify({ contactId, jobId }),
    });
  },

  // Delete contact
  async delete(id: string) {
    return apiRequest(`/contacts?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// Job sync functions
export const jobSync = {
  // Get all jobs
  async getAll() {
    return apiRequest('/jobs');
  },

  // Get job by ID with equipment
  async getById(id: string) {
    return apiRequest(`/jobs?id=${id}`);
  },

  // Get jobs by status
  async getByStatus(status: string) {
    return apiRequest(`/jobs?status=${status}`);
  },

  // Create or update job
  async save(job: {
    id: string;
    name: string;
    client?: string;
    location?: string;
    wellCount?: number;
    hasWellsideGauge?: boolean;
    status?: string;
    diagramData?: any;
  }) {
    return apiRequest('/jobs', {
      method: 'POST',
      body: JSON.stringify(job),
    });
  },

  // Update job
  async update(id: string, updates: Record<string, any>) {
    return apiRequest(`/jobs?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete job
  async delete(id: string) {
    return apiRequest(`/jobs?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// Conflict resolution
export const conflictSync = {
  // Detect conflicts for equipment
  async detectEquipmentConflicts(equipmentId: string, localData: any) {
    try {
      const remoteData = await equipmentSync.getById(equipmentId);
      
      if (!remoteData.data) {
        return { hasConflict: false };
      }

      // Compare timestamps or version numbers
      const localTimestamp = new Date(localData.updatedAt || 0).getTime();
      const remoteTimestamp = new Date(remoteData.data.updated_at || 0).getTime();

      if (remoteTimestamp > localTimestamp && localData.status !== remoteData.data.status) {
        return {
          hasConflict: true,
          local: localData,
          remote: remoteData.data,
          type: 'status_mismatch'
        };
      }

      return { hasConflict: false };
    } catch (error) {
      console.error('Conflict detection error:', error);
      return { hasConflict: false, error };
    }
  },

  // Resolve conflict
  async resolveConflict(
    equipmentId: string, 
    resolution: 'local' | 'remote',
    localData?: any
  ) {
    if (resolution === 'local' && localData) {
      // Push local changes to remote
      return equipmentSync.update(equipmentId, localData);
    }
    // If remote, just fetch latest
    return equipmentSync.getById(equipmentId);
  }
};

// Sync queue for offline support
class SyncQueue {
  private queue: Array<{
    id: string;
    type: 'equipment' | 'job' | 'contact';
    action: 'create' | 'update' | 'delete' | 'assign' | 'unassign';
    data: any;
    timestamp: number;
  }> = [];

  constructor() {
    // Load queue from localStorage
    const saved = localStorage.getItem('syncQueue');
    if (saved) {
      try {
        this.queue = JSON.parse(saved);
      } catch (error) {
        console.error('Failed to load sync queue:', error);
      }
    }
  }

  add(item: any) {
    this.queue.push({
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    });
    this.save();
  }

  private save() {
    localStorage.setItem('syncQueue', JSON.stringify(this.queue));
  }

  async process() {
    if (!navigator.onLine || !isEdgeSyncEnabled()) {
      return;
    }

    const completed: string[] = [];

    for (const item of this.queue) {
      try {
        if (item.type === 'equipment') {
          switch (item.action) {
            case 'create':
              await equipmentSync.create(item.data);
              break;
            case 'update':
              await equipmentSync.update(item.data.id, item.data);
              break;
            case 'delete':
              await equipmentSync.delete(item.data.id);
              break;
          }
        } else if (item.type === 'job') {
          switch (item.action) {
            case 'create':
            case 'update':
              await jobSync.save(item.data);
              break;
            case 'delete':
              await jobSync.delete(item.data.id);
              break;
          }
        } else if (item.type === 'contact') {
          switch (item.action) {
            case 'create':
              await contactSync.create(item.data);
              break;
            case 'update':
              await contactSync.update(item.data.id, item.data);
              break;
            case 'delete':
              await contactSync.delete(item.data.id);
              break;
            case 'assign':
              await contactSync.assignToJob(
                item.data.contactId,
                item.data.jobId,
                item.data.jobName,
                item.data.client
              );
              break;
            case 'unassign':
              await contactSync.unassignFromJob(
                item.data.contactId,
                item.data.jobId
              );
              break;
          }
        }
        
        completed.push(item.id);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
      }
    }

    // Remove completed items
    this.queue = this.queue.filter(item => !completed.includes(item.id));
    this.save();

    return {
      processed: completed.length,
      remaining: this.queue.length
    };
  }

  getQueue() {
    return [...this.queue];
  }

  clear() {
    this.queue = [];
    this.save();
  }
}

// Export singleton sync queue
export const syncQueue = new SyncQueue();

// Auto-sync when online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Back online - processing sync queue');
    syncQueue.process();
  });

  // Periodic sync every 5 minutes when online
  setInterval(() => {
    if (navigator.onLine && isEdgeSyncEnabled()) {
      syncQueue.process();
    }
  }, 5 * 60 * 1000);
}

export default {
  equipment: equipmentSync,
  jobs: jobSync,
  contacts: contactSync,
  conflicts: conflictSync,
  queue: syncQueue,
  isEnabled: isEdgeSyncEnabled
};