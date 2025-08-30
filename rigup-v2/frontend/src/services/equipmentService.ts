import { turso } from '@/utils/consolidated/databaseUtils';
import { v4 as uuidv4 } from 'uuid';
import type { EquipmentType, IndividualEquipment } from '@/types/inventory';

// Type definitions for equipment operations
interface EquipmentHistoryRecord {
  id: string;
  equipment_id: string;
  action: string;
  from_status?: string;
  to_status?: string;
  from_location?: string;
  to_location?: string;
  job_id?: string;
  job_name?: string;
  user_id?: string;
  user_name?: string;
  notes?: string;
  timestamp: string;
}

interface RedTagInfo {
  status?: string;
  reason?: string;
  photo?: string;
}

export class EquipmentService {
  // Helper to parse JSON fields
  private parseJson(value: unknown) {
    if (!value) return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return value;
  }

  // Helper to stringify JSON fields
  private stringifyJson(value: unknown) {
    if (!value) return null;
    return typeof value === 'string' ? value : JSON.stringify(value);
  }

  // ==== EQUIPMENT TYPES ====
  async getEquipmentTypes() {
    const result = await turso.execute('SELECT * FROM equipment_types ORDER BY name');
    return result.rows.map(row => ({
      ...row,
      requires_individual_tracking: true // All equipment now uses individual tracking
    }));
  }

  async createEquipmentType(type: Partial<EquipmentType> & { name: string; category: string }) {
    const id = type.id || uuidv4();
    await turso.execute({
      sql: `INSERT INTO equipment_types 
            (id, name, category, description, requires_individual_tracking, default_id_prefix) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        type.name,
        type.category,
        type.description || null,
        true, // All equipment now uses individual tracking
        type.default_id_prefix || type.defaultIdPrefix || null
      ]
    });
    return { ...type, id };
  }

  async updateEquipmentType(id: string, updates: Partial<EquipmentType>) {
    await turso.execute({
      sql: `UPDATE equipment_types 
            SET name = ?, category = ?, description = ?, 
                requires_individual_tracking = ?, default_id_prefix = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [
        updates.name,
        updates.category,
        updates.description || null,
        true, // All equipment now uses individual tracking
        updates.default_id_prefix || updates.defaultIdPrefix || null,
        id
      ]
    });
    return this.getEquipmentTypeById(id);
  }

  async deleteEquipmentType(id: string) {
    await turso.execute({
      sql: 'DELETE FROM equipment_types WHERE id = ?',
      args: [id]
    });
  }

  async getEquipmentTypeById(id: string) {
    const result = await turso.execute({
      sql: 'SELECT * FROM equipment_types WHERE id = ?',
      args: [id]
    });
    return result.rows[0] || null;
  }

  // ==== INDIVIDUAL EQUIPMENT ====
  async getIndividualEquipment() {
    const result = await turso.execute('SELECT * FROM individual_equipment ORDER BY equipment_id');
    return result.rows;
  }

  async createIndividualEquipment(equipment: Partial<IndividualEquipment> & { equipmentId: string; equipmentTypeId: string; storageLocationId: string }) {
    const id = equipment.id || uuidv4();
    await turso.execute({
      sql: `INSERT INTO individual_equipment 
            (id, equipment_id, name, type_id, location_id, status, job_id, 
             serial_number, purchase_date, warranty_expiry, notes, 
             red_tag_reason, red_tag_photo, location_type) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        equipment.equipment_id || equipment.equipmentId,
        equipment.name,
        equipment.type_id || equipment.typeId,
        equipment.location_id || equipment.locationId,
        equipment.status || 'available',
        equipment.job_id || equipment.jobId || null,
        equipment.serial_number || equipment.serialNumber || null,
        equipment.purchase_date || equipment.purchaseDate || null,
        equipment.warranty_expiry || equipment.warrantyExpiry || null,
        equipment.notes || null,
        equipment.red_tag_reason || equipment.redTagReason || null,
        equipment.red_tag_photo || equipment.redTagPhoto || null,
        equipment.location_type || 'storage'
      ]
    });
    return { ...equipment, id };
  }

  async updateIndividualEquipment(id: string, updates: Partial<IndividualEquipment>) {
    // Get existing equipment to preserve current values
    const existing = await this.getIndividualEquipmentById(id);
    if (!existing) throw new Error('Individual equipment not found');
    
    // Track history if status or location changes
    const newStatus = updates.status ?? existing.status;
    const newLocation = updates.location_id ?? updates.locationId ?? existing.location_id;
    const newJobId = updates.job_id ?? updates.jobId ?? existing.job_id;
    
    if (existing.status !== newStatus || existing.location_id !== newLocation || existing.job_id !== newJobId) {
      let action = 'Updated';
      if (existing.status !== newStatus) {
        if (newStatus === 'deployed') action = 'Deployed';
        else if (newStatus === 'available') action = 'Returned';
        else if (newStatus === 'red-tagged') action = 'Red Tagged';
        else if (newStatus === 'maintenance') action = 'Maintenance';
      } else if (existing.job_id !== newJobId) {
        action = newJobId ? 'Assigned to Job' : 'Removed from Job';
      } else if (existing.location_id !== newLocation) {
        action = 'Relocated';
      }
      
      await this.addEquipmentHistory({
        equipmentId: id,
        action,
        fromStatus: existing.status,
        toStatus: newStatus,
        fromLocation: existing.location_id,
        toLocation: newLocation,
        jobId: newJobId,
        jobName: updates.jobName,
        notes: updates.notes
      });
    }
    
    await turso.execute({
      sql: `UPDATE individual_equipment 
            SET equipment_id = ?, name = ?, type_id = ?, location_id = ?, 
                status = ?, job_id = ?, serial_number = ?, purchase_date = ?, 
                warranty_expiry = ?, notes = ?, red_tag_reason = ?, 
                red_tag_photo = ?, location_type = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [
        updates.equipment_id ?? updates.equipmentId ?? existing.equipment_id,
        updates.name ?? existing.name,
        updates.type_id ?? updates.typeId ?? existing.type_id,
        updates.location_id ?? updates.locationId ?? existing.location_id,
        updates.status ?? existing.status,
        updates.job_id ?? updates.jobId ?? existing.job_id ?? null,
        updates.serial_number ?? updates.serialNumber ?? existing.serial_number ?? null,
        updates.purchase_date ?? updates.purchaseDate ?? existing.purchase_date ?? null,
        updates.warranty_expiry ?? updates.warrantyExpiry ?? existing.warranty_expiry ?? null,
        updates.notes ?? existing.notes ?? null,
        updates.red_tag_reason ?? updates.redTagReason ?? existing.red_tag_reason ?? null,
        updates.red_tag_photo ?? updates.redTagPhoto ?? existing.red_tag_photo ?? null,
        updates.location_type ?? existing.location_type ?? 'storage',
        id
      ]
    });
    return this.getIndividualEquipmentById(id);
  }

