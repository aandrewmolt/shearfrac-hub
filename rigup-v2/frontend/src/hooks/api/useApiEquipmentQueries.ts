/**
 * Equipment Queries using AWS API
 * Replaces Turso queries with AWS Lambda/DynamoDB
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api.client';
import { EquipmentType, StorageLocation, IndividualEquipment } from '@/types/inventory';
import { safeArray } from '@/utils/safeDataAccess';

export const useApiEquipmentQueries = () => {
  // For now, we'll use empty/mock data for equipment types and storage locations
  // since the AWS backend focuses on individual equipment items
  
  // Equipment Types - using static data for now
  const { data: equipmentTypes = [], isLoading: typesLoading, refetch: refetchTypes } = useQuery({
    queryKey: ['api-equipment-types'],
    queryFn: async () => {
      // Return static equipment types until we add this to AWS backend
      return [
        { id: '1', name: 'Shearstream Box', category: 'main', description: 'Main control box', defaultIdPrefix: 'SS', requiresIndividualTracking: true },
        { id: '2', name: 'Cable Tester', category: 'testing', description: 'Cable testing equipment', defaultIdPrefix: 'CT', requiresIndividualTracking: true },
        { id: '3', name: 'Satellite', category: 'communication', description: 'Satellite communication', defaultIdPrefix: 'SAT', requiresIndividualTracking: true },
        { id: '4', name: 'Gauge', category: 'monitoring', description: 'Pressure gauge', defaultIdPrefix: 'G', requiresIndividualTracking: true },
      ] as EquipmentType[];
    },
    staleTime: 60000,
  });

  // Storage Locations - using static data for now
  const { data: storageLocations = [], isLoading: locationsLoading, refetch: refetchLocations } = useQuery({
    queryKey: ['api-storage-locations'],
    queryFn: async () => {
      // Return static locations until we add this to AWS backend
      return [
        { id: 'shop', name: 'Shop', type: 'warehouse' as const },
        { id: 'yard', name: 'Yard', type: 'yard' as const },
        { id: 'field', name: 'Field', type: 'field' as const },
      ] as StorageLocation[];
    },
    staleTime: 60000,
  });

  // Individual Equipment - fetch from AWS API
  const { data: individualEquipment = [], isLoading: equipmentLoading, refetch: refetchEquipment } = useQuery({
    queryKey: ['api-individual-equipment'],
    queryFn: async () => {
      try {
        const equipment = await apiClient.getEquipment();
        return safeArray(equipment).map(item => ({
          id: item.id,
          equipment_id: item.equipmentId || item.equipment_id,
          serial_number: item.equipmentId || item.serial_number,
          name: item.name || '',
          equipment_type_id: item.equipmentTypeId || item.type || '',
          storage_location_id: item.storageLocationId || item.location || 'shop',
          status: item.status || 'available',
          job_id: item.jobId === 'UNASSIGNED' ? null : item.jobId,
          notes: item.notes || '',
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
        } as IndividualEquipment));
      } catch (error) {
        console.error('Error fetching equipment from AWS:', error);
        return [];
      }
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: false,
    refetchOnWindowFocus: false,
  });

  const isLoading = typesLoading || locationsLoading || equipmentLoading;

  const refetch = () => {
    refetchTypes();
    refetchLocations();
    refetchEquipment();
  };

  return {
    equipmentTypes,
    storageLocations,
    individualEquipment,
    isLoading,
    refetch,
  };
};