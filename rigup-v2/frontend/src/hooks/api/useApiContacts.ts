/**
 * Contacts API Hook
 * Handles contact operations with new backend
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api.client';
import { equipmentCache } from '../../services/equipmentCache';
import { toast } from '../use-toast';

export function useApiContacts() {
  const queryClient = useQueryClient();
  
  // Get all contacts - Use cached version to prevent duplicates
  const { data: contacts = [], isLoading, error } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => equipmentCache.get('api-contacts-list', () => apiClient.getContacts()),
    staleTime: 5 * 60 * 1000, // 5 minutes - match cache TTL
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnMount: false, // Don't refetch if data exists
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });
  
  // Create contact mutation
  const createContact = useMutation({
    mutationFn: (contact: any) => apiClient.createContact(contact),
    onSuccess: () => {
      // Invalidate both React Query and singleton cache
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      equipmentCache.invalidate('api-contacts-list');
      equipmentCache.invalidate('turso-contacts-list');
      toast({
        title: 'Success',
        description: 'Contact created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create contact',
        variant: 'destructive',
      });
    },
  });
  
  // Update contact mutation
  const updateContact = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      apiClient.updateContact(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({
        title: 'Success',
        description: 'Contact updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update contact',
        variant: 'destructive',
      });
    },
  });
  
  return {
    contacts,
    isLoading,
    error,
    createContact: createContact.mutate,
    updateContact: updateContact.mutate,
    isCreating: createContact.isPending,
    isUpdating: updateContact.isPending,
  };
}