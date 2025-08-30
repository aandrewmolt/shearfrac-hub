
import { useTursoEquipmentMutations } from '@/hooks/equipment/useTursoEquipmentMutations';
import { StorageLocation, EquipmentType, IndividualEquipment } from '@/types/inventory';

export const useInventoryMutations = (storageLocations: StorageLocation[]) => {
  const mutations = useTursoEquipmentMutations();

  // Enhanced mutation wrappers

  const deleteEquipmentType = async (id: string) => {
    try {
      return await mutations.deleteEquipmentType(id);
    } catch (error) {
      console.error('Failed to delete equipment type:', error);
      throw error;
    }
  };

  const deleteStorageLocationWrapper = async (id: string) => {
    try {
      return await mutations.deleteStorageLocation(id);
    } catch (error) {
      console.error('Failed to delete storage location:', error);
      throw error;
    }
  };

  const deleteIndividualEquipmentWrapper = async (id: string) => {
    try {
      return await mutations.deleteIndividualEquipment(id);
    } catch (error) {
      console.error('Failed to delete individual equipment:', error);
      throw error;
    }
  };

  const addBulkIndividualEquipment = async (equipment: Omit<IndividualEquipment, 'id'>[]) => {
    try {
      const results = await Promise.all(
        equipment.map(eq => mutations.addIndividualEquipment(eq))
      );
      return results;
    } catch (error) {
      console.error('Failed to add bulk individual equipment:', error);
      throw error;
    }
  };

  // Enhanced storage location update that handles default location constraint
  const updateStorageLocationWithDefault = async (id: string, data: Partial<StorageLocation>): Promise<void> => {
    try {
      // If setting this location as default, first clear all other defaults
      if (data.isDefault) {
        console.log('Clearing existing default locations before setting new default...');
        // First, clear all existing defaults
        await Promise.all(
          storageLocations
            .filter((loc: StorageLocation) => loc.id !== id && loc.isDefault)
            .map(loc => mutations.updateStorageLocation(loc.id, { ...loc, isDefault: false }))
        );
      }
      
      // Then update the target location
      await mutations.updateStorageLocation(id, data);
    } catch (error) {
      console.error('Failed to update storage location:', error);
      throw error;
    }
  };

  // Wrapper functions to ensure Promise<void> return type
  const addEquipmentTypeWrapper = async (data: Omit<EquipmentType, 'id'>): Promise<void> => {
    await mutations.addEquipmentType(data);
  };

  const updateEquipmentTypeWrapper = async (id: string, data: Partial<EquipmentType>): Promise<void> => {
    await mutations.updateEquipmentType(id, data);
  };

  const addStorageLocationWrapper = async (data: Omit<StorageLocation, 'id'>): Promise<void> => {
    await mutations.addStorageLocation(data);
  };

  const addIndividualEquipmentWrapper = async (data: Omit<IndividualEquipment, 'id'>): Promise<void> => {
    await mutations.addIndividualEquipment(data);
  };

  const updateIndividualEquipmentWrapper = async (id: string, data: Partial<IndividualEquipment>): Promise<void> => {
    await mutations.updateIndividualEquipment(id, data);
  };


  return {
    ...mutations,
    deleteEquipmentType,
    deleteStorageLocation: deleteStorageLocationWrapper,
    deleteIndividualEquipment: deleteIndividualEquipmentWrapper,
    addBulkIndividualEquipment,
    updateStorageLocationWithDefault,
    addEquipmentTypeWrapper,
    updateEquipmentTypeWrapper,
    addStorageLocationWrapper,
    addIndividualEquipmentWrapper,
    updateIndividualEquipmentWrapper,
  };
};
