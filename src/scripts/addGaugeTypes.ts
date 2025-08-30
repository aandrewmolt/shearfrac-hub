import { tursoDb } from '@/services/tursoDb';

const gaugeTypes = [
  {
    id: 'gauge-abra',
    name: 'Abra Gauge',
    category: 'gauges',
    description: 'Abra pressure monitoring gauge',
    default_id_prefix: 'ABRA',
  },
  {
    id: 'gauge-shearwave',
    name: 'ShearWave Gauge',
    category: 'gauges',
    description: 'ShearWave pressure monitoring gauge',
    default_id_prefix: 'SW',
  },
  {
    id: 'gauge-1502',
    name: '1502 Pressure Gauge',
    category: 'gauges',
    description: '1502 pressure gauge for well monitoring',
    default_id_prefix: 'PG1502',
  },
  {
    id: 'gauge-pencil',
    name: 'Pencil Gauge',
    category: 'gauges',
    description: 'Pencil pressure gauge for well monitoring',
    default_id_prefix: 'PGP',
  },
];

export async function addGaugeTypes() {
  console.log('🚀 Adding gauge types to equipment types...');
  
  try {
    for (const gaugeType of gaugeTypes) {
      try {
        // Check if type already exists
        const existing = await tursoDb.getEquipmentTypeById(gaugeType.id);
        if (existing) {
          console.log(`✅ Gauge type ${gaugeType.name} already exists`);
          continue;
        }
      } catch (e) {
        // Type doesn't exist, we can add it
      }
      
      console.log(`📦 Creating gauge type: ${gaugeType.name}...`);
      await tursoDb.addEquipmentType(gaugeType);
      console.log(`✅ Created ${gaugeType.name}`);
    }
    
    console.log('\n🎉 Gauge types setup complete!');
    
  } catch (error) {
    console.error('❌ Error adding gauge types:', error);
    throw error;
  }
}

// Export for use in other files
export { gaugeTypes };

// Only run if executed directly
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  addGaugeTypes()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}