/**
 * Equipment API Hook
 * Handles equipment operations with new backend
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api.client';
import { equipmentCache } from '../../services/equipmentCache';
import { toast } from '../use-toast';

export function useApiEquipment() {
  const queryClient = useQueryClient();
  
  // Get all equipment - Use cached version to prevent duplicates
  const { data: equipment = [], isLoading, error } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => equipmentCache.get('api-equipment-list', () => apiClient.getEquipment()),
    staleTime: 5 * 60 * 1000, // 5 minutes - match cache TTL
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false, // Don't refetch if data exists
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
  
  // Update equipment status mutation
  const updateEquipmentStatus = useMutation({
    mutationFn: ({ equipmentId, status, jobId }: {
      equipmentId: string;
      status: string;
      jobId?: string;
    }) => apiClient.updateEquipmentStatus(equipmentId, status, jobId),
    onSuccess: () => {
      // Invalidate both React Query and singleton cache
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      equipmentCache.invalidate('api-equipment-list');
      equipmentCache.invalidate('turso-equipment-list');
      toast({
        title: 'Success',
        description: 'Equipment status updated',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update equipment status',
        variant: 'destructive',
      });
    },
  });
  
  // Bulk deploy mutation
  const bulkDeploy = useMutation({
    mutationFn: (deployment: any) => apiClient.bulkDeployEquipment(deployment),
    onSuccess: () => {
      // Invalidate both React Query and singleton cache
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      equipmentCache.invalidate('api-equipment-list');
      equipmentCache.invalidate('turso-equipment-list');
      toast({
        title: 'Success',
        description: 'Equipment deployed successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to deploy equipment',
        variant: 'destructive',
      });
    },
  });
  
  // Bulk return mutation
  const bulkReturn = useMutation({
    mutationFn: (deploymentId: number) => apiClient.bulkReturnEquipment(deploymentId),
    onSuccess: () => {
      // Invalidate both React Query and singleton cache
      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      equipmentCache.invalidate('api-equipment-list');
      equipmentCache.invalidate('turso-equipment-list');
      toast({
        title: 'Success',
        description: 'Equipment returned successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to return equipment',
        variant: 'destructive',
      });
    },
  });
  
  // Get equipment history
  const getEquipmentHistory = async (equipmentId: string) => {
    try {
      return await apiClient.getEquipmentHistory(equipmentId);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to get equipment history',
        variant: 'destructive',
      });
      return [];
    }
  };
  
  return {
    equipment,
    isLoading,
    error,
    updateEquipmentStatus: updateEquipmentStatus.mutate,
    bulkDeploy: bulkDeploy.mutate,
    bulkReturn: bulkReturn.mutate,
    getEquipmentHistory,
    isUpdating: updateEquipmentStatus.isPending,
    isDeploying: bulkDeploy.isPending,
    isReturning: bulkReturn.isPending,
  };
}