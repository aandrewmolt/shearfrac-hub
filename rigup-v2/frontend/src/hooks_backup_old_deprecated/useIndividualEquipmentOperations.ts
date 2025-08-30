
import { useCallback } from 'react';
import { IndividualEquipment, StorageLocation } from '@/types/inventory';
import { useInventory } from '@/contexts/InventoryContext';
import { toast } from 'sonner';
import { validateStatusUpdate, showStatusValidationError, ValidEquipmentStatus } from '@/utils/equipmentStatusValidation';
import { useEquipmentUsageTracking } from '@/hooks/equipment/useEquipmentUsageTracking';

export const useIndividualEquipmentOperations = (
  individualEquipment: IndividualEquipment[],
  onUpdateEquipment: (equipment: IndividualEquipment[]) => void,
  storageLocations: StorageLocation[]
) => {
  const { updateIndividualEquipment, deleteIndividualEquipment } = useInventory();
  const { endUsageSession } = useEquipmentUsageTracking();

  const handleStatusChange = useCallback(async (equipmentId: string, newStatus: ValidEquipmentStatus) => {
    try {
      // Get current equipment to validate status transition
      const equipment = individualEquipment.find(eq => eq.id === equipmentId);
      if (!equipment) {
        toast.error('Equipment not found');
        return;
      }

      // Validate the status update
      const validation = validateStatusUpdate(equipment.status as ValidEquipmentStatus, newStatus, equipmentId);
      if (!validation.isValid) {
        showStatusValidationError(validation.error || 'Invalid status transition', equipmentId);
        return;
      }

      // Automatically end usage tracking if equipment is being red-tagged or put in maintenance
      if ((newStatus === 'red-tagged' || newStatus === 'maintenance' || newStatus === 'retired') && 
          equipment.jobId && equipment.equipmentId) {
        await endUsageSession(equipment.equipmentId, equipment.jobId);
      }

      await updateIndividualEquipment(equipmentId, { status: validation.status });
      toast.success('Equipment status updated');
    } catch (error) {
      console.error('Failed to update equipment status:', error);
      toast.error('Failed to update equipment status');
    }
  }, [individualEquipment, updateIndividualEquipment, endUsageSession]);

  const handleLocationChange = useCallback(async (equipmentId: string, newLocationId: string) => {
    try {
      await updateIndividualEquipment(equipmentId, { location_id: newLocationId });
      toast.success('Equipment location updated');
    } catch (error) {
      console.error('Failed to update equipment location:', error);
      toast.error('Failed to update equipment location');
    }
  }, [updateIndividualEquipment]);

  const handleDelete = useCallback(async (equipmentId: string) => {
    const equipment = individualEquipment.find(eq => eq.id === equipmentId);
    if (equipment?.status === 'deployed') {
      toast.error('Cannot delete deployed equipment');
      return;
    }

    if (window.confirm('Are you sure you want to delete this equipment?')) {
      try {
        await deleteIndividualEquipment(equipmentId);
        toast.success('Equipment deleted');
      } catch (error) {
        console.error('Failed to delete equipment:', error);
        toast.error('Failed to delete equipment');
      }
    }
  }, [individualEquipment, deleteIndividualEquipment]);

  return {
    handleStatusChange,
    handleLocationChange,
    handleDelete,
  };
};
