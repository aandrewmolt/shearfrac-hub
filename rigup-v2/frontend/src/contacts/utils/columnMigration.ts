import { ContactColumn } from '../types';

/**
 * Migrates column settings to remove phoneNumber and ensure only phone column exists
 */
export function migrateColumnSettings(columns: ContactColumn[]): ContactColumn[] {
  // Remove any phoneNumber columns and customType columns
  let migrated = columns.filter(col => col.key !== 'phoneNumber' && col.key !== 'customType');
  
  // Check if phone column exists for all types
  const hasPhoneColumn = migrated.some(col => col.key === 'phone');
  
  // If there's no phone column but there was a phoneNumber column, add phone column
  const hadPhoneNumber = columns.some(col => col.key === 'phoneNumber');
  if (!hasPhoneColumn && hadPhoneNumber) {
    // Find where phoneNumber was positioned
    const phoneNumberIndex = columns.findIndex(col => col.key === 'phoneNumber');
    const phoneNumberOrder = columns.find(col => col.key === 'phoneNumber')?.order || 6;
    
    // Insert phone column at the same position
    const phoneColumn: ContactColumn = {
      id: 'phone',
      label: 'Phone',
      key: 'phone',
      sortable: true,
      filterable: true,
      order: phoneNumberOrder,
    };
    
    if (phoneNumberIndex >= 0 && phoneNumberIndex < migrated.length) {
      migrated.splice(phoneNumberIndex, 0, phoneColumn);
    } else {
      migrated.push(phoneColumn);
    }
  }
  
  // Ensure type column exists but is hidden
  const hasTypeColumn = migrated.some(col => col.key === 'type');
  if (!hasTypeColumn) {
    migrated.push({
      id: 'type',
      label: 'Type',
      key: 'type',
      sortable: true,
      filterable: true,
      order: 99,
      visible: false,
    });
  } else {
    // Make sure type column is hidden
    migrated = migrated.map(col => 
      col.key === 'type' ? { ...col, visible: false } : col
    );
  }
  
  return migrated;
}