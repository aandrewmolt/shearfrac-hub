/**
 * Contacts API Hook
 * Handles contact operations with new backend
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/api.client';
import { toast } from '../use-toast';

export function useApiContacts() {
  const queryClient = useQueryClient();
  
  // Get all contacts
  const { data: contacts = [], isLoading, error } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => apiClient.getContacts(),
    staleTime: 60000, // 1 minute
  });
  
  // Create contact mutation
  const createContact = useMutation({
    mutationFn: (contact: any) => apiClient.createContact(contact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
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