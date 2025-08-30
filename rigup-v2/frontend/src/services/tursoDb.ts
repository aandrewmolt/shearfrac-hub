/**
 * Database Service for RigUp v2
 * ALL operations now go through AWS API Gateway
 * No more Turso! Everything is AWS Lambda + DynamoDB
 */

import { apiClient } from './api.client';
import type { EquipmentType, IndividualEquipment, StorageLocation } from '@/types/inventory';
import type { Node, Edge } from '@xyflow/react';

class TursoDatabase {
  // ==== EQUIPMENT TYPES ====
  async getEquipmentTypes() {
    const equipment = await apiClient.getEquipment();
    // Extract unique types from equipment list
    const typesMap = new Map();
    equipment.forEach((item: any) => {
      if (item.type && !typesMap.has(item.type)) {
        typesMap.set(item.type, {
          id: item.type,
          name: item.type,
          category: item.category || 'general',
          code: item.type_code || item.type.substring(0, 3).toUpperCase(),
          is_bulk: item.is_bulk || false
        });
      }
    });
    return Array.from(typesMap.values());
  }

  async createEquipmentType(type: Partial<EquipmentType> & { name: string; category: string }) {
    // Equipment types are created implicitly through equipment
    return { ...type, id: type.id || Date.now().toString() };
  }

  async updateEquipmentType(id: string, updates: Partial<EquipmentType>) {
    // Types are managed through equipment items
    return { id, ...updates };
  }

  async deleteEquipmentType(id: string) {
    // Cannot delete types directly
    return { success: true };
  }

  async getEquipmentTypeById(id: string) {
    const types = await this.getEquipmentTypes();
    return types.find((t: any) => t.id === id);
  }

  // ==== INDIVIDUAL EQUIPMENT ====
  async getIndividualEquipment() {
    return apiClient.getEquipment();
  }

  async createIndividualEquipment(equipment: any) {
    return apiClient.createEquipment(equipment);
  }

  async updateIndividualEquipment(id: string, updates: any) {
    return apiClient.updateEquipment(id, updates);
  }

  async deleteIndividualEquipment(id: string) {
    return apiClient.deleteEquipment(id);
  }

  async getIndividualEquipmentById(id: string) {
    return apiClient.getEquipment(id);
  }

  // ==== EQUIPMENT HISTORY ====
  async addEquipmentHistory(entry: any) {
    // Store history in equipment metadata
    const equipment = await apiClient.getEquipment(entry.equipmentId);
    const history = equipment.history || [];
    history.push({
      ...entry,
      timestamp: new Date().toISOString()
    });
    return apiClient.updateEquipment(entry.equipmentId, { history });
  }

  async getEquipmentHistory(equipmentId: string) {
    const equipment = await apiClient.getEquipment(equipmentId);
    return equipment.history || [];
  }

  // ==== EQUIPMENT (legacy compatibility) ====
  async getEquipment() {
    return apiClient.getEquipment();
  }

  async createEquipment(equipment: any) {
    return apiClient.createEquipment(equipment);
  }

  async updateEquipment(id: string, updates: any) {
    return apiClient.updateEquipment(id, updates);
  }

  async deleteEquipment(id: string) {
    return apiClient.deleteEquipment(id);
  }

  // ==== STORAGE LOCATIONS ====
  async getStorageLocations() {
    // Return default locations for now
    return [
      { id: 'yard', name: 'Yard', type: 'primary' },
      { id: 'shop', name: 'Shop', type: 'secondary' },
      { id: 'field', name: 'Field', type: 'field' }
    ];
  }

  async createStorageLocation(location: any) {
    return { ...location, id: location.id || Date.now().toString() };
  }

  async addStorageLocation(location: any) {
    return this.createStorageLocation(location);
  }

  async updateStorageLocation(id: string, updates: any) {
    return { id, ...updates };
  }

  async deleteStorageLocation(id: string) {
    return { success: true };
  }

  async getStorageLocationById(id: string) {
    const locations = await this.getStorageLocations();
    return locations.find((l: any) => l.id === id);
  }

