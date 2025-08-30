import { useQuery } from '@tanstack/react-query';
import { tursoDb } from '@/services/tursoDb';
import { EquipmentType, StorageLocation, IndividualEquipment } from '@/types/inventory';
import { safeArray } from '@/utils/safeDataAccess';
import { ensureSchemaInitialized } from '@/lib/turso/initializeSchema';

export const useEquipmentQueries = () => {
  // Equipment Types Query
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
  });

  // Storage Locations Query
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
  });

  // Individual Equipment Query
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