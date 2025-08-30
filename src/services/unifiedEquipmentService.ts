/**
 * Unified Equipment Service
 * Automatically uses AWS API when configured, falls back to Turso
 */

import { useAwsApi } from '@/config/apiMode';
import { equipmentService } from './equipmentService';
import awsApi from './awsApiService';

class UnifiedEquipmentService {
  // Get all equipment
  async getEquipment() {
    if (useAwsApi()) {
      try {
        const equipment = await awsApi.equipment.list();
        return equipment.map(this.transformAwsEquipment);
      } catch (error) {
        console.error('AWS API error, falling back to Turso:', error);
        return equipmentService.getEquipment();
      }
    }
    return equipmentService.getEquipment();
  }

  // Get equipment by ID
  async getEquipmentById(id: string) {
    if (useAwsApi()) {
      try {
        const item = await awsApi.equipment.get(id);
        return this.transformAwsEquipment(item);
      } catch (error) {
        console.error('AWS API error, falling back to Turso:', error);
        return equipmentService.getEquipmentById(id);
      }
    }
    return equipmentService.getEquipmentById(id);
  }

  // Create equipment
  async createEquipment(equipment: any) {
    if (useAwsApi()) {
      try {
        const newItem = await awsApi.equipment.create(this.transformToAwsFormat(equipment));
        return this.transformAwsEquipment(newItem);
      } catch (error) {
        console.error('AWS API error, falling back to Turso:', error);
        return equipmentService.createEquipment(equipment);
      }
    }
    return equipmentService.createEquipment(equipment);
  }

  // Update equipment
  async updateEquipment(id: string, updates: any) {
    if (useAwsApi()) {
      try {
        const updated = await awsApi.equipment.update(id, this.transformToAwsFormat(updates));
        return this.transformAwsEquipment(updated);
      } catch (error) {
        console.error('AWS API error, falling back to Turso:', error);
        return equipmentService.updateEquipment(id, updates);
      }
    }
    return equipmentService.updateEquipment(id, updates);
  }

  // Update equipment status
  async updateEquipmentStatus(id: string, status: string) {
    if (useAwsApi()) {
      try {
        const updated = await awsApi.equipment.updateStatus(id, status);
        return this.transformAwsEquipment(updated);
      } catch (error) {
        console.error('AWS API error, falling back to Turso:', error);
        return equipmentService.updateEquipmentStatus(id, status);
      }
    }
    return equipmentService.updateEquipmentStatus(id, status);
  }

  // Deploy equipment to job
  async deployEquipment(equipmentId: string, jobId: string, quantity?: number) {
    if (useAwsApi()) {
      try {
        const result = await awsApi.equipment.deploy({ 
          equipmentId, 
          jobId, 
          quantity: quantity || 1 
        });
        return result;
      } catch (error) {
        console.error('AWS API error, falling back to Turso:', error);
        return equipmentService.deployEquipment(equipmentId, jobId, quantity);
      }
    }
    return equipmentService.deployEquipment(equipmentId, jobId, quantity);
  }

  // Return equipment from job
  async returnEquipment(equipmentId: string, jobId: string, quantity?: number) {
    if (useAwsApi()) {
      try {
        const result = await awsApi.equipment.return({ 
          equipmentId, 
          jobId, 
          quantity: quantity || 1 
        });
        return result;
      } catch (error) {
        console.error('AWS API error, falling back to Turso:', error);
        return equipmentService.returnEquipment(equipmentId, jobId, quantity);
      }
    }
    return equipmentService.returnEquipment(equipmentId, jobId, quantity);
  }

  // Delete equipment
  async deleteEquipment(id: string) {
    if (useAwsApi()) {
      try {
        // AWS doesn't have a delete endpoint, so update status to 'retired'
        await awsApi.equipment.updateStatus(id, 'retired');
        return { success: true };
      } catch (error) {
        console.error('AWS API error, falling back to Turso:', error);
        return equipmentService.deleteEquipment(id);
      }
    }
    return equipmentService.deleteEquipment(id);
  }

  // Get equipment by job
  async getEquipmentByJob(jobId: string) {
    if (useAwsApi()) {
      try {
        const allEquipment = await awsApi.equipment.list();
        // Filter equipment deployed to this job
        return allEquipment
          .filter((item: any) => item.job_id === jobId || item.deployed_to === jobId)
          .map(this.transformAwsEquipment);
      } catch (error) {
        console.error('AWS API error, falling back to Turso:', error);
        return equipmentService.getEquipmentByJob(jobId);
      }
    }
    return equipmentService.getEquipmentByJob(jobId);
  }

  // Transform AWS equipment to Turso format
  private transformAwsEquipment(awsItem: any) {
    if (!awsItem) return null;
    
    return {
      ...awsItem,
      // Ensure consistent field names
      equipment_code: awsItem.equipment_code || awsItem.code,
      equipment_name: awsItem.equipment_name || awsItem.name,
      equipment_type: awsItem.equipment_type || awsItem.type,
      is_bulk: Boolean(awsItem.is_bulk),
      // Ensure dates
      created_at: awsItem.created_at || new Date().toISOString(),
      updated_at: awsItem.updated_at || new Date().toISOString(),
      // Ensure status
      status: awsItem.status || 'available',
    };
  }

  // Transform to AWS format
  private transformToAwsFormat(equipment: any) {
    const {
      equipment_code,
      equipment_name,
      equipment_type,
      is_bulk,
      ...rest
    } = equipment;

    return {
      ...rest,
      code: equipment_code || equipment.code,
      name: equipment_name || equipment.name,
      type: equipment_type || equipment.type,
      is_bulk: is_bulk !== undefined ? is_bulk : equipment.is_bulk,
      status: equipment.status || 'available',
    };
  }
}

// Export singleton instance
export const unifiedEquipmentService = new UnifiedEquipmentService();

// Also export as default
export default unifiedEquipmentService;