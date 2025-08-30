/**
 * Diagram API Hook
 * Handles job diagram operations with new backend
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api.client';
import { toast } from '../use-toast';

export function useApiDiagram(jobId: string | undefined) {
  const queryClient = useQueryClient();
  
  // Get diagram for job
  const { data: diagram, isLoading, error } = useQuery({
    queryKey: ['diagram', jobId],
    queryFn: () => jobId ? apiClient.getDiagram(jobId) : null,
    enabled: !!jobId,
    staleTime: 10000, // 10 seconds
  });
  
  // Save diagram mutation
  const saveDiagram = useMutation({
    mutationFn: (diagramData: any) => {
      if (!jobId) throw new Error('Job ID is required');
      return apiClient.saveDiagram(jobId, diagramData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagram', jobId] });
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