import { tursoDb } from '@/services/tursoDb';
import { v4 as uuidv4 } from 'uuid';

// Equipment type IDs from the system
const EQUIPMENT_TYPE_IDS = {
  shearStream: 'shearstream-box',
  customerTablet: 'customer-tablet',
  starlink: 'starlink',
  customerComputer: 'customer-computer',
  cable100ft: '100ft-cable',
  cable200ft: '200ft-cable',
  cable300ftOld: '300ft-cable-old',
  cable300ftNew: '300ft-cable-new',
  directConnection: 'direct-connection',
  yAdapter: 'y-adapter',
  pressureGauge1502: 'pressure-gauge-1502',
  pressureGaugePencil: 'pressure-gauge-pencil'
};

// Default location (Midland Office is the default)
const DEFAULT_LOCATION_ID = 'midland-office';

interface IndividualEquipmentItem {
  equipmentId: string;
  name: string;
  typeId: string;
}

interface BulkEquipmentUpdate {
  typeId: string;
  quantity: number;
}

async function ensureRequiredEquipmentTypes() {
  const requiredTypes = [
    {
      id: 'direct-connection',
      name: 'Direct',
      category: 'cables',
      description: 'Direct connection (no cable)',
      requires_individual_tracking: false
    },
    {
      id: 'pressure-gauge-pencil',
      name: 'Pencil Gauge',
      category: 'gauges',
      description: 'Pencil pressure gauge for well monitoring',
      requires_individual_tracking: false
    },
    {
      id: 'pressure-gauge-1502',
      name: '1502 Pressure Gauge',
      category: 'gauges',
      description: '1502 pressure gauge for well monitoring',
      requires_individual_tracking: false
    },
    {
      id: '100ft-cable',
      name: '100ft Cable',
      category: 'cables',
      description: '100-foot data/power cable',
      requires_individual_tracking: false
    },
    {
      id: '200ft-cable',
      name: '200ft Cable',
      category: 'cables',
      description: '200-foot data/power cable',
      requires_individual_tracking: false
    },
    {
      id: '300ft-cable-old',
      name: '300ft Cable (Old)',
      category: 'cables',
      description: 'Older model 300-foot cable',
      requires_individual_tracking: false
    },
    {
      id: '300ft-cable-new',
      name: '300ft Cable (New)',
      category: 'cables',
      description: 'New model 300-foot cable',
      requires_individual_tracking: false
    },
    {
      id: 'y-adapter',
      name: 'Y-Adapter',
      category: 'adapters',
      description: 'Y-shaped adapter for splitting pressure connections',
      requires_individual_tracking: false
    }
  ];

  try {
    const existingTypes = await tursoDb.getEquipmentTypes();
    const existingIds = new Set(existingTypes.map(t => t.id));
    
    for (const type of requiredTypes) {
      if (!existingIds.has(type.id)) {
        console.log(`📦 Creating equipment type: ${type.name}...`);
        try {
          await tursoDb.createEquipmentType(type);
          console.log(`✅ Created ${type.name}`);
        } catch (error: unknown) {
          if (error?.message?.includes('UNIQUE')) {
            console.log(`⚠️ ${type.name} already exists`);
          } else {
            console.error(`❌ Failed to create ${type.name}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Error ensuring equipment types:', error);
  }
}

async function initializeFullInventory() {
  console.log('🚀 Initializing full inventory...');

  try {
    // Ensure all required equipment types exist first
    await ensureRequiredEquipmentTypes();
    
    // Ensure Midland Office location exists
    const locations = await tursoDb.getStorageLocations();
    const midlandOffice = locations.find(loc => loc.id === DEFAULT_LOCATION_ID);
    
    if (!midlandOffice) {
      console.log('📍 Creating Midland Office location...');
      try {
        await tursoDb.createStorageLocation({
          id: DEFAULT_LOCATION_ID,
          name: 'Midland Office',
          address: 'Midland, TX',
          is_default: true
        });
        console.log('✅ Created Midland Office location');
      } catch (error: unknown) {
        if (error?.message?.includes('UNIQUE')) {
          console.log('⚠️ Midland Office already exists');
        } else {
          console.error('❌ Failed to create Midland Office:', error);
          return;
        }
      }
    }

    // Define all individual equipment items to create
    const individualEquipmentItems: IndividualEquipmentItem[] = [
      // ShearStream boxes (SS001-SS015)
      ...Array.from({ length: 15 }, (_, i) => ({
        equipmentId: `SS${String(i + 1).padStart(3, '0')}`,
        name: `ShearStream Box SS${String(i + 1).padStart(3, '0')}`,
        typeId: EQUIPMENT_TYPE_IDS.shearStream
      })),
      
      // Customer Tablets (CT01-CT10)
      ...Array.from({ length: 10 }, (_, i) => ({
        equipmentId: `CT${String(i + 1).padStart(2, '0')}`,
        name: `Customer Tablet CT${String(i + 1).padStart(2, '0')}`,
        typeId: EQUIPMENT_TYPE_IDS.customerTablet
      })),
      
      // Starlink units (SL01-SL15)
      ...Array.from({ length: 15 }, (_, i) => ({
        equipmentId: `SL${String(i + 1).padStart(2, '0')}`,
        name: `Starlink SL${String(i + 1).padStart(2, '0')}`,
        typeId: EQUIPMENT_TYPE_IDS.starlink
      })),
      
      // Customer Computers (CC01-CC10)
      ...Array.from({ length: 10 }, (_, i) => ({
        equipmentId: `CC${String(i + 1).padStart(2, '0')}`,
        name: `Customer Computer CC${String(i + 1).padStart(2, '0')}`,
        typeId: EQUIPMENT_TYPE_IDS.customerComputer
      }))
    ];

    // Check existing individual equipment to avoid duplicates
    const existingEquipment = await tursoDb.getIndividualEquipment();
    const existingIds = new Set(existingEquipment.map(eq => eq.equipment_id));
    
    // Filter out items that already exist
    const itemsToCreate = individualEquipmentItems.filter(
      item => !existingIds.has(item.equipmentId)
    );

    console.log(`📦 Creating ${itemsToCreate.length} individual equipment items...`);

    // Create individual equipment items
    for (const item of itemsToCreate) {
      await tursoDb.createIndividualEquipment({
        id: uuidv4(),
        equipment_id: item.equipmentId,
        name: item.name,
        type_id: item.typeId,
        location_id: DEFAULT_LOCATION_ID,
        status: 'available',
        notes: 'Initial inventory setup'
      });
      console.log(`✅ Created ${item.equipmentId}`);
    }

    // Create individual cable and gauge items
    const cableAndGaugeItems: IndividualEquipmentItem[] = [
      // 100ft Cables (C100-001 to C100-010)
      ...Array.from({ length: 10 }, (_, i) => ({
        equipmentId: `C100-${String(i + 1).padStart(3, '0')}`,
        name: `100ft Cable C100-${String(i + 1).padStart(3, '0')}`,
        typeId: EQUIPMENT_TYPE_IDS.cable100ft
      })),
      
      // 200ft Cables (C200-001 to C200-010)
      ...Array.from({ length: 10 }, (_, i) => ({
        equipmentId: `C200-${String(i + 1).padStart(3, '0')}`,
        name: `200ft Cable C200-${String(i + 1).padStart(3, '0')}`,
        typeId: EQUIPMENT_TYPE_IDS.cable200ft
      })),
      
      // 300ft Old Cables (C300O-001 to C300O-010)
      ...Array.from({ length: 10 }, (_, i) => ({
        equipmentId: `C300O-${String(i + 1).padStart(3, '0')}`,
        name: `300ft Cable (Old) C300O-${String(i + 1).padStart(3, '0')}`,
        typeId: EQUIPMENT_TYPE_IDS.cable300ftOld
      })),
      
      // 300ft New Cables (C300N-001 to C300N-010)
      ...Array.from({ length: 10 }, (_, i) => ({
        equipmentId: `C300N-${String(i + 1).padStart(3, '0')}`,
        name: `300ft Cable (New) C300N-${String(i + 1).padStart(3, '0')}`,
        typeId: EQUIPMENT_TYPE_IDS.cable300ftNew
      })),
      
      // Y-Adapters (YA-001 to YA-010)
      ...Array.from({ length: 10 }, (_, i) => ({
        equipmentId: `YA-${String(i + 1).padStart(3, '0')}`,
        name: `Y-Adapter YA-${String(i + 1).padStart(3, '0')}`,
        typeId: EQUIPMENT_TYPE_IDS.yAdapter
      })),
      
      // 1502 Pressure Gauges (PG1502-001 to PG1502-020)
      ...Array.from({ length: 20 }, (_, i) => ({
        equipmentId: `PG1502-${String(i + 1).padStart(3, '0')}`,
        name: `1502 Pressure Gauge PG1502-${String(i + 1).padStart(3, '0')}`,
        typeId: EQUIPMENT_TYPE_IDS.pressureGauge1502
      })),
      
      // Pencil Gauges (PGP-001 to PGP-020)
      ...Array.from({ length: 20 }, (_, i) => ({
        equipmentId: `PGP-${String(i + 1).padStart(3, '0')}`,
        name: `Pencil Gauge PGP-${String(i + 1).padStart(3, '0')}`,
        typeId: EQUIPMENT_TYPE_IDS.pressureGaugePencil
      }))
    ];

    // Add cable and gauge items to the main list
    individualEquipmentItems.push(...cableAndGaugeItems);
    
    console.log(`🔌 Creating ${cableAndGaugeItems.length} cable and gauge items...`);
    
    // Create all cable and gauge items
    for (const item of cableAndGaugeItems.filter(item => !existingIds.has(item.equipmentId))) {
      await tursoDb.createIndividualEquipment({
        id: uuidv4(),
        equipment_id: item.equipmentId,
        name: item.name,
        type_id: item.typeId,
        location_id: DEFAULT_LOCATION_ID,
        status: 'available',
        notes: 'Initial inventory setup'
      });
      console.log(`✅ Created ${item.equipmentId}`);
    }
    
    // Note: Direct connections don't need individual tracking - they're virtual

    console.log('🎉 Full inventory initialization complete!');
    
    // Trigger sync if in vercel-blob mode
    // Turso syncs automatically, no need for manual sync
    
  } catch (error) {
    console.error('❌ Error initializing inventory:', error);
  }
}

// Export for use in other files
export { initializeFullInventory };