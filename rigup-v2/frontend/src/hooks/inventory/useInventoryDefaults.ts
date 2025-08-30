
import { EquipmentType, StorageLocation, EquipmentItem, IndividualEquipment } from '@/types/inventory';
import { useCreateDefaultIndividualEquipment } from './useCreateDefaultIndividualEquipment';

export const DEFAULT_EQUIPMENT_TYPES: EquipmentType[] = [
  // Communication Equipment
  { id: 'shearstream-box', name: 'ShearStream Box', category: 'communication', description: 'Main data acquisition unit', requiresIndividualTracking: true },
  { id: 'starlink', name: 'Starlink', category: 'communication', description: 'Satellite internet terminal', requiresIndividualTracking: true },
  { id: 'customer-computer', name: 'Customer Computer', category: 'communication', description: 'Client workstation', requiresIndividualTracking: false },
  { id: 'customer-tablet', name: 'Customer Tablet', category: 'communication', description: 'Portable client device', requiresIndividualTracking: false },
  
  // Cables - Updated with exact naming to match inventory
  { id: '100ft-cable', name: '100ft Cable', category: 'cables', description: '100 foot data cable', requiresIndividualTracking: false },
  { id: '200ft-cable', name: '200ft Cable', category: 'cables', description: '200 foot data cable', requiresIndividualTracking: false },
  { id: '300ft-cable-old', name: '300ft Cable/Reel (Old)', category: 'cables', description: '300 foot data cable for Y-adapter connections', requiresIndividualTracking: false },
  { id: '300ft-cable-new', name: '300ft Cable/Reel (New)', category: 'cables', description: '300 foot data cable for direct connections', requiresIndividualTracking: false },
  { id: 'direct-connection', name: 'Direct', category: 'cables', description: 'Direct connection (no cable)', requiresIndividualTracking: false },
  
  // Adapters
  { id: 'y-adapter', name: 'Y Adapter', category: 'adapters', description: 'Signal splitting adapter', requiresIndividualTracking: false },
  
  // Gauges - Updated to match actual inventory naming
  { id: 'pressure-gauge-1502', name: '1502 Pressure Gauge', category: 'gauges', description: '1502 pressure gauge for well monitoring', requiresIndividualTracking: false },
  { id: 'pressure-gauge-pencil', name: 'Pencil Gauge', category: 'gauges', description: 'Pencil pressure gauge for well monitoring', requiresIndividualTracking: false },
];

export const DEFAULT_STORAGE_LOCATIONS: StorageLocation[] = [
  { id: 'warehouse', name: 'Main Warehouse', isDefault: false },
  { id: 'field-trailer', name: 'Field Trailer', isDefault: false },
  { id: 'midland-office', name: 'Midland Office', isDefault: true },
  { id: 'deployed', name: 'Deployed', isDefault: false },
  { id: 'maintenance', name: 'Maintenance', isDefault: false },
];

export const useInventoryDefaults = () => {
  const { createDefaultIndividualEquipment } = useCreateDefaultIndividualEquipment();
  const createDefaultInventory = (): EquipmentItem[] => [
    // ShearStream Boxes - consolidated to Midland Office
    { id: 'ss001', typeId: 'shearstream-box', locationId: 'midland-office', quantity: 5, status: 'available', lastUpdated: new Date() },
    
    // Starlink units - consolidated to Midland Office
    { id: 'sl001', typeId: 'starlink', locationId: 'midland-office', quantity: 5, status: 'available', lastUpdated: new Date() },
    
    // Customer Computers - consolidated to Midland Office
    { id: 'cc001', typeId: 'customer-computer', locationId: 'midland-office', quantity: 8, status: 'available', lastUpdated: new Date() },
    
    // Customer Tablets - consolidated to Midland Office
    { id: 'ct001', typeId: 'customer-tablet', locationId: 'midland-office', quantity: 4, status: 'available', lastUpdated: new Date() },
    
    // Cables - consolidated and merged, added missing 300ft variants
    { id: 'c100-001', typeId: '100ft-cable', locationId: 'midland-office', quantity: 23, status: 'available', lastUpdated: new Date() },
    { id: 'c200-001', typeId: '200ft-cable', locationId: 'midland-office', quantity: 18, status: 'available', lastUpdated: new Date() },
    { id: 'c300old-001', typeId: '300ft-cable-old', locationId: 'midland-office', quantity: 19, status: 'available', lastUpdated: new Date() },
    { id: 'c300new-001', typeId: '300ft-cable-new', locationId: 'midland-office', quantity: 17, status: 'available', lastUpdated: new Date() },
    
    // Direct Connection - unlimited quantity
    { id: 'direct-001', typeId: 'direct-connection', locationId: 'midland-office', quantity: 9999, status: 'available', lastUpdated: new Date() },
    
    // Y Adapters - consolidated to Midland Office
    { id: 'ya001', typeId: 'y-adapter', locationId: 'midland-office', quantity: 15, status: 'available', lastUpdated: new Date() },
    
    // 1502 Pressure Gauges - consolidated to Midland Office (used as Wellside Gauge on diagram)
    { id: 'pg001', typeId: 'pressure-gauge-1502', locationId: 'midland-office', quantity: 4, status: 'available', lastUpdated: new Date() },
    
    // Pencil Gauges - consolidated to Midland Office
    { id: 'pg002', typeId: 'pressure-gauge-pencil', locationId: 'midland-office', quantity: 20, status: 'available', lastUpdated: new Date() },
  ];

  const resetToDefaultInventory = () => {
    const defaultData = {
      equipmentTypes: DEFAULT_EQUIPMENT_TYPES,
      storageLocations: DEFAULT_STORAGE_LOCATIONS,
      equipmentItems: createDefaultInventory(),
      individualEquipment: createDefaultIndividualEquipment(),
      lastSync: new Date(),
    };
    
    return defaultData;
  };

  // Enhanced function to cleanup and merge duplicate inventory items
  const cleanupInventoryDuplicates = (existingItems: EquipmentItem[]): EquipmentItem[] => {
    const mergedItems = new Map<string, EquipmentItem>();
    
    // Group items by type, location, and status for proper merging
    existingItems.forEach(item => {
      const key = `${item.typeId}-${item.locationId}-${item.status}`;
      
      if (mergedItems.has(key)) {
        // Merge quantities for duplicate items
        const existing = mergedItems.get(key)!;
        existing.quantity += item.quantity;
        existing.lastUpdated = new Date();
        
        // Merge notes if both have them
        if (item.notes && existing.notes) {
          existing.notes = `${existing.notes}; ${item.notes}`;
        } else if (item.notes && !existing.notes) {
          existing.notes = item.notes;
        }
      } else {
        mergedItems.set(key, { ...item, lastUpdated: new Date() });
      }
    });
    
    return Array.from(mergedItems.values());
  };

  return {
    DEFAULT_EQUIPMENT_TYPES,
    DEFAULT_STORAGE_LOCATIONS,
    createDefaultInventory,
    resetToDefaultInventory,
    cleanupInventoryDuplicates,
  };
};
