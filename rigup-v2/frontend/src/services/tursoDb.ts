/**
 * Database Service for RigUp v2
 * ALL operations now go through AWS API Gateway
 * No more Turso! Everything is AWS Lambda + DynamoDB
 */

import { apiClient } from './api.client';
import { equipmentCache } from './equipmentCache';
import type { EquipmentType, IndividualEquipment, StorageLocation } from '@/types/inventory';
import type { Node, Edge } from '@xyflow/react';

class TursoDatabase {
  // Removed local cache - now using singleton equipmentCache service
  // ==== EQUIPMENT TYPES ====
  async getEquipmentTypes() {
    // FIXED: Return static types instead of fetching all equipment
    // This prevents the inefficient pattern of downloading entire inventory
    return equipmentCache.get('turso-equipment-types', async () => {
      console.log('[TursoDb] Returning static equipment types (no API call)');
      return [
        { id: 'shearstream', name: 'Shearstream Box', category: 'main', code: 'SS', is_bulk: false },
        { id: 'cable-tester', name: 'Cable Tester', category: 'testing', code: 'CT', is_bulk: false },
        { id: 'satellite', name: 'Satellite', category: 'communication', code: 'SAT', is_bulk: false },
        { id: 'gauge', name: 'Gauge', category: 'monitoring', code: 'G', is_bulk: false },
        { id: 'server', name: 'Server', category: 'computing', code: 'SRV', is_bulk: false },
        { id: 'junction-box', name: 'Junction Box', category: 'connectivity', code: 'JB', is_bulk: false },
        { id: 'starlink', name: 'Starlink', category: 'communication', code: 'SL', is_bulk: false }
      ];
    });
  }
  
  // Helper method to get cached equipment data
  private async getCachedEquipment() {
    // Use the singleton equipment cache to prevent duplicate requests
    return equipmentCache.get('turso-equipment-list', async () => {
      console.log('[TursoDb] Fetching equipment from API...');
      return await apiClient.getEquipment();
    });
  }

  async createEquipmentType(type: Partial<EquipmentType> & { name: string; category: string }) {
    // Equipment types are created implicitly through equipment
    // Invalidate types cache when creating new type
    equipmentCache.invalidate('turso-equipment-types');
    return { ...type, id: type.id || Date.now().toString() };
  }

  async updateEquipmentType(id: string, updates: Partial<EquipmentType>) {
    // Types are managed through equipment items
    // Invalidate types cache when updating type
    equipmentCache.invalidate('turso-equipment-types');
    return { id, ...updates };
  }

  async deleteEquipmentType(id: string) {
    // Cannot delete types directly
    // Invalidate types cache when deleting type
    equipmentCache.invalidate('turso-equipment-types');
    return { success: true };
  }

  async getEquipmentTypeById(id: string) {
    const types = await this.getEquipmentTypes();
    return types.find((t: any) => t.id === id);
  }

  // ==== INDIVIDUAL EQUIPMENT ====
  async getIndividualEquipment() {
    // Use cached equipment to prevent request storms
    return this.getCachedEquipment();
  }

  async createIndividualEquipment(equipment: any) {
    const result = await apiClient.createEquipment(equipment);
    // Invalidate both caches after create
    equipmentCache.invalidate('turso-equipment-list');
    equipmentCache.invalidate('turso-equipment-types');
    return result;
  }

  async updateIndividualEquipment(id: string, updates: any) {
    const result = await apiClient.updateEquipment(id, updates);
    // Invalidate both caches after update
    equipmentCache.invalidate('turso-equipment-list');
    equipmentCache.invalidate('turso-equipment-types');
    return result;
  }

  async deleteIndividualEquipment(id: string) {
    const result = await apiClient.deleteEquipment(id);
    // Invalidate both caches after delete
    equipmentCache.invalidate('turso-equipment-list');
    equipmentCache.invalidate('turso-equipment-types');
    return result;
  }

  async getIndividualEquipmentById(id: string) {
    // Get from cached list to avoid individual API calls
    const equipment = await this.getCachedEquipment();
    return equipment.find((item: any) => item.id === id || item.equipmentId === id);
  }

  // ==== EQUIPMENT HISTORY ====
  async addEquipmentHistory(entry: any) {
    // Store history in equipment metadata
    const equipment = await this.getIndividualEquipmentById(entry.equipmentId);
    const history = equipment?.history || [];
    history.push({
      ...entry,
      timestamp: new Date().toISOString()
    });
    const result = await apiClient.updateEquipment(entry.equipmentId, { history });
    // Invalidate cache after adding history
    equipmentCache.invalidate('turso-equipment-list');
    return result;
  }

  async getEquipmentHistory(equipmentId: string) {
    const equipment = await this.getIndividualEquipmentById(equipmentId);
    return equipment?.history || [];
  }

  // ==== EQUIPMENT (legacy compatibility) ====
  async getEquipment() {
    // Use cached equipment to prevent request storms
    return this.getCachedEquipment();
  }