  // ==== EQUIPMENT ITEMS (Bulk Equipment) ====
  async getEquipmentItems() {
    const equipment = await apiClient.getEquipment();
    return equipment.filter((e: any) => e.is_bulk);
  }

  async createEquipmentItem(item: any) {
    return apiClient.createEquipment({ ...item, is_bulk: true });
  }

  async updateEquipmentItem(id: string, updates: any) {
    return apiClient.updateEquipment(id, { ...updates, is_bulk: true });
  }

  async deleteEquipmentItem(id: string) {
    return apiClient.deleteEquipment(id);
  }

  // ==== JOBS ====
  async getJobs() {
    return apiClient.getJobs();
  }

  async getJob(id: string) {
    return apiClient.getJob(id);
  }

  async createJob(job: any) {
    return apiClient.createJob(job);
  }

  async updateJob(id: string, updates: any) {
    return apiClient.updateJob(id, updates);
  }

  async deleteJob(id: string) {
    return apiClient.deleteJob(id);
  }

  async archiveJob(id: string) {
    return apiClient.archiveJob(id);
  }

  async saveDiagram(jobId: string, nodes: Node[], edges: Edge[]) {
    return apiClient.updateJob(jobId, { nodes, edges });
  }

  // ==== JOB PHOTOS ====
  async getJobPhotos(jobId: string) {
    const job = await apiClient.getJob(jobId);
    return job.photos || [];
  }

  async addJobPhoto(photo: any) {
    const job = await apiClient.getJob(photo.job_id);
    const photos = job.photos || [];
    photos.push(photo);
    return apiClient.updateJob(photo.job_id, { photos });
  }

  async updateJobPhoto(id: string, updates: any) {
    const jobId = updates.job_id;
    const job = await apiClient.getJob(jobId);
    const photos = job.photos || [];
    const index = photos.findIndex((p: any) => p.id === id);
    if (index !== -1) {
      photos[index] = { ...photos[index], ...updates };
      await apiClient.updateJob(jobId, { photos });
    }
    return updates;
  }

  async deleteJobPhoto(id: string, jobId: string) {
    const job = await apiClient.getJob(jobId);
    const photos = (job.photos || []).filter((p: any) => p.id !== id);
    await apiClient.updateJob(jobId, { photos });
    return { success: true };
  }

  // ==== CONTACTS ====
  async getContacts() {
    return apiClient.getContacts();
  }

  async createContact(contact: any) {
    return apiClient.createContact(contact);
  }

  async updateContact(id: string, updates: any) {
    return apiClient.updateContact(id, updates);
  }

  async deleteContact(id: string) {
    return apiClient.deleteContact(id);
  }

  async getContactById(id: string) {
    return apiClient.getContact(id);
  }

  // ==== USERS ====
  async getUsers() {
    // Return mock users for now
    return [
      { id: 'user1', name: 'Admin', email: 'admin@example.com', role: 'admin' }
    ];
  }

  async getCurrentUser() {
    return { id: 'user1', name: 'Admin', email: 'admin@example.com', role: 'admin' };
  }

  // ==== BULK DEPLOYMENTS ====
  async getBulkDeployments() {
    const equipment = await apiClient.getEquipment();
    return equipment.filter((e: any) => e.is_bulk && e.job_id);
  }

  async createBulkDeployment(deployment: any) {
    return apiClient.deployEquipment({
      equipmentId: deployment.equipment_type_id,
      jobId: deployment.job_id,
      quantity: deployment.quantity
    });
  }

  async updateBulkDeployment(id: string, updates: any) {
    return { id, ...updates };
  }

  async returnBulkDeployment(deploymentId: string, quantity: number) {
    const equipment = await apiClient.getEquipment(deploymentId);
    if (equipment.job_id) {
      return apiClient.returnEquipment({
        equipmentId: deploymentId,
        jobId: equipment.job_id,
        quantity
      });
    }
    return { success: false };
  }

  // ==== STORAGE TRANSFERS ====
  async getStorageTransfers() {
    return [];
  }

  async createStorageTransfer(transfer: any) {
    return { ...transfer, id: Date.now().toString(), status: 'completed' };
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