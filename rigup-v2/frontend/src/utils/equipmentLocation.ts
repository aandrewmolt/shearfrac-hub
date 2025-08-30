import { IndividualEquipment, BulkEquipment } from '@/types/inventory';

/**
 * Central utility for determining where equipment should be displayed
 * This is the SINGLE SOURCE OF TRUTH for equipment location logic
 */

export interface EquipmentLocation {
  type: 'storage' | 'job';
  id: string;
  displayName?: string;
}

/**
 * Get the current display location for an individual equipment item
 * If deployed, shows at job location. Otherwise shows at storage location.
 */
export function getEquipmentDisplayLocation(item: IndividualEquipment): EquipmentLocation {
  // If equipment is deployed to a job, it should display under that job
  if (item.status === 'deployed' && item.jobId) {
    return {
      type: 'job',
      id: item.jobId,
    };
  }
  
  // Otherwise, it displays at its storage location
  return {
    type: 'storage',
    id: item.locationId,
  };
}

/**
 * Get the physical/home location (storage location) of equipment
 * This is where the equipment "belongs" when not deployed
 */
export function getEquipmentHomeLocation(item: IndividualEquipment): string {
  return item.locationId;
}

/**
 * Check if equipment should be shown at a specific location
 */
export function isEquipmentAtLocation(
  item: IndividualEquipment, 
  locationId: string, 
  locationType: 'storage' | 'job'
): boolean {
  if (locationType === 'job') {
    // For job locations, only show deployed equipment assigned to this job
    return item.status === 'deployed' && item.jobId === locationId;
  } else {
    // For storage locations, show equipment that:
    // 1. Has status 'available' AND locationId matches
    // 2. OR is not deployed AND locationId matches (for other statuses like maintenance)
    if (item.status === 'available') {
      // Available equipment should be shown at its locationId regardless of jobId
      return item.locationId === locationId;
    }
    // For non-available statuses, use the display location logic
    const displayLocation = getEquipmentDisplayLocation(item);
    return displayLocation.type === 'storage' && displayLocation.id === locationId;
  }
}

/**
 * Filter equipment list by location
 */
export function filterEquipmentByLocation(
  equipment: IndividualEquipment[],
  locationId: string,
  locationType: 'storage' | 'job'
): IndividualEquipment[] {
  return equipment.filter(item => isEquipmentAtLocation(item, locationId, locationType));
}

/**
 * Group equipment by their current display location
 */
export function groupEquipmentByLocation(equipment: IndividualEquipment[]): {
  storageLocations: Map<string, IndividualEquipment[]>;
  jobs: Map<string, IndividualEquipment[]>;
} {
  const storageLocations = new Map<string, IndividualEquipment[]>();
  const jobs = new Map<string, IndividualEquipment[]>();
  
  equipment.forEach(item => {
    const location = getEquipmentDisplayLocation(item);
    
    if (location.type === 'job') {
      const jobEquipment = jobs.get(location.id) || [];
      jobEquipment.push(item);
      jobs.set(location.id, jobEquipment);
    } else {
      const storageEquipment = storageLocations.get(location.id) || [];
      storageEquipment.push(item);
      storageLocations.set(location.id, storageEquipment);
    }
  });
  
  return { storageLocations, jobs };
}

/**
 * Get a human-readable description of where equipment is
 */
export function getEquipmentLocationDescription(
  item: IndividualEquipment,
  getLocationName: (id: string) => string,
  getJobName: (id: string) => string
): string {
  const location = getEquipmentDisplayLocation(item);
  
  if (location.type === 'job') {
    const jobName = getJobName(location.id);
    const homeName = getLocationName(item.locationId);
    return `Deployed to ${jobName} (from ${homeName})`;
  }
  
  return `Available at ${getLocationName(location.id)}`;
}