
import { useCallback } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { toast } from 'sonner';

export const useInventoryDataCleanup = () => {
  const { data } = useInventory();

  const analyzeDataConsistency = useCallback(() => {
    console.log('Analyzing data consistency...');
    
    const oldNamingPatterns = data.individualEquipment.filter(eq => 
      eq.name.includes('(') || eq.name.includes('Terminal') || !eq.name.match(/^[A-Za-z-]+\d+$/)
    );

    // Check individual equipment by type
    const ccEquipment = data.individualEquipment.filter(eq => 
      eq.equipmentId.startsWith('CC') || eq.typeId === data.equipmentTypes.find(t => t.name === 'Customer Computer')?.id
    );
    
    const ctEquipment = data.individualEquipment.filter(eq => 
      eq.equipmentId.startsWith('CT') || eq.typeId === data.equipmentTypes.find(t => t.name === 'Customer Tablet')?.id
    );

    const ssEquipment = data.individualEquipment.filter(eq => 
      eq.equipmentId.startsWith('SS') || eq.typeId === data.equipmentTypes.find(t => t.name === 'ShearStream Box')?.id
    );

    const slEquipment = data.individualEquipment.filter(eq => 
      eq.equipmentId.startsWith('SL') || eq.typeId === data.equipmentTypes.find(t => t.name === 'Starlink')?.id
    );
    // Check for orphaned equipment (equipment with missing type references)
    const orphanedEquipment = data.individualEquipment.filter(eq => 
      !data.equipmentTypes.find(et => et.id === eq.typeId)
    );

    if (orphanedEquipment.length > 0) {
      console.warn('Found orphaned equipment:', orphanedEquipment);
    }

    if (oldNamingPatterns.length > 0) {
      console.warn('Found equipment with old naming patterns:', oldNamingPatterns);
    }

    toast.info(`Data analysis complete. Check console for details. Found ${ccEquipment.length} CC, ${ssEquipment.length} SS, ${slEquipment.length} SL equipment.`);

    return {
      ccEquipment,
      ctEquipment,
      ssEquipment,
      slEquipment,
      orphanedEquipment,
      oldNamingPatterns
    };
  }, [data]);

  return {
    analyzeDataConsistency
  };
};
