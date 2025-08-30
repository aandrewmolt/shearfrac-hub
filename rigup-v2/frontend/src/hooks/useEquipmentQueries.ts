import { useQuery } from '@tanstack/react-query';
import { tursoDb } from '@/services/tursoDb';
import { EquipmentType, StorageLocation, IndividualEquipment } from '@/types/inventory';
import { safeArray } from '@/utils/safeDataAccess';
import { ensureSchemaInitialized } from '@/lib/turso/initializeSchema';

/**
 * Direct database queries for equipment data
 * Used by InventoryProvider to fetch initial data
 * 
 * IMPORTANT: This hook MUST NOT use useInventory() or any context
 * as it's used by the InventoryProvider itself
 */
export const useEquipmentQueries = () => {
  // Equipment Types Query with caching
  const { data: equipmentTypes = [], isLoading: typesLoading, refetch: refetchTypes } = useQuery({
    queryKey: ['equipment-types'],
    queryFn: async () => {
      try {
        // Ensure schema is initialized before fetching data
        await ensureSchemaInitialized();
        
        const types = await tursoDb.getEquipmentTypes();
        return safeArray(types).map(type => ({
        id: type.id,
        name: type.name,
        category: type.category || 'other',
        description: type.description || '',
        defaultIdPrefix: type.default_id_prefix || type.defaultIdPrefix || '',
        requiresIndividualTracking: true // All equipment now uses individual tracking
      } as EquipmentType));
      } catch (error) {
        console.error('Error fetching equipment types:', error);
        return [];
      }
    },
    staleTime: 60000, // Types don't change often - 1 minute
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Storage Locations Query with caching
  const { data: storageLocations = [], isLoading: locationsLoading, refetch: refetchLocations } = useQuery({
    queryKey: ['storage-locations'],
    queryFn: async () => {
      try {
        const locations = await tursoDb.getStorageLocations();
        return safeArray(locations).map(loc => ({
        id: loc.id,
        name: loc.name,
        address: loc.address || '',
        isDefault: loc.is_default || loc.isDefault || false
      } as StorageLocation));
      } catch (error) {
        console.error('Error fetching storage locations:', error);
        return [];
      }
    },
    staleTime: 60000, // Locations don't change often - 1 minute
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Individual Equipment Query with proper caching
  const { data: individualEquipment = [], isLoading: individualLoading, refetch: refetchIndividual } = useQuery({
    queryKey: ['individual-equipment'],
    queryFn: async () => {
      try {
        const equipment = await tursoDb.getIndividualEquipment();
        return safeArray(equipment).map(eq => ({
        id: eq.id,
        equipmentId: eq.equipment_id || eq.equipmentId,
        name: eq.name || '',
        typeId: eq.type_id || eq.typeId,
        locationId: eq.location_id || eq.locationId,
        status: eq.status || 'available',
        jobId: eq.job_id || eq.jobId,
        serialNumber: eq.serial_number || eq.serialNumber,
        purchaseDate: eq.purchase_date ? new Date(eq.purchase_date) : undefined,
        warrantyExpiry: eq.warranty_expiry ? new Date(eq.warranty_expiry) : undefined,
        notes: eq.notes || '',
        redTagReason: eq.red_tag_reason || eq.redTagReason,
        redTagPhoto: eq.red_tag_photo || eq.redTagPhoto,
        location_type: eq.location_type,
        lastUpdated: eq.updated_at ? new Date(eq.updated_at) : new Date()
      } as IndividualEquipment));
      } catch (error) {
        console.error('Error fetching individual equipment:', error);
        return [];
      }
    },
    // Add caching and deduplication
    staleTime: 30000, // Data is fresh for 30 seconds
    cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: false, // Don't auto-refetch
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data exists
  });

  const refetch = async () => {
    await Promise.all([
      refetchTypes(),
      refetchLocations(),
      refetchIndividual()
    ]);
  };

  return {
    equipmentTypes: safeArray(equipmentTypes),
    storageLocations: safeArray(storageLocations),
    individualEquipment: safeArray(individualEquipment),
    isLoading: typesLoading || locationsLoading || individualLoading,
    refetch
  };
};