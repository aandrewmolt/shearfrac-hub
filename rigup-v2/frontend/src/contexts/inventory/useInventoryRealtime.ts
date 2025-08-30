
import { useEffect, useRef, useState } from 'react';

export const useInventoryRealtime = (refetch: () => void) => {
  const [optimisticDeletes, setOptimisticDeletes] = useState<Set<string>>(new Set());
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced refetch function
  const debouncedRefetch = (refetchFn: () => void, delay: number = 500) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      refetchFn();
    }, delay);
  };
  
  // Listen for equipment update events
  useEffect(() => {
    const handleEquipmentUpdate = (event: CustomEvent) => {
      console.log('Equipment update event received:', event.detail);
      // Debounce refetch to avoid multiple rapid updates
      debouncedRefetch(refetch, 300);
    };
    
    window.addEventListener('equipment-updated', handleEquipmentUpdate as EventListener);
    
    return () => {
      window.removeEventListener('equipment-updated', handleEquipmentUpdate as EventListener);
    };
  }, [refetch]);

  // Listen for optimistic delete events
  useEffect(() => {
    const handleOptimisticDelete = (event: CustomEvent) => {
      const itemId = event.detail;
      setOptimisticDeletes(prev => new Set(prev).add(itemId));
      
      // Remove from optimistic deletes after successful deletion
      setTimeout(() => {
        setOptimisticDeletes(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
    };

    const handleDeleteFailed = (event: CustomEvent) => {
      const itemId = event.detail;
      setOptimisticDeletes(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    };

    window.addEventListener('equipment-deleted', handleOptimisticDelete);
    window.addEventListener('equipment-delete-failed', handleDeleteFailed);

    return () => {
      window.removeEventListener('equipment-deleted', handleOptimisticDelete);
      window.removeEventListener('equipment-delete-failed', handleDeleteFailed);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    optimisticDeletes,
  };
};
