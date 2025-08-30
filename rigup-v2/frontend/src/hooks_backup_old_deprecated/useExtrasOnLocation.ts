
import { useState, useCallback } from 'react';

export interface ExtrasOnLocationItem {
  id: string;
  equipmentTypeId: string;
  quantity: number;
  reason: string;
  addedDate: Date;
  notes?: string;
  individualEquipmentId?: string; // Add this for individual tracking
}

export const useExtrasOnLocation = () => {
  const [extrasOnLocation, setExtrasOnLocation] = useState<ExtrasOnLocationItem[]>([]);

  const handleAddExtra = useCallback((
    equipmentTypeId: string, 
    quantity: number, 
    reason: string, 
    notes?: string, 
    individualEquipmentId?: string
  ) => {
    const newExtra = {
      id: `extra-${Date.now()}`,
      equipmentTypeId,
      quantity,
      reason,
      addedDate: new Date(),
      notes,
      individualEquipmentId,
    };
    setExtrasOnLocation(prev => [...prev, newExtra]);
  }, []);

  const handleRemoveExtra = useCallback((extraId: string) => {
    setExtrasOnLocation(prev => prev.filter(extra => extra.id !== extraId));
  }, []);

  return {
    extrasOnLocation,
    handleAddExtra,
    handleRemoveExtra,
  };
};
