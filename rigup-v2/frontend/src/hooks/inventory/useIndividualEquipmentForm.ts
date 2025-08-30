
import { useState, useCallback } from 'react';
import { IndividualEquipment, EquipmentType } from '@/types/inventory';
import { toast } from 'sonner';
import { useEquipmentIdGenerator } from './useEquipmentIdGenerator';

export const useIndividualEquipmentForm = (
  equipmentType: EquipmentType,
  allEquipment: IndividualEquipment[],
  onAddDraft: (equipment: Omit<IndividualEquipment, 'id'>) => void,
  onUpdateEquipment: (equipment: IndividualEquipment[]) => void,
  existingEquipment: IndividualEquipment[]
) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<IndividualEquipment | null>(null);
  const { generateEquipmentId, generateEquipmentName } = useEquipmentIdGenerator();
  
  const [formData, setFormData] = useState({
    equipmentId: '',
    name: '',
    locationId: '',
    serialNumber: '',
    notes: '',
    selectedPrefix: equipmentType.name === 'Customer Computer' ? 'CC' : 
                   equipmentType.name === 'Customer Tablet' ? 'CT' : 
                   equipmentType.defaultIdPrefix || ''
  });

  const getNextEquipmentId = useCallback((prefix: string) => {
    const existingIds = allEquipment.map(eq => eq.equipmentId);
    let counter = 1;
    
    // Create a temporary equipment type with the selected prefix for ID generation
    const tempEquipmentType = { ...equipmentType, defaultIdPrefix: prefix };
    let newId = generateEquipmentId(tempEquipmentType, counter);
    
    while (existingIds.includes(newId)) {
      counter++;
      newId = generateEquipmentId(tempEquipmentType, counter);
    }
    
    return newId;
  }, [allEquipment, generateEquipmentId, equipmentType]);

  const resetForm = useCallback(() => {
    const prefix = equipmentType.name === 'Customer Computer' ? 'CC' : 
                   equipmentType.name === 'Customer Tablet' ? 'CT' : 
                   equipmentType.defaultIdPrefix || '';
    const nextId = getNextEquipmentId(prefix);
    
    setFormData({
      equipmentId: nextId,
      name: generateEquipmentName({ ...equipmentType, defaultIdPrefix: prefix }, nextId),
      locationId: '',
      serialNumber: '',
      notes: '',
      selectedPrefix: prefix
    });
    setEditingEquipment(null);
    setIsDialogOpen(false);
  }, [equipmentType, getNextEquipmentId, generateEquipmentName]);

  const handlePrefixChange = useCallback((prefix: string) => {
    const nextId = getNextEquipmentId(prefix);
    const tempEquipmentType = { ...equipmentType, defaultIdPrefix: prefix };
    
    setFormData(prev => ({
      ...prev,
      equipmentId: nextId,
      name: generateEquipmentName(tempEquipmentType, nextId),
      selectedPrefix: prefix
    }));
  }, [getNextEquipmentId, generateEquipmentName, equipmentType]);

  const handleEdit = useCallback((equipment: IndividualEquipment) => {
    setEditingEquipment(equipment);
    const prefix = equipment.equipmentId.substring(0, 2);
    setFormData({
      equipmentId: equipment.equipmentId,
      name: equipment.name,
      locationId: equipment.locationId,
      serialNumber: equipment.serialNumber || '',
      notes: equipment.notes || '',
      selectedPrefix: prefix
    });
    setIsDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(async (saveImmediate = false) => {
    if (!formData.equipmentId.trim() || !formData.name.trim() || !formData.locationId) {
      toast.error('Equipment ID, name, and location are required');
      return;
    }

    const existingEquipmentItem = allEquipment.find(eq => 
      eq.equipmentId === formData.equipmentId && (!editingEquipment || eq.id !== editingEquipment.id)
    );
    
    if (existingEquipmentItem) {
      toast.error('Equipment ID already exists');
      return;
    }

    try {
      if (editingEquipment) {
        // Update existing equipment
        const updatedEquipment = existingEquipment.map(eq => 
          eq.id === editingEquipment.id 
            ? { 
                ...eq, 
                equipmentId: formData.equipmentId,
                name: formData.name,
                locationId: formData.locationId,
                serialNumber: formData.serialNumber,
                notes: formData.notes,
                typeId: equipmentType.id,
                lastUpdated: new Date()
              }
            : eq
        );
        await onUpdateEquipment(updatedEquipment);
        toast.success('Equipment updated successfully');
      } else {
        const newEquipment = {
          equipmentId: formData.equipmentId,
          name: formData.name,
          typeId: equipmentType.id,
          locationId: formData.locationId,
          status: 'available' as const,
          serialNumber: formData.serialNumber,
          notes: formData.notes
        };

        if (saveImmediate) {
          const updatedEquipment = [...existingEquipment, { ...newEquipment, id: `new-${Date.now()}`, lastUpdated: new Date() }];
          await onUpdateEquipment(updatedEquipment);
          toast.success('Equipment saved successfully');
        } else {
          onAddDraft(newEquipment);
          toast.success('Equipment added to drafts');
        }
      }

      resetForm();
    } catch (error) {
      console.error('Error handling form submission:', error);
    }
  }, [formData, editingEquipment, allEquipment, equipmentType.id, existingEquipment, onUpdateEquipment, onAddDraft, resetForm]);

  return {
    isDialogOpen,
    setIsDialogOpen,
    editingEquipment,
    formData,
    setFormData,
    handleEdit,
    handleSubmit,
    resetForm,
    handlePrefixChange,
  };
};
