/**
 * Jobs API Hook
 * Replaces Turso/Supabase with new backend API
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api.client';
import { toast } from '../use-toast';

export function useApiJobs() {
  const queryClient = useQueryClient();
  
  // Get all jobs
  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => apiClient.getJobs(),
    staleTime: 30000, // 30 seconds
  });
  
  // Create job mutation
  const createJob = useMutation({
    mutationFn: (job: any) => apiClient.createJob(job),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({
        title: 'Success',
        description: 'Job created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create job',
        variant: 'destructive',
      });
    },
  });
  
  // Update job mutation
  const updateJob = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      apiClient.updateJob(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({
        title: 'Success',
        description: 'Job updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update job',
        variant: 'destructive',
      });
    },
  });
  
  // Archive job mutation
  const archiveJob = useMutation({
    mutationFn: (id: string) => apiClient.archiveJob(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({
        title: 'Success',
        description: 'Job archived successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to archive job',
        variant: 'destructive',
      });
    },
  });
  
  return {
    jobs,
    isLoading,
    error,
    createJob: createJob.mutate,
    updateJob: updateJob.mutate,
    archiveJob: archiveJob.mutate,
    isCreating: createJob.isPending,
    isUpdating: updateJob.isPending,
    isArchiving: archiveJob.isPending,
  };
}