  async createEquipment(equipment: any) {
    const result = await apiClient.createEquipment(equipment);
    // Invalidate caches after create
    equipmentCache.invalidate('turso-equipment-list');
    equipmentCache.invalidate('turso-equipment-types');
    return result;
  }

  async updateEquipment(id: string, updates: any) {
    const result = await apiClient.updateEquipment(id, updates);
    // Invalidate caches after update
    equipmentCache.invalidate('turso-equipment-list');
    equipmentCache.invalidate('turso-equipment-types');
    return result;
  }

  async deleteEquipment(id: string) {
    const result = await apiClient.deleteEquipment(id);
    // Invalidate caches after delete
    equipmentCache.invalidate('turso-equipment-list');
    equipmentCache.invalidate('turso-equipment-types');
    return result;
  }

  // ==== STORAGE LOCATIONS ====
  async getStorageLocations() {
    // Cache storage locations to prevent repeated calls
    return equipmentCache.get('turso-storage-locations', async () => {
      console.log('[TursoDb] Getting storage locations...');
      // Return default locations for now
      return [
        { id: 'yard', name: 'Yard', type: 'primary' },
        { id: 'shop', name: 'Shop', type: 'secondary' },
        { id: 'field', name: 'Field', type: 'field' }
      ];
    });
  }

  async createStorageLocation(location: any) {
    const result = { ...location, id: location.id || Date.now().toString() };
    // Invalidate storage locations cache
    equipmentCache.invalidate('turso-storage-locations');
    return result;
  }

  async addStorageLocation(location: any) {
    return this.createStorageLocation(location);
  }

  async updateStorageLocation(id: string, updates: any) {
    const result = { id, ...updates };
    // Invalidate storage locations cache
    equipmentCache.invalidate('turso-storage-locations');
    return result;
  }

  async deleteStorageLocation(id: string) {
    // Invalidate storage locations cache
    equipmentCache.invalidate('turso-storage-locations');
    return { success: true };
  }

  async getStorageLocationById(id: string) {
    const locations = await this.getStorageLocations();
    return locations.find((l: any) => l.id === id);
  }

  // ==== EQUIPMENT ITEMS (Bulk Equipment) ====
  async getEquipmentItems() {
    const equipment = await this.getCachedEquipment();
    return equipment.filter((e: any) => e.is_bulk);
  }

  async createEquipmentItem(item: any) {
    const result = await apiClient.createEquipment({ ...item, is_bulk: true });
    // Invalidate caches after create
    equipmentCache.invalidate('turso-equipment-list');
    equipmentCache.invalidate('turso-equipment-types');
    return result;
  }

  async updateEquipmentItem(id: string, updates: any) {
    const result = await apiClient.updateEquipment(id, { ...updates, is_bulk: true });
    // Invalidate caches after update
    equipmentCache.invalidate('turso-equipment-list');
    equipmentCache.invalidate('turso-equipment-types');
    return result;
  }

  async deleteEquipmentItem(id: string) {
    const result = await apiClient.deleteEquipment(id);
    // Invalidate caches after delete
    equipmentCache.invalidate('turso-equipment-list');
    equipmentCache.invalidate('turso-equipment-types');
    return result;
  }

  // ==== JOBS ====
  async getJobs() {
    // Cache jobs to prevent request storms
    return equipmentCache.get('turso-jobs-list', async () => {
      console.log('[TursoDb] Fetching jobs from API...');
      return await apiClient.getJobs();
    });
  }

  async getJob(id: string) {
    // Get from cached list to avoid individual API calls
    const jobs = await this.getJobs();
    return jobs.find((job: any) => job.id === id);
  }
  
  // Alias for compatibility
  async getJobById(id: string) {
    return this.getJob(id);
  }

  async createJob(job: any) {
    const result = await apiClient.createJob(job);
    // Invalidate cache after create
    equipmentCache.invalidate('turso-jobs-list');
    return result;
  }

  async updateJob(id: string, updates: any) {
    const result = await apiClient.updateJob(id, updates);
    // Invalidate cache after update
    equipmentCache.invalidate('turso-jobs-list');
    return result;
  }

  async deleteJob(id: string) {
    const result = await apiClient.deleteJob(id);
    // Invalidate cache after delete
    equipmentCache.invalidate('turso-jobs-list');
    return result;
  }

  async archiveJob(id: string) {
    const result = await apiClient.archiveJob(id);
    // Invalidate cache after archive
    equipmentCache.invalidate('turso-jobs-list');
    return result;
  }

  async saveDiagram(jobId: string, nodes: Node[], edges: Edge[]) {
    const result = await apiClient.updateJob(jobId, { nodes, edges });
    // Invalidate jobs cache after diagram save
    equipmentCache.invalidate('turso-jobs-list');
    return result;
  }

  // ==== JOB PHOTOS ====
  async getJobPhotos(jobId: string) {
    const job = await this.getJob(jobId);
    return job?.photos || [];
  }

  async addJobPhoto(photo: any) {
    const job = await this.getJob(photo.job_id);
    const photos = job?.photos || [];
    photos.push(photo);
    const result = await apiClient.updateJob(photo.job_id, { photos });
    // Invalidate jobs cache after adding photo
    equipmentCache.invalidate('turso-jobs-list');
    return result;
  }