  async deleteIndividualEquipment(id: string) {
    await turso.execute({
      sql: 'DELETE FROM individual_equipment WHERE id = ?',
      args: [id]
    });
  }

  async getIndividualEquipmentById(id: string) {
    const result = await turso.execute({
      sql: 'SELECT * FROM individual_equipment WHERE id = ?',
      args: [id]
    });
    return result.rows[0] || null;
  }

  // ==== EQUIPMENT HISTORY ====
  async addEquipmentHistory(entry: {
    equipmentId: string;
    action: string;
    fromStatus?: string;
    toStatus?: string;
    fromLocation?: string;
    toLocation?: string;
    jobId?: string;
    jobName?: string;
    userId?: string;
    userName?: string;
    notes?: string;
  }): Promise<void> {
    try {
      const id = `history-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      await turso.execute({
        sql: `INSERT INTO equipment_history (
          id, equipment_id, action, from_status, to_status, 
          from_location, to_location, job_id, job_name, 
          user_id, user_name, notes, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        args: [
          id,
          entry.equipmentId,
          entry.action,
          entry.fromStatus || null,
          entry.toStatus || null,
          entry.fromLocation || null,
          entry.toLocation || null,
          entry.jobId || null,
          entry.jobName || null,
          entry.userId || null,
          entry.userName || null,
          entry.notes || null
        ]
      });
    } catch (error) {
      console.error('Failed to add equipment history:', error);
      throw error;
    }
  }

  async getEquipmentHistory(equipmentId: string): Promise<EquipmentHistoryRecord[]> {
    try {
      const result = await turso.execute({
        sql: `SELECT * FROM equipment_history 
              WHERE equipment_id = ? 
              ORDER BY timestamp DESC`,
        args: [equipmentId]
      });
      
      return result.rows || [];
    } catch (error) {
      console.error('Failed to get equipment history:', error);
      return [];
    }
  }

  // ==== EQUIPMENT (legacy compatibility) ====
  async getEquipment() {
    // Return only individual equipment
    return this.getIndividualEquipment();
  }

  async createEquipment(equipment: Partial<IndividualEquipment> & { equipmentId: string; equipmentTypeId: string; storageLocationId: string }) {
    // Route to individual equipment
    return this.createIndividualEquipment(equipment);
  }

  async updateEquipment(id: string, updates: Partial<IndividualEquipment>) {
    // Update individual equipment
    return this.updateIndividualEquipment(id, updates);
  }

  async deleteEquipment(id: string) {
    // Delete individual equipment
    await this.deleteIndividualEquipment(id);
  }

  async updateEquipmentRedTagStatus(equipmentId: string, redTagInfo: RedTagInfo) {
    // Try to update individual equipment first
    try {
      await this.updateIndividualEquipment(equipmentId, {
        status: redTagInfo.status || 'red-tag',
        red_tag_reason: redTagInfo.reason,
        red_tag_photo: redTagInfo.photo
      });
    } catch {
      // If not found in individual, try equipment items
      // Note: This will need to delegate to inventory service in the main class
      throw new Error('Equipment not found in individual equipment');
    }
  }

  async getEquipmentByLocation(locationId: string) {
    // Get individual equipment at a specific location
    const individualEquipment = await turso.execute({
      sql: 'SELECT * FROM individual_equipment WHERE location_id = ?',
      args: [locationId]
    });
    
    return {
      individual: individualEquipment.rows
    };
  }

  async getDeployedEquipmentByJob(jobId: string) {
    // Get individual equipment deployed to a specific job
    const individualEquipment = await turso.execute({
      sql: 'SELECT * FROM individual_equipment WHERE job_id = ?',
      args: [jobId]
    });
    
    return {
      individual: individualEquipment.rows
    };
  }
}

// Lazy singleton instance
let equipmentServiceInstance: EquipmentService | null = null;

export function getEquipmentService(): EquipmentService {
  if (!equipmentServiceInstance) {
    equipmentServiceInstance = new EquipmentService();
  }
  return equipmentServiceInstance;
}