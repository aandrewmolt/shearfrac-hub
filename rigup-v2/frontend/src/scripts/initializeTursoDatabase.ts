import { tursoDb } from '@/services/tursoDb';
import { createSchema } from '@/lib/turso/schema';
import { v4 as uuidv4 } from 'uuid';

// Default equipment types
const DEFAULT_EQUIPMENT_TYPES = [
  {
    id: 'shearstream-box',
    name: 'ShearStream Box',
    category: 'control-units',
    description: 'ShearStream control box for well operations',
    requires_individual_tracking: true,
    default_id_prefix: 'SS'
  },
  {
    id: 'customer-tablet',
    name: 'Customer Tablet',
    category: 'it-equipment',
    description: 'Tablet for customer use',
    requires_individual_tracking: true,
    default_id_prefix: 'CT'
  },
  {
    id: 'starlink',
    name: 'Starlink',
    category: 'it-equipment',
    description: 'Starlink satellite internet equipment',
    requires_individual_tracking: true,
    default_id_prefix: 'SL'
  },
  {
    id: 'customer-computer',
    name: 'Customer Computer',
    category: 'it-equipment',
    description: 'Desktop computer for customer use',
    requires_individual_tracking: true,
    default_id_prefix: 'CC'
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
    id: 'direct-connection',
    name: 'Direct',
    category: 'cables',
    description: 'Direct connection (no cable)',
    requires_individual_tracking: false
  },
  {
    id: 'y-adapter',
    name: 'Y-Adapter',
    category: 'adapters',
    description: 'Y-shaped adapter for splitting pressure connections',
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
    id: 'pressure-gauge-pencil',
    name: 'Pencil Gauge',
    category: 'gauges',
    description: 'Pencil pressure gauge for well monitoring',
    requires_individual_tracking: false
  }
];

// Default storage locations
const DEFAULT_LOCATIONS = [
  {
    id: 'midland-office',
    name: 'Midland Office',
    address: 'Midland, TX',
    is_default: true
  },
  {
    id: 'houston-warehouse',
    name: 'Houston Warehouse',
    address: 'Houston, TX',
    is_default: false
  }
];

// All individual equipment items to create
const INDIVIDUAL_EQUIPMENT = [
  // ShearStream boxes (SS001-SS015)
  ...Array.from({ length: 15 }, (_, i) => ({
    equipment_id: `SS${String(i + 1).padStart(3, '0')}`,
    name: `ShearStream Box SS${String(i + 1).padStart(3, '0')}`,
    type_id: 'shearstream-box'
  })),
  // Customer Tablets (CT01-CT10)
  ...Array.from({ length: 10 }, (_, i) => ({
    equipment_id: `CT${String(i + 1).padStart(2, '0')}`,
    name: `Customer Tablet CT${String(i + 1).padStart(2, '0')}`,
    type_id: 'customer-tablet'
  })),
  // Starlink units (SL01-SL15)
  ...Array.from({ length: 15 }, (_, i) => ({
    equipment_id: `SL${String(i + 1).padStart(2, '0')}`,
    name: `Starlink SL${String(i + 1).padStart(2, '0')}`,
    type_id: 'starlink'
  })),
  // Customer Computers (CC01-CC10)
  ...Array.from({ length: 10 }, (_, i) => ({
    equipment_id: `CC${String(i + 1).padStart(2, '0')}`,
    name: `Customer Computer CC${String(i + 1).padStart(2, '0')}`,
    type_id: 'customer-computer'
  }))
];

