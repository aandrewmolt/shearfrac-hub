import awsDatabase from '@/services/awsDatabase';

// Cache to avoid repeated checks
let gaugesInitialized = false;

export async function ensureDefaultGauges() {
  // Disabled - equipment is managed through AWS DynamoDB
  // No need to auto-create default equipment
  return;
}