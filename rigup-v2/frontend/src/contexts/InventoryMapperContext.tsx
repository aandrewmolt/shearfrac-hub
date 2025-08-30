import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { EquipmentConflict, EquipmentAllocation, SharedEquipmentState } from '@/types/equipment-allocation';
import { useEquipmentAllocationPersistence } from '@/hooks/useEquipmentAllocationPersistence';

interface InventoryMapperContextType {
  // Shared equipment state
  sharedEquipmentState: Map<string, SharedEquipmentState>;
  updateSharedEquipment: (equipmentId: string, state: Partial<SharedEquipmentState>) => void;
  
  // Conflicts management
  conflicts: EquipmentConflict[];
  addConflict: (conflict: EquipmentConflict) => void;
  removeConflict: (equipmentId: string) => void;
  clearConflicts: () => void;
  
  // Allocations tracking
  allocations: Map<string, EquipmentAllocation>;
  setAllocation: (equipmentId: string, allocation: EquipmentAllocation) => void;
  removeAllocation: (equipmentId: string) => void;
  
  // Real-time updates
  subscribeToEquipmentChanges: (equipmentId: string, callback: (state: SharedEquipmentState) => void) => () => void;
  
  // Batch operations
  batchUpdateEquipment: (updates: Array<{ equipmentId: string; state: Partial<SharedEquipmentState> }>) => void;
  
  // Status tracking
  syncStatus: 'idle' | 'syncing' | 'error';
  setSyncStatus: (status: 'idle' | 'syncing' | 'error') => void;
  lastSyncTime?: Date;
  setLastSyncTime: (time: Date) => void;
}

const InventoryMapperContext = createContext<InventoryMapperContextType | undefined>(undefined);

export const useInventoryMapperContext = () => {
  const context = useContext(InventoryMapperContext);
  if (!context) {
    throw new Error('useInventoryMapperContext must be used within InventoryMapperProvider');
  }
  return context;
};

interface InventoryMapperProviderProps {
  children: ReactNode;
}

export const InventoryMapperProvider: React.FC<InventoryMapperProviderProps> = ({ children }) => {
  const { loadAllocations, saveAllocations, clearExpiredAllocations } = useEquipmentAllocationPersistence();
  const [sharedEquipmentState] = useState<Map<string, SharedEquipmentState>>(new Map());
  const [conflicts, setConflicts] = useState<EquipmentConflict[]>([]);
  const [allocations, setAllocationsState] = useState<Map<string, EquipmentAllocation>>(new Map());
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date>();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Equipment change subscribers
  const [subscribers] = useState<Map<string, Set<(state: SharedEquipmentState) => void>>>(new Map());

  // Update shared equipment state
  const updateSharedEquipment = useCallback((equipmentId: string, state: Partial<SharedEquipmentState>) => {
    const currentState = sharedEquipmentState.get(equipmentId) || {
      status: 'available',
      lastUpdated: new Date()
    };
    
    const newState = {
      ...currentState,
      ...state,
      lastUpdated: state.lastUpdated || new Date()
    };
    
    sharedEquipmentState.set(equipmentId, newState);
    
    // Notify subscribers
    const equipmentSubscribers = subscribers.get(equipmentId);
    if (equipmentSubscribers) {
      equipmentSubscribers.forEach(callback => callback(newState));
    }
  }, [sharedEquipmentState, subscribers]);

  // Batch update equipment
  const batchUpdateEquipment = useCallback((
    updates: Array<{ equipmentId: string; state: Partial<SharedEquipmentState> }>
  ) => {
    updates.forEach(({ equipmentId, state }) => {
      updateSharedEquipment(equipmentId, state);
    });
  }, [updateSharedEquipment]);

  // Conflict management
  const addConflict = useCallback((conflict: EquipmentConflict) => {
    setConflicts(prev => {
      // Check if conflict already exists
      const existingIndex = prev.findIndex(c => c.equipmentId === conflict.equipmentId);
      if (existingIndex >= 0) {
        // Update existing conflict
        const updated = [...prev];
        updated[existingIndex] = conflict;
        return updated;
      }
      // Add new conflict
      return [...prev, conflict];
    });
  }, []);

  const removeConflict = useCallback((equipmentId: string) => {
    setConflicts(prev => prev.filter(c => c.equipmentId !== equipmentId));
  }, []);

  const clearConflicts = useCallback(() => {
    setConflicts([]);
  }, []);

  // Load allocations on mount
  useEffect(() => {
    if (!isInitialized) {
      const loaded = loadAllocations();
      const cleaned = clearExpiredAllocations(loaded);
      setAllocationsState(cleaned);
      
      // Update shared state with loaded allocations
      cleaned.forEach((allocation, equipmentId) => {
        updateSharedEquipment(equipmentId, {
          status: allocation.status,
          jobId: allocation.jobId
        });
      });
      
      setIsInitialized(true);
    }
  }, [isInitialized, loadAllocations, clearExpiredAllocations, updateSharedEquipment]);

  // Save allocations whenever they change
  useEffect(() => {
    if (isInitialized) {
      saveAllocations(allocations);
    }
  }, [allocations, saveAllocations, isInitialized]);

  // Allocation management
  const setAllocation = useCallback((equipmentId: string, allocation: EquipmentAllocation) => {
    setAllocationsState(prev => {
      const newAllocations = new Map(prev);
      newAllocations.set(equipmentId, allocation);
      return newAllocations;
    });
    
    // Update shared state
    updateSharedEquipment(equipmentId, {
      status: allocation.status,
      jobId: allocation.jobId
    });
  }, [updateSharedEquipment]);

  const removeAllocation = useCallback((equipmentId: string) => {
    setAllocationsState(prev => {
      const newAllocations = new Map(prev);
      newAllocations.delete(equipmentId);
      return newAllocations;
    });
    
    // Update shared state
    updateSharedEquipment(equipmentId, {
      status: 'available',
      jobId: undefined
    });
  }, [updateSharedEquipment]);

  // Subscribe to equipment changes
  const subscribeToEquipmentChanges = useCallback((
    equipmentId: string, 
    callback: (state: SharedEquipmentState) => void
  ): (() => void) => {
    if (!subscribers.has(equipmentId)) {
      subscribers.set(equipmentId, new Set());
    }
    
    subscribers.get(equipmentId)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const equipmentSubscribers = subscribers.get(equipmentId);
      if (equipmentSubscribers) {
        equipmentSubscribers.delete(callback);
        if (equipmentSubscribers.size === 0) {
          subscribers.delete(equipmentId);
        }
      }
    };
  }, [subscribers]);

  const value: InventoryMapperContextType = {
    sharedEquipmentState,
    updateSharedEquipment,
    conflicts,
    addConflict,
    removeConflict,
    clearConflicts,
    allocations,
    setAllocation,
    removeAllocation,
    subscribeToEquipmentChanges,
    batchUpdateEquipment,
    syncStatus,
    setSyncStatus,
    lastSyncTime,
    setLastSyncTime
  };

  return (
    <InventoryMapperContext.Provider value={value}>
      {children}
    </InventoryMapperContext.Provider>
  );
};