/**
 * Real-time Inventory Mapper Sync
 * Coordinates equipment status changes between diagram and inventory systems
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useUnifiedEvents } from '@/services/unifiedEventSystem';
import { tursoDb } from '@/services/tursoDb';
import { toast } from 'sonner';

export interface InventoryMapperSyncConfig {
  jobId?: string;
  enableRealtime?: boolean;
}

export const useUnifiedEquipmentSync = (config?: InventoryMapperSyncConfig) => {
  const [isValidating, setIsValidating] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  const equipmentStatusRef = useRef<Record<string, string>>({});
  const eventSystem = useUnifiedEvents();

  // Subscribe to equipment status changes from other parts of the app
  useEffect(() => {
    const unsubscribe = eventSystem.subscribe('equipment_status_change', (event) => {
      const data = event.data;
      equipmentStatusRef.current[data.equipmentId] = data.newStatus;
      setLastSyncTime(new Date());
      
      // Update sync status if change came from elsewhere
      if (event.source !== 'inventory-mapper') {
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 1000);
      }
    });

    return unsubscribe;
  }, [eventSystem]);

  // Subscribe to equipment allocation events
  useEffect(() => {
    const unsubscribe = eventSystem.subscribe('equipment_allocation', (event) => {
      const data = event.data;
      equipmentStatusRef.current[data.equipmentId] = 'deployed';
      setLastSyncTime(new Date());
      
      // Update allocations list
      setAllocations(prev => [...prev, {
        equipmentId: data.equipmentId,
        jobId: data.jobId,
        timestamp: new Date(),
        type: data.allocationType
      }]);
    });

    return unsubscribe;
  }, [eventSystem]);

  const getEquipmentStatus = useCallback((equipmentId: string) => {
    const status = equipmentStatusRef.current[equipmentId] || 'available';
    // Removed console.log to prevent excessive logging
    return status;
  }, []);

  const syncInventoryStatus = async (jobId?: string) => {
    console.log('Syncing inventory status for job:', jobId || 'all');
    setSyncStatus('syncing');
    setSyncError(null);
    
    try {
      // Refresh equipment statuses from database
      const equipment = await tursoDb.getIndividualEquipment();
      const statusMap: Record<string, string> = {};
      
      // Filter by job if specified
      const relevantEquipment = jobId 
        ? equipment.filter(item => item.jobId === jobId || item.status === 'available')
        : equipment;
      
      relevantEquipment.forEach(item => {
        statusMap[item.equipmentId] = item.status;
      });
      
      equipmentStatusRef.current = { ...equipmentStatusRef.current, ...statusMap };
      setSyncStatus('success');
      setLastSyncTime(new Date());
      
    } catch (error) {
      console.error('Failed to sync inventory status:', error);
      setSyncStatus('error');
      setSyncError(error.message);
    }
    
    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  const allocateEquipment = async (equipmentId: string, allocation: string | Record<string, unknown>) => {
    console.log('Allocating equipment:', equipmentId, allocation);
    setSyncStatus('syncing');
    
    try {
      const jobId = typeof allocation === 'string' ? allocation : allocation?.jobId;
      const nodeId = typeof allocation === 'object' ? allocation?.nodeId : undefined;
      
      if (!jobId) {
        throw new Error('Job ID is required for equipment allocation');
      }

      // Check for conflicts first
      setIsValidating(true);
      const allEquipment = await tursoDb.getIndividualEquipment();
      const existingEquipment = allEquipment.filter(item => item.equipmentId === equipmentId);
      const availableItems = existingEquipment.filter(item => item.status === 'available');
      
      if (availableItems.length === 0) {
        const deployedItems = existingEquipment.filter(item => item.status === 'deployed');
        if (deployedItems.length > 0) {
          // Create conflict for user resolution
          const conflict = {
            id: `conflict_${equipmentId}_${Date.now()}`,
            equipmentId,
            currentJobId: deployedItems[0].jobId,
            requestedJobId: jobId,
            type: 'allocation_conflict',
            timestamp: new Date()
          };
          setConflicts(prev => [...prev, conflict]);
          throw new Error(`Equipment ${equipmentId} is already deployed to another job`);
        } else {
          throw new Error(`No available equipment found for ${equipmentId}`);
        }
      }

      // Allocate through event system with retry for high latency
      let retries = 3;
      let allocated = false;
      
      while (retries > 0 && !allocated) {
        try {
          await eventSystem.equipmentAllocated(equipmentId, jobId, 'diagram', nodeId);
          allocated = true;
        } catch (error) {
          retries--;
          if (retries === 0) {
            throw error;
          }
          console.log(`Retrying equipment allocation, ${retries} attempts left...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      equipmentStatusRef.current[equipmentId] = 'deployed';
      setSyncStatus('success');
      setLastSyncTime(new Date());
      
      // Add to allocations tracking
      setAllocations(prev => [...prev, {
        equipmentId,
        jobId,
        nodeId,
        timestamp: new Date(),
        type: 'diagram'
      }]);
      
      toast.success(`Equipment ${equipmentId} allocated to job`);
      
    } catch (error) {
      console.error('Failed to allocate equipment:', error);
      setSyncStatus('error');
      setSyncError(error.message);
      toast.error(`Failed to allocate equipment ${equipmentId}: ${error.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  const releaseEquipment = async (equipmentId: string, jobId?: string) => {
    console.log('Releasing equipment:', equipmentId, jobId);
    setSyncStatus('syncing');
    
    try {
      const currentJobId = jobId || config?.jobId;
      
      if (currentJobId) {
        // Return through event system
        await eventSystem.equipmentReturned(equipmentId, currentJobId);
      } else {
        // Direct status update if no job context
        const allEquipment = await tursoDb.getIndividualEquipment();
        const equipment = allEquipment.filter(item => item.equipmentId === equipmentId);
        for (const item of equipment) {
          if (item.status === 'deployed') {
            await tursoDb.updateIndividualEquipment(item.id, {
              status: 'available',
              jobId: null,
              updatedAt: new Date().toISOString()
            });
          }
        }
      }
      
      equipmentStatusRef.current[equipmentId] = 'available';
      setSyncStatus('success');
      setLastSyncTime(new Date());
      
      // Remove from allocations
      setAllocations(prev => prev.filter(alloc => 
        !(alloc.equipmentId === equipmentId && alloc.jobId === currentJobId)
      ));
      
      toast.success(`Equipment ${equipmentId} returned to inventory`);
      
    } catch (error) {
      console.error('Failed to release equipment:', error);
      setSyncStatus('error');
      setSyncError(error.message);
      toast.error(`Failed to return equipment ${equipmentId}: ${error.message}`);
    }
  };

  const validateEquipmentAvailability = async (equipmentId: string) => {
    console.log('Validating equipment availability:', equipmentId);
    setIsValidating(true);
    
    try {
      const allEquipment = await tursoDb.getIndividualEquipment();
      const equipment = allEquipment.filter(item => item.equipmentId === equipmentId);
      const availableItems = equipment.filter(item => item.status === 'available');
      return availableItems.length > 0;
    } catch (error) {
      console.error('Failed to validate equipment availability:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const getJobEquipment = async (jobId: string) => {
    console.log('Getting job equipment:', jobId);
    
    try {
      const equipment = await tursoDb.getIndividualEquipment();
      return equipment.filter(item => item.jobId === jobId);
    } catch (error) {
      console.error('Failed to get job equipment:', error);
      return [];
    }
  };

  const resolveConflict = async (conflictId: string, resolution: Record<string, unknown>) => {
    console.log('Resolving conflict:', conflictId, resolution);
    
    try {
      const conflict = conflicts.find(c => c.id === conflictId);
      if (!conflict) return;

      if (resolution.action === 'force_allocate') {
        // Force allocation by first returning current allocation
        await releaseEquipment(conflict.equipmentId, conflict.currentJobId);
        await allocateEquipment(conflict.equipmentId, conflict.requestedJobId);
      } else if (resolution.action === 'cancel') {
        // Just remove the conflict
      }

      // Remove conflict from list
      setConflicts(prev => prev.filter(c => c.id !== conflictId));
      
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      toast.error('Failed to resolve equipment conflict');
    }
  };

  // Auto-sync on mount if realtime is enabled
  useEffect(() => {
    if (config?.enableRealtime) {
      syncInventoryStatus(config.jobId);
      
      // Periodic sync every 30 seconds
      const interval = setInterval(() => syncInventoryStatus(config.jobId), 30000);
      return () => clearInterval(interval);
    }
  }, [config?.enableRealtime, config?.jobId]);

  return {
    conflicts,
    getEquipmentStatus,
    syncInventoryStatus,
    allocateEquipment,
    releaseEquipment,
    validateEquipmentAvailability,
    getJobEquipment,
    resolveConflict,
    isValidating,
    allocations,
    syncStatus,
    lastSyncTime,
    syncError
  };
};