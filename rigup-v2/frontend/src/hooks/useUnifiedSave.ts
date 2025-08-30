import { useCallback, useEffect } from 'react';
import { useJobs } from '@/hooks/useJobs';
import { useEquipmentNameSync } from '@/hooks/useEquipmentNameSync';
import { useUnifiedEquipmentSync } from '@/hooks/useUnifiedEquipmentSync';
import { unifiedSaveManager } from '@/services/unifiedSaveManager';
import { Job } from '@/types/types';

interface UseUnifiedSaveProps {
  jobId: string;
  isInitialized?: boolean;
}

export const useUnifiedSave = ({ jobId, isInitialized = true }: UseUnifiedSaveProps) => {
  const { saveJob } = useJobs();
  const { syncJobEquipmentNames } = useEquipmentNameSync();
  const { deployExtraEquipment } = useUnifiedEquipmentSync({ jobId });

  // Initialize the save manager with dependencies
  useEffect(() => {
    unifiedSaveManager.initialize({
      saveJob,
      syncJobEquipmentNames,
      deployExtraEquipment
    });
  }, [saveJob, syncJobEquipmentNames, deployExtraEquipment]);

  // Simplified save function - replaces all the individual save calls
  const save = useCallback((
    jobData: Job, 
    reason: string, 
    priority: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    if (!isInitialized) {
      console.log('⏸️ Save skipped - not initialized');
      return;
    }

    unifiedSaveManager.requestSave(jobData, reason, priority);
  }, [isInitialized]);

  // Convenience methods for different save scenarios
  const saveNow = useCallback((jobData: Job, reason: string) => {
    save(jobData, reason, 'high');
  }, [save]);

  const saveDeferred = useCallback((jobData: Job, reason: string) => {
    save(jobData, reason, 'low');
  }, [save]);

  const saveBatched = useCallback((jobData: Job, reason: string) => {
    save(jobData, reason, 'medium');
  }, [save]);

  // Get save status
  const getStatus = useCallback(() => {
    return unifiedSaveManager.getStatus();
  }, []);

  // Emergency clear (for debugging)
  const clearQueue = useCallback(() => {
    unifiedSaveManager.clearQueue();
  }, []);

  return {
    // Main save function
    save,
    
    // Convenience methods
    saveNow,        // Immediate save (replaces immediateSave)
    saveDeferred,   // Low priority save
    saveBatched,    // Regular debounced save (replaces performSave)
    
    // Status and control
    getStatus,
    clearQueue
  };
};