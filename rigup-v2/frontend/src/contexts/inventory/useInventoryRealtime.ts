
import { useEffect, useRef, useState } from 'react';

export const useInventoryRealtime = (refetch: () => void) => {
  const [optimisticDeletes, setOptimisticDeletes] = useState<Set<string>>(new Set());
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const lastRefetchTimeRef = useRef<number>(0);
  const pendingRefetchRef = useRef<boolean>(false);

  // Enhanced debounced refetch with rate limiting
  const debouncedRefetch = (refetchFn: () => void, delay: number = 2000) => {
    const now = Date.now();
    const timeSinceLastRefetch = now - lastRefetchTimeRef.current;
    
    // If we just refetched recently, skip this request
    if (timeSinceLastRefetch < 1000) {
      console.log('Skipping refetch - too soon since last refetch');
      return;
    }
    
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Mark that we have a pending refetch
    pendingRefetchRef.current = true;
    
    debounceTimeoutRef.current = setTimeout(() => {
      // Only refetch if we still have a pending request
      if (pendingRefetchRef.current) {
        lastRefetchTimeRef.current = Date.now();
        pendingRefetchRef.current = false;
        refetchFn();
      }
    }, delay);
  };
  
  // Listen for equipment update events with better debouncing
  useEffect(() => {
    const handleEquipmentUpdate = (event: CustomEvent) => {
      console.log('Equipment update event received:', event.detail);
      
      // Skip sync events to prevent feedback loops
      if (event.detail?.skipSync) {
        console.log('Skipping sync for mutation-triggered event');
        return;
      }
      
      // Increase debounce delay to 2 seconds to prevent rapid refetches
      debouncedRefetch(refetch, 2000);
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
