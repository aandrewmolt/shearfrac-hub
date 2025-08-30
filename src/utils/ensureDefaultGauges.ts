import awsDatabase from '@/services/awsDatabase';

// Cache to avoid repeated checks
let gaugesInitialized = false;

export async function ensureDefaultGauges() {
  if (gaugesInitialized) {
    return;
  }
  
  try {
    // First ensure gauge types exist
    const { ensureGaugeTypes } = await import('./ensureGaugeTypes');
    await ensureGaugeTypes();
    
    // Check if we have any gauge equipment
    const equipment = await awsDatabase.getEquipment();
    const gaugeTypes = ['gauge-abra', 'gauge-shearwave', 'gauge-1502', 'gauge-pencil'];
    
    for (const gaugeType of gaugeTypes) {
      const gaugesOfType = equipment.filter(e => e.equipmentType === gaugeType);
      if (gaugesOfType.length === 0) {
        console.log(`No ${gaugeType} equipment found, creating defaults...`);
        
        // Create a few default items for this gauge type
        const prefix = {
          'gauge-abra': 'ABRA',
          'gauge-shearwave': 'SW',
          'gauge-1502': 'PG1502',
          'gauge-pencil': 'PGP'
        }[gaugeType];
        
        const name = {
          'gauge-abra': 'Abra Gauge',
          'gauge-shearwave': 'ShearWave Gauge',
          'gauge-1502': '1502 Pressure Gauge',
          'gauge-pencil': 'Pencil Gauge'
        }[gaugeType];
        
        // Create 5 items of each type
        for (let i = 1; i <= 5; i++) {
          try {
            await awsDatabase.createEquipment({
              equipmentCode: `${prefix}-${String(i).padStart(3, '0')}`,
              name: `${name} ${i}`,
              equipmentType: gaugeType,
              location: 'Midland Office',
              status: 'available',
              serialNumber: '',
              notes: 'Auto-generated gauge equipment',
            });
          } catch (error: any) {
            // Skip if equipment already exists
            if (error?.message?.includes('already exists')) {
              console.log(`${prefix}-${String(i).padStart(3, '0')} already exists, skipping`);
            } else {
              console.error(`Error creating ${prefix}-${String(i).padStart(3, '0')}:`, error);
            }
          }
        }
      }
    }
    
    gaugesInitialized = true;
  } catch (error) {
    console.error('Error ensuring default gauges:', error);
  }
}