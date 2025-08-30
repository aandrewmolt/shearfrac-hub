/**
 * Diagram API Hook
 * Handles job diagram operations with new backend
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api.client';
import { equipmentCache } from '../../services/equipmentCache';
import { toast } from '../use-toast';

export function useApiDiagram(jobId: string | undefined) {
  const queryClient = useQueryClient();
  
  // Get diagram for job
  const { data: diagram, isLoading, error } = useQuery({
    queryKey: ['diagram', jobId],
    queryFn: () => jobId ? equipmentCache.get(`diagram-${jobId}`, () => apiClient.getDiagram(jobId)) : null,
    enabled: !!jobId,
    staleTime: 10000, // 10 seconds
    refetchOnMount: false, // Don't refetch if data exists
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect
  });
  
  // Save diagram mutation
  const saveDiagram = useMutation({
    mutationFn: (diagramData: any) => {
      if (!jobId) throw new Error('Job ID is required');
      return apiClient.saveDiagram(jobId, diagramData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagram', jobId] });
      // Invalidate cache after save
      if (jobId) equipmentCache.invalidate(`diagram-${jobId}`);
      toast({
        title: 'Success',
        description: 'Diagram saved successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save diagram',
        variant: 'destructive',
      });
    },
  });
  
  return {
    diagram,
    isLoading,
    error,
    saveDiagram: saveDiagram.mutate,
    isSaving: saveDiagram.isPending,
  };
}