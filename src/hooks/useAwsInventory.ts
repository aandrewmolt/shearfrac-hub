/**
 * AWS Inventory Hook
 * Replacement for useInventory context - provides equipment data from AWS
 */

import { useState, useEffect, useCallback } from 'react';
import awsApi from '@/services/awsApiService';
import { toast } from 'sonner';

export interface AwsEquipmentItem {
  id: string;
  equipmentId: string;
  equipment_id: string;
  name: string;
  type: string;
  status: 'available' | 'deployed' | 'maintenance' | 'red-tagged' | 'retired';
  jobId?: string;
  storageLocationId?: string;
  serial_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AwsInventoryData {
  equipment: AwsEquipmentItem[];
  loading: boolean;
  error: string | null;
}

export const useAwsInventory = () => {
  const [data, setData] = useState<AwsInventoryData>({
    equipment: [],
    loading: true,
    error: null
  });

  const loadEquipment = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));
      const equipment = await awsApi.equipment.list();
      setData(prev => ({ ...prev, equipment, loading: false }));
    } catch (error: any) {
      console.error('Failed to load equipment:', error);
      setData(prev => ({ ...prev, error: error.message, loading: false }));
      toast.error('Failed to load equipment inventory');
    }
  }, []);

  // Load equipment on mount
  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  // Create equipment
  const createEquipment = useCallback(async (equipmentData: any) => {
    try {
      const newEquipment = await awsApi.equipment.create(equipmentData);
      await loadEquipment(); // Reload data
      toast.success('Equipment created');
      return newEquipment;
    } catch (error: any) {
      toast.error(error.message || 'Failed to create equipment');
      throw error;
    }
  }, [loadEquipment]);

  // Update equipment
  const updateEquipment = useCallback(async (equipmentId: string, updates: any) => {
    try {
      const updatedEquipment = await awsApi.equipment.update(equipmentId, updates);
      await loadEquipment(); // Reload data
      toast.success('Equipment updated');
      return updatedEquipment;
    } catch (error: any) {
      toast.error(error.message || 'Failed to update equipment');
      throw error;
    }
  }, [loadEquipment]);

  // Update equipment status
  const updateEquipmentStatus = useCallback(async (equipmentId: string, status: string) => {
    try {
      await awsApi.equipment.updateStatus(equipmentId, status);
      await loadEquipment(); // Reload data
      toast.success('Equipment status updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update equipment status');
      throw error;
    }
  }, [loadEquipment]);

  // Deploy equipment to job
  const deployEquipment = useCallback(async (equipmentId: string, jobId: string) => {
    try {
      await awsApi.equipment.deploy({ equipmentId, jobId });
      await loadEquipment(); // Reload data
      toast.success('Equipment deployed to job');
    } catch (error: any) {
      toast.error(error.message || 'Failed to deploy equipment');
      throw error;
    }
  }, [loadEquipment]);

  // Return equipment from job
  const returnEquipment = useCallback(async (equipmentId: string, jobId: string) => {
    try {
      await awsApi.equipment.return({ equipmentId, jobId });
      await loadEquipment(); // Reload data
      toast.success('Equipment returned from job');
    } catch (error: any) {
      toast.error(error.message || 'Failed to return equipment');
      throw error;
    }
  }, [loadEquipment]);

  // Get equipment by status
  const getEquipmentByStatus = useCallback((status: string) => {
    return data.equipment.filter(item => item.status === status);
  }, [data.equipment]);

  // Get equipment by type
  const getEquipmentByType = useCallback((type: string) => {
    return data.equipment.filter(item => item.type === type);
  }, [data.equipment]);

  // Get equipment by job
  const getEquipmentByJob = useCallback((jobId: string) => {
    return data.equipment.filter(item => item.jobId === jobId);
  }, [data.equipment]);

  // Get available equipment
  const getAvailableEquipment = useCallback(() => {
    return data.equipment.filter(item => 
      item.status === 'available' && 
      (!item.jobId || item.jobId === 'UNASSIGNED')
    );
  }, [data.equipment]);

  return {
    // Data
    data: {
      equipment: data.equipment,
      individualEquipment: data.equipment, // Alias for compatibility
      equipmentItems: data.equipment, // Alias for compatibility
      loading: data.loading,
      error: data.error
    },
    
    // Actions
    refreshData: loadEquipment,
    createEquipment,
    updateEquipment,
    updateEquipmentStatus,
    deployEquipment,
    returnEquipment,
    
    // Queries
    getEquipmentByStatus,
    getEquipmentByType,
    getEquipmentByJob,
    getAvailableEquipment,
    
    // Loading state
    loading: data.loading,
    error: data.error
  };
};