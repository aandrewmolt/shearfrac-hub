// AWS doesn't have separate equipment types - this is now a no-op

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

// Cache to avoid repeated checks
let gaugeTypesInitialized = false;

export async function ensureGaugeTypes() {
  if (gaugeTypesInitialized) {
    return;
  }
  
  // AWS doesn't have separate equipment types table
  // Equipment types are derived from existing equipment records
  console.log('✅ Equipment types are derived from equipment records (AWS backend)');
  gaugeTypesInitialized = true;
}

export { gaugeTypes };