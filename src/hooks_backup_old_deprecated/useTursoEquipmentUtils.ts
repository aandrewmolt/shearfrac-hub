import { useMemo } from 'react';
import { IndividualEquipment, EquipmentType, StorageLocation } from '@/types/inventory';
import { safeArray } from '@/utils/safeDataAccess';

export const useTursoEquipmentUtils = (individualEquipment: IndividualEquipment[]) => {
  // Get equipment by ID
  const getEquipmentById = useMemo(() => (id: string): IndividualEquipment | undefined => {
    return safeArray(individualEquipment).find(eq => eq.id === id);
  }, [individualEquipment]);

  // Get equipment by equipment_id (barcode/serial)
  const getEquipmentByEquipmentId = useMemo(() => (equipmentId: string): IndividualEquipment | undefined => {
    return safeArray(individualEquipment).find(eq => eq.equipmentId === equipmentId);
  }, [individualEquipment]);

  // Get equipment by type
  const getEquipmentByType = useMemo(() => (typeId: string): IndividualEquipment[] => {
    return safeArray(individualEquipment).filter(eq => eq.equipmentTypeId === typeId);
  }, [individualEquipment]);

  // Get equipment by status
  const getEquipmentByStatus = useMemo(() => (status: string): IndividualEquipment[] => {
    return safeArray(individualEquipment).filter(eq => eq.status === status);
  }, [individualEquipment]);

  // Get equipment by location
  const getEquipmentByLocation = useMemo(() => (locationId: string): IndividualEquipment[] => {
    return safeArray(individualEquipment).filter(eq => eq.storageLocationId === locationId);
  }, [individualEquipment]);

  // Get available equipment
  const getAvailableEquipment = useMemo(() => (): IndividualEquipment[] => {
    return safeArray(individualEquipment).filter(eq => eq.status === 'available');
  }, [individualEquipment]);

  // Get deployed equipment
  const getDeployedEquipment = useMemo(() => (): IndividualEquipment[] => {
    return safeArray(individualEquipment).filter(eq => eq.status === 'deployed');
  }, [individualEquipment]);

  // Get maintenance equipment
  const getMaintenanceEquipment = useMemo(() => (): IndividualEquipment[] => {
    return safeArray(individualEquipment).filter(eq => eq.status === 'maintenance');
  }, [individualEquipment]);

  // Get red-tagged equipment
  const getRedTaggedEquipment = useMemo(() => (): IndividualEquipment[] => {
    return safeArray(individualEquipment).filter(eq => eq.status === 'red-tagged');
  }, [individualEquipment]);

  // Get equipment count by status
  const getEquipmentCountByStatus = useMemo(() => (): Record<string, number> => {
    const counts: Record<string, number> = {
      available: 0,
      deployed: 0,
      maintenance: 0,
      'red-tagged': 0,
      retired: 0
    };

    safeArray(individualEquipment).forEach(eq => {
      if (eq.status && Object.prototype.hasOwnProperty.call(counts, eq.status)) {
        counts[eq.status]++;
      }
    });

    return counts;
  }, [individualEquipment]);

  // Get equipment count by type
  const getEquipmentCountByType = useMemo(() => (): Record<string, number> => {
    const counts: Record<string, number> = {};

    safeArray(individualEquipment).forEach(eq => {
      if (eq.equipmentTypeId) {
        counts[eq.equipmentTypeId] = (counts[eq.equipmentTypeId] || 0) + 1;
      }
    });

    return counts;
  }, [individualEquipment]);

  // Get equipment count by location
  const getEquipmentCountByLocation = useMemo(() => (): Record<string, number> => {
    const counts: Record<string, number> = {};

    safeArray(individualEquipment).forEach(eq => {
      if (eq.storageLocationId) {
        counts[eq.storageLocationId] = (counts[eq.storageLocationId] || 0) + 1;
      }
    });

    return counts;
  }, [individualEquipment]);

  // Check if equipment ID exists
  const equipmentIdExists = useMemo(() => (equipmentId: string): boolean => {
    return safeArray(individualEquipment).some(eq => eq.equipmentId === equipmentId);
  }, [individualEquipment]);

  // Get next available equipment ID for a type
  const getNextEquipmentId = useMemo(() => (prefix: string): string => {
    const existingIds = safeArray(individualEquipment)
      .map(eq => eq.equipmentId)
      .filter(id => id.startsWith(prefix))
      .map(id => {
        const numPart = id.replace(prefix, '');
        return parseInt(numPart) || 0;
      })
      .sort((a, b) => b - a);

    const nextNumber = existingIds.length > 0 ? existingIds[0] + 1 : 1;
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  }, [individualEquipment]);

  // Validate equipment data
  const validateEquipment = useMemo(() => (equipment: Partial<IndividualEquipment>): string[] => {
    const errors: string[] = [];

    if (!equipment.equipmentId) {
      errors.push('Equipment ID is required');
    } else if (equipmentIdExists(equipment.equipmentId)) {
      errors.push('Equipment ID already exists');
    }

    if (!equipment.equipmentTypeId) {
      errors.push('Equipment type is required');
    }

    if (!equipment.storageLocationId) {
      errors.push('Storage location is required');
    }

    if (!equipment.status) {
      errors.push('Status is required');
    } else if (!['available', 'deployed', 'maintenance', 'red-tagged', 'retired'].includes(equipment.status)) {
      errors.push('Invalid status');
    }

    return errors;
  }, [equipmentIdExists]);

  return {
    // Single equipment getters
    getEquipmentById,
    getEquipmentByEquipmentId,
    
    // Equipment filters
    getEquipmentByType,
    getEquipmentByStatus,
    getEquipmentByLocation,
    getAvailableEquipment,
    getDeployedEquipment,
    getMaintenanceEquipment,
    getRedTaggedEquipment,
    
    // Equipment counts
    getEquipmentCountByStatus,
    getEquipmentCountByType,
    getEquipmentCountByLocation,
    
    // Utilities
    equipmentIdExists,
    getNextEquipmentId,
    validateEquipment,
  };
};