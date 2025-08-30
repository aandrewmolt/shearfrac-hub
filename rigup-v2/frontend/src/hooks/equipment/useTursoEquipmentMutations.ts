import { tursoDb } from '@/services/tursoDb';
import { EquipmentType, StorageLocation, IndividualEquipment } from '@/types/inventory';
import { unifiedEventSystem } from '@/services/unifiedEventSystem';

/**
 * Direct database mutations for equipment
 * Used by InventoryProvider for mutation operations
 * 
 * IMPORTANT: This hook MUST NOT use useInventory() or any context
 * as it's used by the InventoryProvider itself
 */
export const useTursoEquipmentMutations = () => {
  // Equipment Type Mutations
  const addEquipmentType = async (data: Omit<EquipmentType, 'id'>) => {
    try {
      const id = `type-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const equipmentType = {
        id,
        name: data.name,
        category: data.category || 'other',
        description: data.description || '',
        default_id_prefix: data.defaultIdPrefix || ''
      };
      
      await tursoDb.addEquipmentType(equipmentType);
      return equipmentType;
    } catch (error) {
      console.error('Error adding equipment type:', error);
      throw error;
    }
  };

  const updateEquipmentType = async (id: string, updateData: Partial<EquipmentType>) => {
    try {
      await tursoDb.updateEquipmentType(id, updateData);
      return { id, ...updateData };
    } catch (error) {
      console.error('Error updating equipment type:', error);
      throw error;
    }
  };

  const deleteEquipmentType = async (id: string) => {
    try {
      await tursoDb.deleteEquipmentType(id);
      return true;
    } catch (error) {
      console.error('Error deleting equipment type:', error);
      throw error;
    }
  };

  // Storage Location Mutations
  const addStorageLocation = async (data: Omit<StorageLocation, 'id'>) => {
    try {
      const id = `location-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const storageLocation = {
        id,
        name: data.name,
        description: data.description || '',
        locationType: data.locationType || 'storage',
        isDefault: data.isDefault || false
      };
      
      await tursoDb.addStorageLocation(storageLocation);
      return storageLocation;
    } catch (error) {
      console.error('Error adding storage location:', error);
      throw error;
    }
  };

  const updateStorageLocation = async (id: string, updateData: Partial<StorageLocation>) => {
    try {
      await tursoDb.updateStorageLocation(id, updateData);
      return { id, ...updateData };
    } catch (error) {
      console.error('Error updating storage location:', error);
      throw error;
    }
  };

  const deleteStorageLocation = async (id: string) => {
    try {
      await tursoDb.deleteStorageLocation(id);
      return true;
    } catch (error) {
      console.error('Error deleting storage location:', error);
      throw error;
    }
  };

  // Individual Equipment Mutations
  const addIndividualEquipment = async (data: Omit<IndividualEquipment, 'id'>) => {
    try {
      const id = `equipment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const equipment = {
        id,
        equipmentId: data.equipmentId,
        name: data.name,
        typeId: data.typeId || data.equipmentTypeId,
        locationId: data.locationId || data.storageLocationId,
        status: data.status || 'available',
        jobId: data.jobId,
        serialNumber: data.serialNumber,
        purchaseDate: data.purchaseDate,
        warrantyExpiry: data.warrantyExpiry,
        notes: data.notes,
        redTagReason: data.redTagReason,
        redTagPhoto: data.redTagPhoto,
        lastUpdated: new Date()
      };
      
      await tursoDb.addIndividualEquipment(equipment);
      unifiedEventSystem.emit('equipmentAdded', equipment);
      return equipment;
    } catch (error) {
      console.error('Error adding individual equipment:', error);
      throw error;
    }
  };

  const updateIndividualEquipment = async (id: string, updateData: Partial<IndividualEquipment>) => {
    try {
      await tursoDb.updateIndividualEquipment(id, updateData);
      unifiedEventSystem.emit('equipmentUpdated', { id, ...updateData });
      return { id, ...updateData };
    } catch (error) {
      console.error('Error updating individual equipment:', error);
      throw error;
    }
  };

  const deleteIndividualEquipment = async (id: string) => {
    try {
      await tursoDb.deleteIndividualEquipment(id);
      unifiedEventSystem.emit('equipmentDeleted', { id });
      return true;
    } catch (error) {
      console.error('Error deleting individual equipment:', error);
      throw error;
    }
  };

  // Bulk Operations
  const addBulkIndividualEquipment = async (equipmentList: Omit<IndividualEquipment, 'id'>[]) => {
    try {
      const results = [];
      for (const equipment of equipmentList) {
        const result = await addIndividualEquipment(equipment);
        results.push(result);
      }
      return results;
    } catch (error) {
      console.error('Error adding bulk individual equipment:', error);
      throw error;
    }
  };

  const updateBulkIndividualEquipment = async (updates: Array<{id: string, data: Partial<IndividualEquipment>}>) => {
    try {
      const results = [];
      for (const { id, data } of updates) {
        const result = await updateIndividualEquipment(id, data);
        results.push(result);
      }
      return results;
    } catch (error) {
      console.error('Error updating bulk individual equipment:', error);
      throw error;
    }
  };

  return {
    // Equipment Type operations
    addEquipmentType,
    updateEquipmentType,
    deleteEquipmentType,
    
    // Storage Location operations
    addStorageLocation,
    updateStorageLocation,
    deleteStorageLocation,
    
    // Individual Equipment operations  
    addIndividualEquipment,
    updateIndividualEquipment,
    deleteIndividualEquipment,
    
    // Bulk operations
    addBulkIndividualEquipment,
    updateBulkIndividualEquipment,
  };
};