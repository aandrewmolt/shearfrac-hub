
import { useEffect, useMemo } from 'react';
import { IndividualEquipment, EquipmentType } from '@/types/inventory';
import { useInventory } from '@/contexts/InventoryContext';
import { useDraftEquipmentManager } from '@/hooks/useDraftEquipmentManager';
import { useIndividualEquipmentForm } from './useIndividualEquipmentForm';
import { useIndividualEquipmentOperations } from './useIndividualEquipmentOperations';

export const useIndividualEquipmentManager = (
  equipmentType: EquipmentType,
  onDraftCountChange?: (count: number) => void
) => {
  const { data, updateIndividualEquipment, addIndividualEquipment } = useInventory();

  const individualEquipment = useMemo(() => 
    data.individualEquipment.filter(eq => eq.typeId === equipmentType.id),
    [data.individualEquipment, equipmentType.id]
  );
  
  const {
    draftEquipment,
    hasUnsavedChanges,
    addDraftEquipment,
    saveImmediately,
    discardChanges,
    unsavedCount,
  } = useDraftEquipmentManager(individualEquipment, async (equipment) => {
    if (Array.isArray(equipment)) {
      // Handle bulk equipment addition
      for (const eq of equipment) {
        await addIndividualEquipment(eq);
      }
    } else {
      await addIndividualEquipment(equipment);
    }
    // Refresh after adding equipment
    setTimeout(() => {
      console.log('Equipment added successfully');
    }, 100);
  });

  useEffect(() => {
    if (onDraftCountChange) {
      onDraftCountChange(draftEquipment.length);
    }
  }, [draftEquipment.length, onDraftCountChange]);

  const allEquipment = useMemo(() => {
    return [
      ...individualEquipment,
      ...draftEquipment.map((draft, index) => ({
        ...draft,
        id: draft.id || `draft-${equipmentType.id}-${index}`,
        lastUpdated: draft.lastUpdated || new Date('2024-01-01'),
      } as IndividualEquipment))
    ];
  }, [individualEquipment, draftEquipment, equipmentType.id]);

  const formHook = useIndividualEquipmentForm(
    equipmentType,
    allEquipment,
    addDraftEquipment,
    async (equipment: IndividualEquipment[]) => {
      // This is used for updating existing equipment
      for (const eq of equipment) {
        if (eq.id && !eq.id.startsWith('draft-')) {
          await updateIndividualEquipment(eq.id, eq);
        }
      }
    },
    data.individualEquipment
  );
  const operationsHook = useIndividualEquipmentOperations(
    individualEquipment,
    async (equipment: IndividualEquipment[]) => {
      // Update the equipment in the context
      for (const eq of equipment) {
        if (eq.id && !eq.id.startsWith('draft-')) {
          await updateIndividualEquipment(eq.id, eq);
        }
      }
    },
    data.storageLocations
  );

  return {
    // Data
    individualEquipment,
    draftEquipment,
    allEquipment,
    hasUnsavedChanges,
    unsavedCount,
    
    // Form management - properly expose all form hook properties
    isFormOpen: formHook.isDialogOpen,
    setIsFormOpen: formHook.setIsDialogOpen,
    editingEquipment: formHook.editingEquipment,
    setEditingEquipment: formHook.handleEdit,
    formData: formHook.formData,
    setFormData: formHook.setFormData,
    handleSubmit: formHook.handleSubmit,
    resetForm: formHook.resetForm,
    handlePrefixChange: formHook.handlePrefixChange,
    
    // Operations - explicitly expose the required functions
    handleStatusChange: operationsHook.handleStatusChange,
    handleLocationChange: operationsHook.handleLocationChange,
    handleDelete: operationsHook.handleDelete,
    
    // Draft management
    saveImmediately,
    discardChanges,
  };
};
