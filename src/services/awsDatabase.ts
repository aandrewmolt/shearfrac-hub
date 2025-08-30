/**
 * AWS Database Service - Replaces all Turso functionality
 * All database operations go through AWS Lambda/DynamoDB
 */

import awsApi from './awsApiService';
import type { Node, Edge } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid';

class AwsDatabase {
  // ==== JOBS ====
  async getJobs() {
    const jobs = await awsApi.jobs.list();
    return jobs.map(this.normalizeJob);
  }

  async getJob(id: string) {
    const job = await awsApi.jobs.get(id);
    return this.normalizeJob(job);
  }

  async createJob(job: any) {
    const jobData = this.prepareJobForAws(job);
    jobData.id = jobData.id || uuidv4();
    const newJob = await awsApi.jobs.create(jobData);
    return this.normalizeJob(newJob);
  }

  async updateJob(id: string, updates: any) {
    const jobData = this.prepareJobForAws(updates);
    const updatedJob = await awsApi.jobs.update(id, jobData);
    return this.normalizeJob(updatedJob);
  }

  async deleteJob(id: string) {
    await awsApi.jobs.delete(id);
    return { success: true };
  }

  async saveDiagram(jobId: string, nodes: Node[], edges: Edge[]) {
    const diagram = await awsApi.jobs.updateDiagram(jobId, { nodes, edges });
    return diagram;
  }

  // ==== EQUIPMENT ====
  async getEquipment() {
    const equipment = await awsApi.equipment.list();
    return equipment.map(this.normalizeEquipment);
  }

  async getEquipmentById(id: string) {
    const item = await awsApi.equipment.get(id);
    return this.normalizeEquipment(item);
  }

  async createEquipment(equipment: any) {
    const equipmentData = this.prepareEquipmentForAws(equipment);
    // Don't send id field to the API - let the server generate it
    delete equipmentData.id;
    const newItem = await awsApi.equipment.create(equipmentData);
    return this.normalizeEquipment(newItem);
  }

  async updateEquipment(id: string, updates: any) {
    const equipmentData = this.prepareEquipmentForAws(updates);
    const updated = await awsApi.equipment.update(id, equipmentData);
    return this.normalizeEquipment(updated);
  }

  async deleteEquipment(id: string) {
    // AWS doesn't delete, just marks as retired
    await awsApi.equipment.updateStatus(id, 'retired');
    return { success: true };
  }

  async updateEquipmentStatus(id: string, status: string) {
    const updated = await awsApi.equipment.updateStatus(id, status);
    return this.normalizeEquipment(updated);
  }

  async deployEquipment(equipmentId: string, jobId: string, quantity = 1) {
    return await awsApi.equipment.deploy({ equipmentId, jobId, quantity });
  }

  async returnEquipment(equipmentId: string, jobId: string, quantity = 1) {
    return await awsApi.equipment.return({ equipmentId, jobId, quantity });
  }

