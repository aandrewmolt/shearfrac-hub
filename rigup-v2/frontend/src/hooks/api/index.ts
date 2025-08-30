/**
 * API Hooks Index
 * Export all API hooks for easy import
 */

export { useApiJobs } from './useApiJobs';
export { useApiDiagram } from './useApiDiagram';
export { useApiEquipment } from './useApiEquipment';
export { useApiContacts } from './useApiContacts';
export { useApiSync } from './useApiSync';

// Adapter exports for backward compatibility
export { useApiJobs as useJobs } from './useApiJobs';
export { useApiEquipment as useEquipment } from './useApiEquipment';
export { useApiContacts as useContacts } from './useApiContacts';