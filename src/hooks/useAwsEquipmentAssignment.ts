/**
 * AWS Equipment Assignment Hook
 * Handles equipment assignment to jobs using AWS API
 */

import { useState, useCallback } from 'react';
import awsApi from '@/services/awsApiService';
import { toast } from 'sonner';

export interface EquipmentAssignment {
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  equipmentType: string;
  status: string;
  jobId?: string;
}

export const useAwsEquipmentAssignment = () => {
  const [loading, setLoading] = useState(false);

  // Get all available equipment (not assigned to jobs)
  const getAvailableEquipment = useCallback(async (): Promise<EquipmentAssignment[]> => {
    try {
      const equipment = await awsApi.equipment.list();
      return equipment
        .filter((item: any) => item.status === 'available' && (!item.jobId || item.jobId === 'UNASSIGNED'))
        .map((item: any) => ({
          equipmentId: item.id,
          equipmentCode: item.equipmentId || item.equipment_id,
          equipmentName: item.name || item.equipmentId || item.equipment_id,
          equipmentType: item.type,
          status: item.status,
          jobId: item.jobId === 'UNASSIGNED' ? undefined : item.jobId
        }));
    } catch (error) {
      console.error('Failed to get available equipment:', error);
      throw error;
    }
  }, []);

  // Get equipment assigned to a specific job
  const getJobEquipment = useCallback(async (jobId: string): Promise<EquipmentAssignment[]> => {
    try {
      const equipment = await awsApi.equipment.list();
      return equipment
        .filter((item: any) => item.jobId === jobId)
        .map((item: any) => ({
          equipmentId: item.id,
          equipmentCode: item.equipmentId || item.equipment_id,
          equipmentName: item.name || item.equipmentId || item.equipment_id,
          equipmentType: item.type,
          status: item.status,
          jobId: item.jobId
        }));
    } catch (error) {
      console.error('Failed to get job equipment:', error);
      throw error;
    }
  }, []);

  // Assign equipment to a job
  const assignEquipmentToJob = useCallback(async (equipmentId: string, jobId: string) => {
    try {
      setLoading(true);
      
      // Deploy equipment using the AWS API
      await awsApi.equipment.deploy({
        equipmentId,
        jobId
      });
      
      toast.success('Equipment assigned to job');
    } catch (error: any) {
      console.error('Failed to assign equipment:', error);
      toast.error(error.message || 'Failed to assign equipment to job');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove equipment from a job
  const removeEquipmentFromJob = useCallback(async (equipmentId: string, jobId: string) => {
    try {
      setLoading(true);
      
      // Return equipment using the AWS API
      await awsApi.equipment.return({
        equipmentId,
        jobId
      });
      
      toast.success('Equipment returned from job');
    } catch (error: any) {
      console.error('Failed to return equipment:', error);
      toast.error(error.message || 'Failed to return equipment from job');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update equipment status
  const updateEquipmentStatus = useCallback(async (equipmentId: string, status: string) => {
    try {
      setLoading(true);
      
      await awsApi.equipment.updateStatus(equipmentId, status);
      
      toast.success('Equipment status updated');
    } catch (error: any) {
      console.error('Failed to update equipment status:', error);
      toast.error(error.message || 'Failed to update equipment status');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    getAvailableEquipment,
    getJobEquipment,
    assignEquipmentToJob,
    removeEquipmentFromJob,
    updateEquipmentStatus,
  };
};