/**
 * Sync API Hook
 * Handles synchronization status and triggers
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '../../services/api.client';
import { toast } from '../use-toast';

export function useApiSync() {
  // Get sync status
  const { data: syncStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['sync-status'],
    queryFn: () => apiClient.getSyncStatus(),
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Trigger sync mutation
  const triggerSync = useMutation({
    mutationFn: (type: string) => apiClient.triggerSync(type),
    onSuccess: (_, type) => {
      toast({
        title: 'Sync Started',
        description: `Syncing ${type}...`,
      });
      // Refetch status after a delay
      setTimeout(() => refetchStatus(), 2000);
    },
    onError: (error: any) => {
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to trigger sync',
        variant: 'destructive',
      });
    },
  });
  
  // Full sync mutation
  const fullSync = useMutation({
    mutationFn: () => apiClient.performFullSync(),
    onSuccess: () => {
      toast({
        title: 'Full Sync Started',
        description: 'Syncing all data with ClickUp...',
      });
      setTimeout(() => refetchStatus(), 2000);
    },
    onError: (error: any) => {
      toast({
        title: 'Sync Failed',
        description: error.message || 'Failed to perform full sync',
        variant: 'destructive',
      });
    },
  });
  
  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_WS_URL || 'ws://localhost:3001');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'sync') {
        toast({
          title: 'Sync Complete',
          description: `${data.entity} synchronized`,
        });
        refetchStatus();
      }
    };
    
    ws.onerror = () => {
      console.error('WebSocket connection error');
    };
    
    return () => {
      ws.close();
    };
  }, [refetchStatus]);
  
  return {
    syncStatus,
    triggerSync: triggerSync.mutate,
    fullSync: fullSync.mutate,
    isTriggering: triggerSync.isPending,
    isSyncing: fullSync.isPending,
  };
}