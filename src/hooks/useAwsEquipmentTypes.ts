/**
 * AWS Equipment Types Hook
 * Since AWS doesn't have separate equipment types, we derive them from equipment records
 */

import { useState, useEffect, useCallback } from 'react';
import awsApi from '@/services/awsApiService';
import { toast } from 'sonner';

interface EquipmentType {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export const useAwsEquipmentTypes = () => {
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get unique equipment types from existing equipment
  const loadEquipmentTypes = useCallback(async () => {
    try {
      setLoading(true);
      const equipment = await awsApi.equipment.list();
      
      // Extract unique types from equipment
      const typeMap = new Map<string, EquipmentType>();
      
      equipment.forEach((item: any) => {
        if (item.type && !typeMap.has(item.type)) {
          const category = getCategoryFromType(item.type);
          typeMap.set(item.type, {
            id: item.type,
            name: formatTypeName(item.type),
            category: category,
            description: `${formatTypeName(item.type)} equipment`
          });
        }
      });

      const types = Array.from(typeMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      setEquipmentTypes(types);
      setError(null);
    } catch (err) {
      console.error('Failed to load equipment types:', err);
      setError('Failed to load equipment types');
      toast.error('Failed to load equipment types');
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper to determine category from type
  const getCategoryFromType = (type: string): string => {
    if (type.includes('gauge')) return 'gauges';
    if (type.includes('box') || type.includes('shearstream')) return 'control-units';
    if (type.includes('computer')) return 'it-equipment';
    if (type.includes('cable')) return 'cables';
    if (type.includes('adapter')) return 'adapters';
    if (type.includes('starlink') || type.includes('satellite')) return 'communication';
    if (type.includes('power') || type.includes('battery')) return 'power';
    return 'general';
  };

  // Helper to format type name for display
  const formatTypeName = (type: string): string => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Create new equipment type (by creating equipment with that type)
  const createEquipmentType = useCallback(async (typeData: { name: string; category: string }) => {
    try {
      const typeId = typeData.name.toLowerCase().replace(/\s+/g, '-');
      
      // Create a placeholder equipment item to establish the type
      await awsApi.equipment.create({
        code: `${typeId.toUpperCase()}-001`,
        name: `${typeData.name} 001`,
        type: typeId,
        status: 'available',
        is_bulk: false
      });

      toast.success('Equipment type created');
      await loadEquipmentTypes();
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        toast.info('Equipment type already exists');
      } else {
        toast.error('Failed to create equipment type');
      }
      throw error;
    }
  }, [loadEquipmentTypes]);

  // Delete equipment type (can only delete if no equipment uses it)
  const deleteEquipmentType = useCallback(async (typeId: string) => {
    try {
      const equipment = await awsApi.equipment.list();
      const equipmentUsingType = equipment.filter((item: any) => item.type === typeId);
      
      if (equipmentUsingType.length > 0) {
        throw new Error(`Cannot delete type: ${equipmentUsingType.length} equipment items are using this type`);
      }
      
      // Since we can't actually delete a type, we just refresh the list
      // The type will disappear when no equipment uses it
      await loadEquipmentTypes();
      toast.success('Equipment type removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete equipment type');
      throw error;
    }
  }, [loadEquipmentTypes]);

  useEffect(() => {
    loadEquipmentTypes();
  }, [loadEquipmentTypes]);

  return {
    equipmentTypes,
    loading,
    error,
    refetch: loadEquipmentTypes,
    createEquipmentType,
    deleteEquipmentType,
  };
};