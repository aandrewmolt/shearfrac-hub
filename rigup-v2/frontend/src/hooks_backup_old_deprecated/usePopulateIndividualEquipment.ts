import { useInventory } from '@/contexts/InventoryContext';
import { useCreateDefaultIndividualEquipment } from './useCreateDefaultIndividualEquipment';
import { toast } from 'sonner';

export const usePopulateIndividualEquipment = () => {
  const { data, addBulkIndividualEquipment } = useInventory();
  const { createDefaultIndividualEquipment } = useCreateDefaultIndividualEquipment();
  
  const populateMissingIndividualEquipment = async () => {
    // Check which equipment types need individual tracking but have no items
    const typesNeedingItems = [
      { typeId: 'pressure-gauge-1502', name: '1502 Pressure Gauge', expectedMin: 5 },
      { typeId: 'customer-computer', name: 'Customer Computer', expectedMin: 10 },
      { typeId: 'starlink', name: 'Starlink', expectedMin: 5 },
      { typeId: 'y-adapter', name: 'Y Adapter', expectedMin: 10 }
    ];
    
    const missingTypes: string[] = [];
    
    typesNeedingItems.forEach(({ typeId, name, expectedMin }) => {
      const existingCount = data.individualEquipment.filter(
        item => item.typeId === typeId
      ).length;
      
      if (existingCount < expectedMin) {
        missingTypes.push(`${name} (have ${existingCount}, expected ${expectedMin}+)`);
      }
    });
    
    if (missingTypes.length > 0) {
      const confirmed = window.confirm(
        `Missing individual equipment detected:\n\n${missingTypes.join('\n')}\n\nWould you like to create default individual equipment items?`
      );
      
      if (confirmed) {
        try {
          const defaultEquipment = createDefaultIndividualEquipment();
          
          // Filter out equipment that already exists
          const newEquipment = defaultEquipment.filter(
            newItem => !data.individualEquipment.some(
              existing => existing.equipmentId === newItem.equipmentId
            )
          );
          
          if (newEquipment.length > 0) {
            await addBulkIndividualEquipment(newEquipment);
            toast.success(`Created ${newEquipment.length} individual equipment items`);
          } else {
            toast.info('All individual equipment already exists');
          }
        } catch (error) {
          console.error('Failed to populate individual equipment:', error);
          toast.error('Failed to create individual equipment');
        }
      }
    } else {
      toast.info('Individual equipment inventory is complete');
    }
  };
  
  return {
    populateMissingIndividualEquipment
  };
};