  // ==== EQUIPMENT TYPES (Map to Equipment with type field) ====
  async getEquipmentTypes() {
    const equipment = await awsApi.equipment.list();
    // Extract unique types
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

  async createEquipmentType(type: any) {
    // Equipment types are created implicitly when creating equipment
    return { ...type, id: type.id || uuidv4() };
  }

  async addEquipmentType(type: any) {
    // Equipment types are created implicitly when creating equipment
    return { ...type, id: type.id || uuidv4() };
  }

  async updateEquipmentType(id: string, updates: any) {
    // Equipment types are managed through equipment items
    return { id, ...updates };
  }

  async deleteEquipmentType(id: string) {
    // Cannot delete types, only retire equipment
    return { success: true };
  }

  async getEquipmentTypeById(id: string) {
    const types = await this.getEquipmentTypes();
    return types.find((t: any) => t.id === id);
  }

  // ==== INDIVIDUAL EQUIPMENT (Maps to Equipment) ====
  async getIndividualEquipment() {
    return this.getEquipment();
  }

  async createIndividualEquipment(equipment: any) {
    return this.createEquipment(equipment);
  }
  
  async addIndividualEquipment(equipment: any) {
    return this.createEquipment(equipment);
  }

  async updateIndividualEquipment(id: string, updates: any) {
    return this.updateEquipment(id, updates);
  }

  async deleteIndividualEquipment(id: string) {
    return this.deleteEquipment(id);
  }

  async getIndividualEquipmentById(id: string) {
    return this.getEquipmentById(id);
  }

  // ==== STORAGE LOCATIONS ====
  async getStorageLocations() {
    // For now, return default locations
    return [
      { id: 'yard', name: 'Yard', type: 'primary' },
      { id: 'shop', name: 'Shop', type: 'secondary' },
      { id: 'field', name: 'Field', type: 'field' },
      { id: 'midland-office', name: 'Midland Office', type: 'primary' }
    ];
  }

  async createStorageLocation(location: any) {
    return { ...location, id: location.id || uuidv4() };
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
    const equipment = await this.getEquipment();
    return equipment.filter((e: any) => e.is_bulk);
  }

  async createEquipmentItem(item: any) {
    return this.createEquipment({ ...item, is_bulk: true });
  }

  async updateEquipmentItem(id: string, updates: any) {
    return this.updateEquipment(id, { ...updates, is_bulk: true });
  }

  async deleteEquipmentItem(id: string) {
    return this.deleteEquipment(id);
  }

  // ==== CONTACTS ====
  async getContacts() {
    return await awsApi.contacts.list();
  }

  async createContact(contact: any) {
    contact.id = contact.id || uuidv4();
    return await awsApi.contacts.create(contact);
  }

  async updateContact(id: string, updates: any) {
    return await awsApi.contacts.update(id, updates);
  }

  async deleteContact(id: string) {
    await awsApi.contacts.delete(id);
    return { success: true };
  }

  async getContactById(id: string) {
    return await awsApi.contacts.get(id);
  }

  async searchContacts(query: string) {
    // Simple client-side search for now - could be improved with backend search
    const allContacts = await this.getContacts();
    const lowerQuery = query.toLowerCase();
    return allContacts.filter(contact => 
      contact.name?.toLowerCase().includes(lowerQuery) ||
      contact.email?.toLowerCase().includes(lowerQuery) ||
      contact.company?.toLowerCase().includes(lowerQuery) ||
      contact.phone?.toLowerCase().includes(lowerQuery)
    );
  }

  // ==== PHOTOS ====
  async getJobPhotos(jobId: string) {
    const job = await awsApi.jobs.get(jobId);
    return job.photos || [];
  }

  async addJobPhoto(photo: any) {
    photo.id = photo.id || uuidv4();
    const job = await awsApi.jobs.get(photo.job_id);
    const photos = job.photos || [];
    photos.push(photo);
    await awsApi.jobs.update(photo.job_id, { photos });
    return photo;
  }

  async updateJobPhoto(id: string, updates: any) {
    const jobId = updates.job_id;
    const job = await awsApi.jobs.get(jobId);
    const photos = job.photos || [];
    const index = photos.findIndex((p: any) => p.id === id);
    if (index !== -1) {
      photos[index] = { ...photos[index], ...updates };
      await awsApi.jobs.update(jobId, { photos });
    }
    return updates;
  }

  async deleteJobPhoto(id: string, jobId: string) {
    const job = await awsApi.jobs.get(jobId);
    const photos = (job.photos || []).filter((p: any) => p.id !== id);
    await awsApi.jobs.update(jobId, { photos });
    return { success: true };
  }

  // ==== EQUIPMENT HISTORY ====
  async addEquipmentHistory(entry: any) {
    // Store history in equipment metadata
    const equipment = await this.getEquipmentById(entry.equipmentId);
    const history = equipment.history || [];
    history.push({
      ...entry,
      timestamp: new Date().toISOString()
    });
    await this.updateEquipment(entry.equipmentId, { history });
    return entry;
  }

  async getEquipmentHistory(equipmentId: string) {
    const equipment = await this.getEquipmentById(equipmentId);
    return equipment.history || [];
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
    // Map from equipment deployments
    const equipment = await this.getEquipment();
    return equipment.filter((e: any) => e.is_bulk && e.job_id);
  }

  async createBulkDeployment(deployment: any) {
    return await awsApi.equipment.deploy({
      equipmentId: deployment.equipment_type_id,
      jobId: deployment.job_id,
      quantity: deployment.quantity
    });
  }

  async updateBulkDeployment(id: string, updates: any) {
    return { id, ...updates };
  }

  async returnBulkDeployment(deploymentId: string, quantity: number) {
    // Find the deployment and return it
    const equipment = await this.getEquipmentById(deploymentId);
    if (equipment.job_id) {
      return await awsApi.equipment.return({
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
    return { ...transfer, id: uuidv4(), status: 'completed' };
  }

  // ==== LEGACY COMPATIBILITY ====
  async execute(sql: string | { sql: string; args?: any[] }) {
    console.warn('Legacy execute() called - AWS API does not support raw SQL');
    throw new Error('Raw SQL execution not supported with AWS API');
  }

  async batch(queries: any[]) {
    console.warn('Legacy batch() called - use individual AWS API calls instead');
    throw new Error('Batch operations not directly supported with AWS API');
  }

  // ==== HELPER METHODS ====
  private normalizeJob(job: any) {
    if (!job) return null;
    return {
      ...job,
      id: job.id || job.jobId,
      has_wellside_gauge: Boolean(job.has_wellside_gauge || job.hasWellsideGauge),
      equipment_allocated: Boolean(job.equipment_allocated || job.equipmentAllocated),
      nodes: job.nodes || [],
      edges: job.edges || [],
      photos: job.photos || [],
      company_computer_names: job.company_computer_names || job.companyComputerNames || {},
      equipment_assignment: job.equipment_assignment || job.equipmentAssignment || {},
      enhanced_config: job.enhanced_config || job.enhancedConfig || {},
      created_at: job.created_at || job.createdAt || new Date().toISOString(),
      updated_at: job.updated_at || job.updatedAt || new Date().toISOString(),
      wellCount: job.well_count || job.wellCount || 0,
      hasWellsideGauge: Boolean(job.has_wellside_gauge || job.hasWellsideGauge),
      companyComputerNames: job.company_computer_names || job.companyComputerNames || {},
      equipmentAssignment: job.equipment_assignment || job.equipmentAssignment || {},
      equipmentAllocated: Boolean(job.equipment_allocated || job.equipmentAllocated),
      enhancedConfig: job.enhanced_config || job.enhancedConfig || {},
      createdAt: job.created_at || job.createdAt,
      updatedAt: job.updated_at || job.updatedAt,
    };
  }

  private prepareJobForAws(job: any) {
    return {
      ...job,
      well_count: job.wellCount || job.well_count || 0,
      has_wellside_gauge: job.hasWellsideGauge || job.has_wellside_gauge || false,
      company_computer_names: job.companyComputerNames || job.company_computer_names || {},
      equipment_assignment: job.equipmentAssignment || job.equipment_assignment || {},
      equipment_allocated: job.equipmentAllocated || job.equipment_allocated || false,
      enhanced_config: job.enhancedConfig || job.enhanced_config || {},
      main_box_name: job.mainBoxName || job.main_box_name,
      satellite_name: job.satelliteName || job.satellite_name,
      wellside_gauge_name: job.wellsideGaugeName || job.wellside_gauge_name,
      selected_cable_type: job.selectedCableType || job.selected_cable_type || 'default_cable',
      frac_baud_rate: job.fracBaudRate || job.frac_baud_rate || 'RS485-19200',
      gauge_baud_rate: job.gaugeBaudRate || job.gauge_baud_rate || 'RS232-38400',
      frac_com_port: job.fracComPort || job.frac_com_port || 'COM1',
      gauge_com_port: job.gaugeComPort || job.gauge_com_port || 'COM2',
    };
  }

  private normalizeEquipment(item: any) {
    if (!item) return null;
    return {
      ...item,
      equipment_code: item.equipment_code || item.code,
      equipment_name: item.equipment_name || item.name,
      equipment_type: item.equipment_type || item.equipmentTypeId || item.type,
      equipmentId: item.equipment_code || item.code || item.id,
      equipmentTypeId: item.equipmentTypeId || item.type_id || item.equipment_type || item.type,
      storageLocationId: item.location_id || item.storage_location_id || 'yard',
      is_bulk: Boolean(item.is_bulk),
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      status: item.status || 'available',
    };
  }

  private prepareEquipmentForAws(equipment: any) {
    // Convert Date objects to ISO strings
    const toISOString = (date: any) => {
      if (date instanceof Date) {
        return date.toISOString();
      }
      return date || new Date().toISOString();
    };
    
    // Map from our internal field names to AWS API field names
    const prepared: any = {
      code: equipment.equipmentCode || equipment.equipmentId || equipment.equipment_code || equipment.code,
      name: equipment.name || equipment.equipment_name,
      equipmentTypeId: equipment.equipmentType || equipment.typeId || equipment.equipmentTypeId || equipment.equipment_type || equipment.type,
      is_bulk: equipment.is_bulk !== undefined ? equipment.is_bulk : false,
      status: equipment.status || 'available',
      location_id: equipment.location || equipment.locationId || equipment.storageLocationId || equipment.location_id || 'yard',
      serial_number: equipment.serialNumber || equipment.serial_number || '',
      notes: equipment.notes || '',
      created_at: toISOString(equipment.createdAt || equipment.created_at),
      updated_at: toISOString(equipment.lastUpdated || equipment.updated_at),
    };
    
    // Ensure required fields are present
    if (!prepared.code) {
      console.error('Missing code field in equipment data:', equipment);
      throw new Error(`Equipment code is required. Available fields: ${Object.keys(equipment).join(', ')}`);
    }
    
    if (!prepared.equipmentTypeId) {
      console.error('Missing equipmentTypeId field in equipment data:', equipment);
      throw new Error(`Equipment type is required. Available fields: ${Object.keys(equipment).join(', ')}`);
    }
    
    // Remove undefined or null fields to avoid sending invalid values
    // But keep empty strings as they are valid
    Object.keys(prepared).forEach(key => {
      if (prepared[key] === undefined || prepared[key] === null) {
        delete prepared[key];
      }
    });
    
    // Don't send the id field when creating new equipment (let the server generate it)
    if (equipment.id && !equipment.id.startsWith('equipment-')) {
      delete prepared.id;
    }
    
    return prepared;
  }
}

// Create singleton instance
const awsDatabase = new AwsDatabase();

// Export as tursoDb for compatibility
export const tursoDb = awsDatabase;
export const turso = awsDatabase;

// Also export the class
export default awsDatabase;