
import { useState } from 'react';
import { EquipmentType, StorageLocation, IndividualEquipment } from '@/types/inventory';

export const useIndividualEquipmentLogic = (
  equipmentType: EquipmentType | undefined,
  storageLocations: StorageLocation[],
  addIndividualEquipment: (equipment: Omit<IndividualEquipment, 'id' | 'lastUpdatedDate'>) => Promise<void>,
  onDraftCountChange: (count: number) => void
) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draftItems, setDraftItems] = useState<Array<Omit<IndividualEquipment, 'id' | 'lastUpdatedDate'>>>([]);
  const [formData, setFormData] = useState({
    equipmentId: '',
    name: '',
    locationId: '',
    serialNumber: '',
    notes: '',
    selectedPrefix: 'CC'
  });

  const generateNextId = (prefix: string = equipmentType?.defaultIdPrefix || 'EQ', existingEquipment: unknown[] = []) => {
    const allEquipment = [...existingEquipment, ...draftItems];
    const existingIds = allEquipment
      .map(eq => eq.equipmentId || eq.equipment_id)
      .filter(id => id?.startsWith(prefix))
      .map(id => {
        const num = id.replace(prefix, '').replace('-', '');
        return parseInt(num) || 0;
      });
    
    const nextNum = Math.max(0, ...existingIds) + 1;
    return `${prefix}-${nextNum.toString().padStart(3, '0')}`;
  };

  const handleSubmit = async (saveImmediate = false) => {
    if (!equipmentType) return;
    
    const finalPrefix = formData.selectedPrefix || equipmentType.defaultIdPrefix || 'EQ';
    const equipmentId = formData.equipmentId || generateNextId(finalPrefix);
    
    const defaultLocation = storageLocations.find(loc => loc.isDefault);
    
    const newItem = {
      equipmentId,
      name: formData.name || `${equipmentType.name} ${equipmentId}`,
      typeId: equipmentType.id,
      locationId: formData.locationId || defaultLocation?.id || storageLocations[0]?.id || '',
      status: 'available' as const,
      serialNumber: formData.serialNumber,
      notes: formData.notes
    };

    if (saveImmediate) {
      try {
        await addIndividualEquipment(newItem);
        onReset();
      } catch (error) {
        console.error('Failed to save equipment:', error);
      }
    } else {
      setDraftItems(prev => [...prev, newItem]);
      onDraftCountChange(draftItems.length + 1);
      onReset();
    }
  };

  const onReset = () => {
    const defaultLocation = storageLocations.find(loc => loc.isDefault);
    
    setFormData({
      equipmentId: '',
      name: '',
      locationId: defaultLocation?.id || storageLocations[0]?.id || '',
      serialNumber: '',
      notes: '',
      selectedPrefix: 'CC'
    });
    setIsFormOpen(false);
  };

  const saveDraftItems = async () => {
    try {
      for (const item of draftItems) {
        await addIndividualEquipment(item);
      }
      setDraftItems([]);
      onDraftCountChange(0);
    } catch (error) {
      console.error('Failed to save draft items:', error);
    }
  };

  return {
    isFormOpen,
    setIsFormOpen,
    draftItems,
    formData,
    setFormData,
    handleSubmit,
    onReset,
    saveDraftItems,
  };
};
