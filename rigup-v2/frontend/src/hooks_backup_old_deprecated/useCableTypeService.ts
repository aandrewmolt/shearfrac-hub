
import { EquipmentType } from '@/types/inventory';
import { migrateCableTypeId } from '@/utils/consolidated/migrationUtils';

export const useCableTypeService = (equipmentTypes: EquipmentType[]) => {
  
  const getCableTypes = () => {
    return equipmentTypes.filter(type => type.category === 'cables');
  };

  const getCableTypeById = (typeId: string) => {
    // Migrate old cable type ID to new format first
    const migratedId = migrateCableTypeId(typeId);
    return equipmentTypes.find(type => type.id === migratedId && type.category === 'cables');
  };

  const getCableColor = (cableTypeId: string) => {
    // Migrate old cable type ID to new format first
    const migratedId = migrateCableTypeId(cableTypeId);
    const cableType = getCableTypeById(migratedId);
    
    if (!cableType) return '#6b7280'; // Default gray
    
    const id = cableType.id;
    const name = cableType.name.toLowerCase();
    
    // Handle specific cable type IDs
    if (id === '100ft-cable') return '#ef4444'; // Red
    if (id === '200ft-cable') return '#3b82f6'; // Blue  
    if (id === '300ft-cable-old') return '#f59e0b'; // Orange for old 300ft
    if (id === '300ft-cable-new') return '#10b981'; // Green for new 300ft
    if (id === 'direct-connection') return '#10b981'; // Green for direct connection
    
    // Fallback to name-based detection
    if (name.includes('100ft')) return '#ef4444'; // Red
    if (name.includes('200ft')) return '#3b82f6'; // Blue  
    if (name.includes('300ft')) {
      if (name.includes('old') || name.includes('y adapter') || (name.includes('reel') && name.includes('old'))) {
        return '#f59e0b'; // Orange for old 300ft
      }
      if (name.includes('new') || name.includes('direct') || (name.includes('reel') && name.includes('new'))) {
        return '#10b981'; // Green for new 300ft
      }
    }
    
    return '#6b7280'; // Gray for unknown
  };

  const getCableDisplayName = (cableTypeId: string) => {
    // Migrate old cable type ID to new format first
    const migratedId = migrateCableTypeId(cableTypeId);
    const cableType = getCableTypeById(migratedId);
    return cableType?.name || 'Unknown Cable';
  };

  const getDefaultCableType = () => {
    // Prefer 200ft cable as default
    const cable200ft = equipmentTypes.find(type => 
      type.category === 'cables' && 
      type.id === '200ft-cable'
    );
    
    if (cable200ft) return cable200ft.id;
    
    // Fallback to any cable type
    const anyCable = equipmentTypes.find(type => type.category === 'cables');
    return anyCable?.id || '';
  };

  const getCableLengthFromType = (cableTypeId: string): string => {
    // Migrate old cable type ID to new format first
    const migratedId = migrateCableTypeId(cableTypeId);
    const cableType = getCableTypeById(migratedId);
    
    if (!cableType) return '200ft';
    
    const id = cableType.id;
    const name = cableType.name.toLowerCase();
    
    if (id === '100ft-cable' || name.includes('100ft')) return '100ft';
    if (id === '200ft-cable' || name.includes('200ft')) return '200ft';
    if (id.includes('300ft') || name.includes('300ft')) return '300ft';
    
    return '200ft';
  };

  const getCableVersion = (cableTypeId: string): string | undefined => {
    // Migrate old cable type ID to new format first
    const migratedId = migrateCableTypeId(cableTypeId);
    const cableType = getCableTypeById(migratedId);
    
    if (!cableType) return undefined;
    
    const id = cableType.id;
    const name = cableType.name.toLowerCase();
    
    if (id === '300ft-cable-old') return 'old';
    if (id === '300ft-cable-new') return 'new';
    
    if (name.includes('300ft')) {
      if (name.includes('old') || name.includes('y adapter') || (name.includes('reel') && name.includes('old'))) {
        return 'old';
      }
      if (name.includes('new') || name.includes('direct') || (name.includes('reel') && name.includes('new'))) {
        return 'new';
      }
    }
    return undefined;
  };

  const is300ftOldVersion = (cableTypeId: string): boolean => {
    return getCableVersion(cableTypeId) === 'old';
  };

  const is300ftNewVersion = (cableTypeId: string): boolean => {
    return getCableVersion(cableTypeId) === 'new';
  };

  return {
    getCableTypes,
    getCableTypeById,
    getCableColor,
    getCableDisplayName,
    getDefaultCableType,
    getCableLengthFromType,
    getCableVersion,
    is300ftOldVersion,
    is300ftNewVersion,
  };
};
