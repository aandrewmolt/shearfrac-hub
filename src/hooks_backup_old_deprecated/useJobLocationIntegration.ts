
import { useMemo } from 'react';
import { useJobs } from './useJobs';
import { useInventory } from '@/contexts/InventoryContext';
import { StorageLocation } from '@/types/inventory';
import { isEquipmentAtLocation } from '@/utils/equipmentLocation';

// Extended location type that includes job ID for job locations
export interface ExtendedLocation extends StorageLocation {
  jobId?: string;
}

export const useJobLocationIntegration = () => {
  const { jobs } = useJobs();
  const { data } = useInventory();

  // Combine storage locations and jobs into a unified location list
  const allLocations = useMemo((): ExtendedLocation[] => {
    const storageLocations: ExtendedLocation[] = data.storageLocations.map(location => ({
      ...location,
    }));

    // Filter out jobs that are already in storage locations to avoid duplicates
    const existingJobIds = new Set(data.storageLocations.map(loc => loc.id));
    const jobLocations: ExtendedLocation[] = jobs
      .filter(job => !existingJobIds.has(job.id))
      .map(job => ({
        id: job.id,
        name: job.name,
        address: undefined,
        isDefault: false,
        jobId: job.id,
      }));

    return [...storageLocations, ...jobLocations];
  }, [data.storageLocations, jobs]);

  // Get location by ID (works for both storage locations and jobs)
  const getLocationById = (locationId: string) => {
    return allLocations.find(location => location.id === locationId);
  };

  // Get location name by ID
  const getLocationName = (locationId: string) => {
    const location = getLocationById(locationId);
    return location?.name || 'Unknown Location';
  };

  // Check if a location is a job
  const isJobLocation = (locationId: string) => {
    return jobs.some(job => job.id === locationId);
  };

  // Get equipment by location (including job locations)
  const getEquipmentByLocation = (locationId: string) => {
    const isJob = isJobLocation(locationId);
    const locationType = isJob ? 'job' : 'storage';
    
    // Use centralized location logic
    const individualEquipment = data.individualEquipment.filter(item => 
      isEquipmentAtLocation(item, locationId, locationType)
    );
    
    // Bulk equipment is deprecated - keeping empty for backward compatibility
    const bulkEquipment: unknown[] = [];
    
    return {
      bulkEquipment,
      individualEquipment,
      totalItems: individualEquipment.length,
    };
  };

  // Get equipment summary by location
  const getEquipmentSummaryByLocation = (locationId: string) => {
    const { bulkEquipment, individualEquipment } = getEquipmentByLocation(locationId);
    
    const summary = new Map<string, { typeName: string; count: number; category: string }>();
    
    // Process bulk equipment
    bulkEquipment.forEach(item => {
      const type = data.equipmentTypes.find(t => t.id === item.typeId);
      if (type) {
        const key = type.id;
        const existing = summary.get(key) || { typeName: type.name, count: 0, category: type.category };
        summary.set(key, { ...existing, count: existing.count + item.quantity });
      }
    });

    // Process individual equipment
    individualEquipment.forEach(item => {
      const type = data.equipmentTypes.find(t => t.id === item.typeId);
      if (type) {
        const key = type.id;
        const existing = summary.get(key) || { typeName: type.name, count: 0, category: type.category };
        summary.set(key, { ...existing, count: existing.count + 1 });
      }
    });

    return Array.from(summary.values());
  };

  return {
    allLocations,
    storageLocations: data.storageLocations,
    jobLocations: jobs.map(job => ({
      id: job.id,
      name: job.name,
      jobId: job.id,
    })),
    getLocationById,
    getLocationName,
    isJobLocation,
    getEquipmentByLocation,
    getEquipmentSummaryByLocation,
  };
};
