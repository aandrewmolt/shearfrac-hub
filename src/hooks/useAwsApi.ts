/**
 * React Hook for AWS API Integration
 * Provides easy access to AWS Lambda functions with loading states and error handling
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import awsApi from '@/services/awsApiService';

// Hook return type
interface UseAwsApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<T | void>;
  reset: () => void;
}

// Generic hook for API calls
export function useAwsApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    showToast?: boolean;
    successMessage?: string;
    errorMessage?: string;
  }
): UseAwsApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const execute = useCallback(async (...args: any[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiFunction(...args);
      setData(result);
      
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      
      if (options?.showToast && options?.successMessage) {
        toast({
          title: 'Success',
          description: options.successMessage,
        });
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      
      if (options?.onError) {
        options.onError(error);
      }
      
      if (options?.showToast) {
        toast({
          title: 'Error',
          description: options?.errorMessage || error.message,
          variant: 'destructive',
        });
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, options, toast]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

// Specific hooks for common operations

// Jobs hooks
export function useAwsJobs() {
  return useAwsApi(awsApi.jobs.list, {
    showToast: true,
    errorMessage: 'Failed to load jobs',
  });
}

export function useAwsJob(id: string) {
  return useAwsApi(() => awsApi.jobs.get(id), {
    showToast: true,
    errorMessage: 'Failed to load job details',
  });
}

export function useCreateAwsJob() {
  return useAwsApi(awsApi.jobs.create, {
    showToast: true,
    successMessage: 'Job created successfully',
    errorMessage: 'Failed to create job',
  });
}

export function useUpdateAwsJob() {
  return useAwsApi(awsApi.jobs.update, {
    showToast: true,
    successMessage: 'Job updated successfully',
    errorMessage: 'Failed to update job',
  });
}

// Equipment hooks
export function useAwsEquipment() {
  return useAwsApi(awsApi.equipment.list, {
    showToast: true,
    errorMessage: 'Failed to load equipment',
  });
}

export function useCreateAwsEquipment() {
  return useAwsApi(awsApi.equipment.create, {
    showToast: true,
    successMessage: 'Equipment created successfully',
    errorMessage: 'Failed to create equipment',
  });
}

export function useDeployEquipment() {
  return useAwsApi(awsApi.equipment.deploy, {
    showToast: true,
    successMessage: 'Equipment deployed successfully',
    errorMessage: 'Failed to deploy equipment',
  });
}

export function useReturnEquipment() {
  return useAwsApi(awsApi.equipment.return, {
    showToast: true,
    successMessage: 'Equipment returned successfully',
    errorMessage: 'Failed to return equipment',
  });
}

// Contacts hooks
export function useAwsContacts() {
  return useAwsApi(awsApi.contacts.list, {
    showToast: true,
    errorMessage: 'Failed to load contacts',
  });
}

export function useCreateAwsContact() {
  return useAwsApi(awsApi.contacts.create, {
    showToast: true,
    successMessage: 'Contact created successfully',
    errorMessage: 'Failed to create contact',
  });
}

export function useUpdateAwsContact() {
  return useAwsApi(awsApi.contacts.update, {
    showToast: true,
    successMessage: 'Contact updated successfully',
    errorMessage: 'Failed to update contact',
  });
}

// Export the main hook and all specific hooks
export default useAwsApi;