// Cable and gauge equipment to create as individual items
const CABLE_AND_GAUGE_EQUIPMENT = [
  // 100ft Cables
  ...Array.from({ length: 10 }, (_, i) => ({
    equipment_id: `C100-${String(i + 1).padStart(3, '0')}`,
    name: `100ft Cable C100-${String(i + 1).padStart(3, '0')}`,
    type_id: '100ft-cable'
  })),
  // 200ft Cables
  ...Array.from({ length: 10 }, (_, i) => ({
    equipment_id: `C200-${String(i + 1).padStart(3, '0')}`,
    name: `200ft Cable C200-${String(i + 1).padStart(3, '0')}`,
    type_id: '200ft-cable'
  })),
  // 300ft Old Cables
  ...Array.from({ length: 10 }, (_, i) => ({
    equipment_id: `C300O-${String(i + 1).padStart(3, '0')}`,
    name: `300ft Cable (Old) C300O-${String(i + 1).padStart(3, '0')}`,
    type_id: '300ft-cable-old'
  })),
  // 300ft New Cables
  ...Array.from({ length: 10 }, (_, i) => ({
    equipment_id: `C300N-${String(i + 1).padStart(3, '0')}`,
    name: `300ft Cable (New) C300N-${String(i + 1).padStart(3, '0')}`,
    type_id: '300ft-cable-new'
  })),
  // Y-Adapters
  ...Array.from({ length: 10 }, (_, i) => ({
    equipment_id: `YA-${String(i + 1).padStart(3, '0')}`,
    name: `Y-Adapter YA-${String(i + 1).padStart(3, '0')}`,
    type_id: 'y-adapter'
  })),
  // 1502 Pressure Gauges
  ...Array.from({ length: 20 }, (_, i) => ({
    equipment_id: `PG1502-${String(i + 1).padStart(3, '0')}`,
    name: `1502 Pressure Gauge PG1502-${String(i + 1).padStart(3, '0')}`,
    type_id: 'pressure-gauge-1502'
  })),
  // Pencil Gauges
  ...Array.from({ length: 20 }, (_, i) => ({
    equipment_id: `PGP-${String(i + 1).padStart(3, '0')}`,
    name: `Pencil Gauge PGP-${String(i + 1).padStart(3, '0')}`,
    type_id: 'pressure-gauge-pencil'
  }))
];

// Combine all equipment
const ALL_INDIVIDUAL_EQUIPMENT = [...INDIVIDUAL_EQUIPMENT, ...CABLE_AND_GAUGE_EQUIPMENT];

export async function initializeTursoDatabase() {
  console.log('🚀 Initializing Turso database...');
  
  try {
    // Create schema first
    try {
      await createSchema();
    } catch (schemaError) {
      console.log('⚠️ Schema creation error (may already exist):', schemaError);
      // Continue with initialization even if schema exists
    }
    
    // Create equipment types
    console.log('📦 Creating equipment types...');
    for (const type of DEFAULT_EQUIPMENT_TYPES) {
      try {
        await tursoDb.createEquipmentType(type);
        console.log(`✅ Created equipment type: ${type.name}`);
      } catch (error: unknown) {
        if (error?.message?.includes('UNIQUE')) {
          console.log(`⚠️ Equipment type already exists: ${type.name}`);
        } else {
          throw error;
        }
      }
    }
    
    // Create storage locations
    console.log('🏢 Creating storage locations...');
    for (const location of DEFAULT_LOCATIONS) {
      try {
        await tursoDb.createStorageLocation(location);
        console.log(`✅ Created location: ${location.name}`);
      } catch (error: unknown) {
        if (error?.message?.includes('UNIQUE')) {
          console.log(`⚠️ Location already exists: ${location.name}`);
        } else {
          throw error;
        }
      }
    }
    
    // Create all individual equipment items
    console.log('🔧 Creating individual equipment items...');
    for (const item of ALL_INDIVIDUAL_EQUIPMENT) {
      try {
        await tursoDb.createIndividualEquipment({
          ...item,
          location_id: 'midland-office',
          status: 'available',
          notes: 'Initial inventory setup'
        });
        console.log(`✅ Created: ${item.equipment_id}`);
      } catch (error: unknown) {
        if (error?.message?.includes('UNIQUE')) {
          console.log(`⚠️ Equipment already exists: ${item.equipment_id}`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('🎉 Turso database initialization complete!');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
}

// Only run if executed directly in Node.js environment
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  initializeTursoDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}