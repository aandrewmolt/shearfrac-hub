import { tursoDb } from '@/services/tursoDb';
import { v4 as uuidv4 } from 'uuid';

const gaugeItems = [
  // Abra Gauges
  ...Array.from({ length: 10 }, (_, i) => ({
    id: uuidv4(),
    equipmentId: `ABRA-${String(i + 1).padStart(3, '0')}`,
    name: `Abra Gauge ${String(i + 1).padStart(3, '0')}`,
    typeId: 'gauge-abra',
    locationId: 'midland-office',
    status: 'available',
    serialNumber: '',
    notes: 'Default gauge equipment',
  })),
  
  // ShearWave Gauges
  ...Array.from({ length: 10 }, (_, i) => ({
    id: uuidv4(),
    equipmentId: `SW-${String(i + 1).padStart(3, '0')}`,
    name: `ShearWave Gauge ${String(i + 1).padStart(3, '0')}`,
    typeId: 'gauge-shearwave',
    locationId: 'midland-office',
    status: 'available',
    serialNumber: '',
    notes: 'Default gauge equipment',
  })),
  
  // 1502 Pressure Gauges
  ...Array.from({ length: 15 }, (_, i) => ({
    id: uuidv4(),
    equipmentId: `PG1502-${String(i + 1).padStart(3, '0')}`,
    name: `1502 Pressure Gauge ${String(i + 1).padStart(3, '0')}`,
    typeId: 'gauge-1502',
    locationId: 'midland-office',
    status: 'available',
    serialNumber: '',
    notes: 'Default gauge equipment',
  })),
  
  // Pencil Gauges
  ...Array.from({ length: 15 }, (_, i) => ({
    id: uuidv4(),
    equipmentId: `PGP-${String(i + 1).padStart(3, '0')}`,
    name: `Pencil Gauge ${String(i + 1).padStart(3, '0')}`,
    typeId: 'gauge-pencil',
    locationId: 'midland-office',
    status: 'available',
    serialNumber: '',
    notes: 'Default gauge equipment',
  })),
];

export async function createDefaultGauges() {
  console.log('🚀 Creating default gauge equipment items...');
  
  try {
    // First ensure gauge types exist
    const { ensureGaugeTypes } = await import('./ensureGaugeTypes');
    await ensureGaugeTypes();
    
    // Get existing equipment to avoid duplicates
    const existingEquipment = await tursoDb.getIndividualEquipment();
    const existingIds = new Set(existingEquipment.map(e => e.equipmentId));
    
    let created = 0;
    for (const gauge of gaugeItems) {
      if (!existingIds.has(gauge.equipmentId)) {
        console.log(`Creating ${gauge.name}...`);
        await tursoDb.addIndividualEquipment(gauge);
        created++;
      }
    }
    
    console.log(`\n✅ Created ${created} gauge equipment items`);
    console.log(`📊 Total gauges in inventory: ${gaugeItems.length}`);
    
  } catch (error) {
    console.error('❌ Error creating gauge equipment:', error);
    throw error;
  }
}

// Export for use in other files
export { gaugeItems };

// Only run if executed directly
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  createDefaultGauges()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}