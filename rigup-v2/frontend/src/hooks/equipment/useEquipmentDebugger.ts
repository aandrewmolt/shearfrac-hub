import { useInventory } from '@/contexts/InventoryContext';
import { useEffect } from 'react';

export const useEquipmentDebugger = () => {
  const { data } = useInventory();

  useEffect(() => {
    // Debug hook - no-op for now
  }, [data]);

  return null;
};