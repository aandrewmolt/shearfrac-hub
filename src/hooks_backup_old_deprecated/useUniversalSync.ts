/**
 * Universal Sync Hook
 * Provides comprehensive synchronization across all systems (equipment, jobs, contacts)
 */

import { useState, useEffect, useCallback } from 'react';
import { useUnifiedEvents } from '@/services/unifiedEventSystem';
import { tursoDb } from '@/services/tursoDb';
import { toast } from 'sonner';

interface UniversalSyncConfig {
  jobId: string;
  onEquipmentChange?: (data: Record<string, unknown>) => void;
  onConflict?: (conflict: Record<string, unknown>) => void;
  onContactChange?: (data: Record<string, unknown>) => void;
  enableAutoSync?: boolean;
}

export const useUniversalSync = (config: UniversalSyncConfig) => {
  const [conflicts, setConflicts] = useState([]);
  const [hasConflicts, setHasConflicts] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  const eventSystem = useUnifiedEvents();

  // Listen for all relevant events and forward to config callbacks
  useEffect(() => {
    const unsubscribers = [];

    // Equipment change events
    if (config.onEquipmentChange) {
      unsubscribers.push(
        eventSystem.subscribe('equipment_status_change', (event) => {
          if (event.data.jobId === config.jobId || !event.data.jobId) {
            config.onEquipmentChange(event.data);
          }
        }),
        eventSystem.subscribe('equipment_allocation', (event) => {
          if (event.data.jobId === config.jobId) {
            config.onEquipmentChange({
              equipmentId: event.data.equipmentId,
              action: 'allocated',
              jobId: event.data.jobId
            });
          }
        }),
        eventSystem.subscribe('equipment_return', (event) => {
          if (event.data.jobId === config.jobId) {
            config.onEquipmentChange({
              equipmentId: event.data.equipmentId,
              action: 'returned',
              jobId: event.data.jobId
            });
          }
        })
      );
    }

    // Contact change events
    if (config.onContactChange) {
      unsubscribers.push(
        eventSystem.subscribe('contact_assignment', (event) => {
          if (event.data.jobId === config.jobId) {
            config.onContactChange(event.data);
          }
        })
      );
    }

    // Conflict detection
    const conflictUnsubscribe = eventSystem.subscribe('all', (event) => {
      // Detect potential conflicts
      if (event.type === 'equipment_allocation' && event.data.jobId === config.jobId) {
        detectAndHandleConflicts(event.data.equipmentId);
      }
    });
    unsubscribers.push(conflictUnsubscribe);

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [config, eventSystem]);

  const detectAndHandleConflicts = useCallback(async (equipmentId: string) => {
    try {
      const allEquipment = await tursoDb.getIndividualEquipment();
      const equipment = allEquipment.filter(item => item.equipmentId === equipmentId);
      const deployedItems = equipment.filter(item => item.status === 'deployed');
      
      // Check if equipment is allocated to multiple jobs
      const jobIds = new Set(deployedItems.map(item => item.jobId).filter(Boolean));
      
      if (jobIds.size > 1) {
        const conflict = {
          id: `multi_job_${equipmentId}_${Date.now()}`,
          equipmentId,
          type: 'multiple_job_allocation',
          jobIds: Array.from(jobIds),
          timestamp: new Date(),
          severity: 'high'
        };
        
        setConflicts(prev => {
          const updated = [...prev, conflict];
          setHasConflicts(updated.length > 0);
          return updated;
        });
        
        if (config.onConflict) {
          config.onConflict(conflict);
        }
        
        toast.warning(`Equipment ${equipmentId} is allocated to multiple jobs`);
      }
    } catch (error) {
      console.error('Error detecting conflicts:', error);
    }
  }, [config]);

  const syncEquipment = async (equipmentId?: string, data?: Record<string, unknown>) => {
    console.log('Universal equipment sync:', equipmentId, data);
    setSyncStatus('syncing');
    
    try {
      if (equipmentId && data) {
        // Handle specific equipment sync
        if (data.action === 'allocate') {
          await eventSystem.equipmentAllocated(equipmentId, config.jobId, 'manual');
        } else if (data.action === 'return') {
          await eventSystem.equipmentReturned(equipmentId, config.jobId);
        } else if (data.status) {
          await eventSystem.equipmentStatusChanged(
            equipmentId, 
            data.oldStatus || 'available', 
            data.status, 
            config.jobId
          );
        }
      } else {
        // Sync all job equipment
        const jobEquipment = await tursoDb.getIndividualEquipment();
        const relevantEquipment = jobEquipment.filter(item => 
          item.jobId === config.jobId || item.status === 'available'
        );
        
        // Detect any inconsistencies
        for (const item of relevantEquipment) {
          if (item.jobId === config.jobId && item.status !== 'deployed') {
            // Fix inconsistent status
            await tursoDb.updateIndividualEquipment(item.id, {
              status: 'deployed',
              updatedAt: new Date().toISOString()
            });
          }
        }
      }
      
      setSyncStatus('success');
      setLastSyncTime(new Date());
      
    } catch (error) {
      console.error('Universal sync failed:', error);
      setSyncStatus('error');
      toast.error(`Sync failed: ${error.message}`);
    }
    
    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  const resolveConflict = async (conflictId: string, resolution: Record<string, unknown>) => {
    console.log('Resolving universal conflict:', conflictId, resolution);
    
    try {
      const conflict = conflicts.find(c => c.id === conflictId);
      if (!conflict) {
        throw new Error('Conflict not found');
      }

      if (conflict.type === 'multiple_job_allocation') {
        if (resolution.action === 'keep_current_job') {
          // Keep equipment on current job, remove from others
          const keepJobId = resolution.jobId || config.jobId;
          const allEquipment = await tursoDb.getIndividualEquipment();
          const equipment = allEquipment.filter(item => item.equipmentId === conflict.equipmentId);
          
          for (const item of equipment) {
            if (item.jobId && item.jobId !== keepJobId) {
              await tursoDb.updateIndividualEquipment(item.id, {
                status: 'available',
                jobId: null,
                updatedAt: new Date().toISOString()
              });
            }
          }
          
          toast.success(`Equipment ${conflict.equipmentId} kept on current job`);
          
        } else if (resolution.action === 'return_to_inventory') {
          // Return all instances to available status
          await eventSystem.equipmentReturned(conflict.equipmentId, config.jobId);
          toast.success(`Equipment ${conflict.equipmentId} returned to inventory`);
        }
      }
      
      // Remove resolved conflict
      setConflicts(prev => {
        const updated = prev.filter(c => c.id !== conflictId);
        setHasConflicts(updated.length > 0);
        return updated;
      });
      
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      toast.error('Failed to resolve conflict');
    }
  };

  const triggerBatchSync = async () => {
    console.log('Universal batch sync trigger for job:', config.jobId);
    setSyncStatus('syncing');
    
    try {
      // Start a transaction for batch operations
      const transactionId = eventSystem.startTransaction();
      
      // Get all job data
      const [equipment, jobs, contacts] = await Promise.all([
        tursoDb.getIndividualEquipment(),
        tursoDb.getJobs(),
        tursoDb.getContacts ? tursoDb.getContacts() : []
      ]);
      
      // Find job-specific data
      const jobEquipment = equipment.filter(item => item.jobId === config.jobId);
      const currentJob = jobs.find(job => job.id === config.jobId);
      
      if (!currentJob) {
        throw new Error('Job not found');
      }
      
      // Validate and fix any inconsistencies
      let syncCount = 0;
      
      for (const item of jobEquipment) {
        if (item.status !== 'deployed') {
          eventSystem.addToTransaction(
            transactionId,
            'equipment_status_change',
            'batch_sync',
            {
              equipmentId: item.equipmentId,
              oldStatus: item.status,
              newStatus: 'deployed',
              jobId: config.jobId
            }
          );
          syncCount++;
        }
      }
      
      // Check for orphaned equipment (deployed but job doesn't exist)
      const orphanedEquipment = equipment.filter(item => 
        item.jobId && !jobs.some(job => job.id === item.jobId)
      );
      
      for (const item of orphanedEquipment) {
        eventSystem.addToTransaction(
          transactionId,
          'equipment_status_change',
          'batch_sync',
          {
            equipmentId: item.equipmentId,
            oldStatus: item.status,
            newStatus: 'available',
            jobId: null
          }
        );
        syncCount++;
      }
      
      setSyncStatus('success');
      setLastSyncTime(new Date());
      
      if (syncCount > 0) {
        toast.success(`Batch sync completed: ${syncCount} items synchronized`);
      } else {
        toast.success('Batch sync completed: All data is in sync');
      }
      
    } catch (error) {
      console.error('Batch sync failed:', error);
      setSyncStatus('error');
      toast.error('Batch sync failed');
    }
    
    setTimeout(() => setSyncStatus('idle'), 2000);
  };

  // Auto-sync if enabled
  useEffect(() => {
    if (config.enableAutoSync) {
      const interval = setInterval(() => {
        syncEquipment();
      }, 60000); // Every minute
      
      return () => clearInterval(interval);
    }
  }, [config.enableAutoSync]);

  return {
    syncEquipment,
    resolveConflict,
    triggerBatchSync,
    conflicts,
    hasConflicts,
    syncStatus,
    lastSyncTime
  };
};