  async updateJobPhoto(id: string, updates: any) {
    const jobId = updates.job_id;
    const job = await this.getJob(jobId);
    const photos = job?.photos || [];
    const index = photos.findIndex((p: any) => p.id === id);
    if (index !== -1) {
      photos[index] = { ...photos[index], ...updates };
      await apiClient.updateJob(jobId, { photos });
      // Invalidate jobs cache after updating photo
      equipmentCache.invalidate('turso-jobs-list');
    }
    return updates;
  }

  async deleteJobPhoto(id: string, jobId: string) {
    const job = await this.getJob(jobId);
    const photos = (job?.photos || []).filter((p: any) => p.id !== id);
    await apiClient.updateJob(jobId, { photos });
    // Invalidate jobs cache after deleting photo
    equipmentCache.invalidate('turso-jobs-list');
    return { success: true };
  }

  // ==== CONTACTS ====
  async getContacts() {
    // Cache contacts to prevent request storms
    return equipmentCache.get('turso-contacts-list', async () => {
      console.log('[TursoDb] Fetching contacts from API...');
      return await apiClient.getContacts();
    });
  }

  async createContact(contact: any) {
    const result = await apiClient.createContact(contact);
    // Invalidate cache after create
    equipmentCache.invalidate('turso-contacts-list');
    return result;
  }

  async updateContact(id: string, updates: any) {
    const result = await apiClient.updateContact(id, updates);
    // Invalidate cache after update
    equipmentCache.invalidate('turso-contacts-list');
    return result;
  }

  async deleteContact(id: string) {
    const result = await apiClient.deleteContact(id);
    // Invalidate cache after delete
    equipmentCache.invalidate('turso-contacts-list');
    return result;
  }

  async getContactById(id: string) {
    // Get from cached list to avoid individual API calls
    const contacts = await this.getContacts();
    return contacts.find((contact: any) => contact.id === id);
  }

  // ==== USERS ====
  async getUsers() {
    // Cache users to prevent repeated calls
    return equipmentCache.get('turso-users-list', async () => {
      console.log('[TursoDb] Getting users...');
      // Return mock users for now
      return [
        { id: 'user1', name: 'Admin', email: 'admin@example.com', role: 'admin' }
      ];
    });
  }

  async getCurrentUser() {
    // Cache current user to prevent repeated calls
    return equipmentCache.get('turso-current-user', async () => {
      console.log('[TursoDb] Getting current user...');
      return { id: 'user1', name: 'Admin', email: 'admin@example.com', role: 'admin' };
    });
  }

  // ==== BULK DEPLOYMENTS ====
  async getBulkDeployments() {
    const equipment = await this.getCachedEquipment();
    return equipment.filter((e: any) => e.is_bulk && e.job_id);
  }

  async createBulkDeployment(deployment: any) {
    const result = await apiClient.deployEquipment({
      equipmentId: deployment.equipment_type_id,
      jobId: deployment.job_id,
      quantity: deployment.quantity
    });
    // Invalidate equipment cache after deployment
    equipmentCache.invalidate('turso-equipment-list');
    return result;
  }

  async updateBulkDeployment(id: string, updates: any) {
    // Invalidate equipment cache after update
    equipmentCache.invalidate('turso-equipment-list');
    return { id, ...updates };
  }

  async returnBulkDeployment(deploymentId: string, quantity: number) {
    const equipment = await this.getIndividualEquipmentById(deploymentId);
    if (equipment?.job_id) {
      const result = await apiClient.returnEquipment({
        equipmentId: deploymentId,
        jobId: equipment.job_id,
        quantity
      });
      // Invalidate equipment cache after return
      equipmentCache.invalidate('turso-equipment-list');
      return result;
    }
    return { success: false };
  }

  // ==== STORAGE TRANSFERS ====
  async getStorageTransfers() {
    // Cache storage transfers to prevent repeated calls
    return equipmentCache.get('turso-storage-transfers', async () => {
      console.log('[TursoDb] Getting storage transfers...');
      return [];
    });
  }

  async createStorageTransfer(transfer: any) {
    const result = { ...transfer, id: Date.now().toString(), status: 'completed' };
    // Invalidate transfers cache
    equipmentCache.invalidate('turso-storage-transfers');
    return result;
  }

  // ==== LEGACY COMPATIBILITY - These should not be used! ====
  async execute(sql: string | { sql: string; args?: any[] }) {
    console.error('❌ TURSO EXECUTE CALLED - This should not happen!');
    console.error('SQL:', sql);
    throw new Error('Direct database access is not allowed. Use AWS API instead.');
  }

  async batch(queries: any[]) {
    console.error('❌ TURSO BATCH CALLED - This should not happen!');
    throw new Error('Batch operations not supported. Use individual AWS API calls.');
  }
}

// Create singleton instance
const tursoDatabase = new TursoDatabase();

// Export as tursoDb for backward compatibility
export const tursoDb = tursoDatabase;
export const turso = tursoDatabase;

// Export for services that import the class
export default tursoDatabase;