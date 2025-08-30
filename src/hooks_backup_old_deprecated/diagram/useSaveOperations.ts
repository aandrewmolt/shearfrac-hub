
import React, { useCallback } from 'react';
import { useJobs } from '@/hooks/useJobs';
import { useEquipmentNameSync } from '@/hooks/useEquipmentNameSync';
import { useExtrasEquipmentSync } from '@/hooks/useExtrasEquipmentSync';
import { Job } from '@/types/types';
import { connectionStatus } from '@/utils/connectionStatus';

interface UseSaveOperationsProps {
  saveDataMemo: Job;
  isInitialized: boolean;
  hasDataChanged: () => boolean;
  markAsSaved: () => void;
  setSaveInProgress: (inProgress: boolean) => void;
  isSaveInProgress: () => boolean;
  isInitialLoadComplete: () => boolean;
  forceSave: () => void;
  currentDataString: string;
}

export const useSaveOperations = ({
  saveDataMemo,
  isInitialized,
  hasDataChanged,
  markAsSaved,
  setSaveInProgress,
  isSaveInProgress,
  isInitialLoadComplete,
  forceSave,
  currentDataString,
}: UseSaveOperationsProps) => {
  const { saveJob } = useJobs();
  const { syncJobEquipmentNames } = useEquipmentNameSync();
  const { syncAllExtras } = useExtrasEquipmentSync(saveDataMemo.id);

  const performSave = useCallback(() => {
    // Log connection status but don't skip saves
    const latency = connectionStatus.getLatency();
    if (latency > 10000) {
      console.warn(`Connection is slow (${latency}ms latency) but attempting save anyway`);
    }
    
    // Prevent multiple saves running simultaneously
    if (isSaveInProgress()) {
      console.log('Skipping save - save already in progress');
      return;
    }

    // Only save if data has actually changed and we're not in the initial load phase
    if (isInitialized && isInitialLoadComplete() && hasDataChanged()) {
      console.log('Performing enhanced save with debugging:', {
        nodesCount: saveDataMemo.nodes.length,
        edgesCount: saveDataMemo.edges.length,
        comPorts: {
          frac: saveDataMemo.fracComPort,
          gauge: saveDataMemo.gaugeComPort,
          fracBaud: saveDataMemo.fracBaudRate,
          gaugeBaud: saveDataMemo.gaugeBaudRate
        },
        edgeTypes: saveDataMemo.edges.map((e) => ({ id: e.id, type: e.type, connectionType: e.data?.connectionType }))
      });
      
      setSaveInProgress(true);
      markAsSaved();
      
      // Immediate save with enhanced debugging and promise handling
      const savePromise = saveJob(saveDataMemo);
      
      // Show feedback that save is in progress
      console.log('💾 Saving job diagram with equipment assignments...');
      
      // Handle save completion
      if (savePromise && typeof savePromise.then === 'function') {
        savePromise.then(() => {
          console.log('✅ Job diagram saved successfully with equipment data');
        }).catch((error) => {
          console.error('❌ Failed to save job diagram:', error);
        });
      }
      
      // Sync equipment names to inventory
      if (saveDataMemo.equipmentAssignment) {
        syncJobEquipmentNames(
          {
            shearstreamBoxIds: saveDataMemo.equipmentAssignment.shearstreamBoxIds || [],
            starlinkId: saveDataMemo.equipmentAssignment.starlinkId,
            customerComputerIds: saveDataMemo.equipmentAssignment.customerComputerIds || []
          },
          {
            mainBoxName: saveDataMemo.mainBoxName,
            satelliteName: saveDataMemo.satelliteName,
            customerComputerNames: saveDataMemo.companyComputerNames
          }
        );
      }
      
      // Sync extras equipment
      if (saveDataMemo.extrasOnLocation && saveDataMemo.extrasOnLocation.length > 0) {
        syncAllExtras(saveDataMemo.extrasOnLocation);
      }
      
      setSaveInProgress(false);
    } else if (!isInitialLoadComplete()) {
      console.log('Skipping save - initial load not complete');
    } else if (!hasDataChanged()) {
      console.log('Skipping save - no data changes detected');
    } else if (!isInitialized) {
      console.log('Skipping save - not initialized yet');
    }
  }, [isInitialized, hasDataChanged, saveJob, saveDataMemo, setSaveInProgress, markAsSaved, isSaveInProgress, isInitialLoadComplete, syncJobEquipmentNames, syncAllExtras]);

  // Enhanced manual save function for user-triggered saves
  const manualSave = useCallback(() => {
    console.log('Manual save triggered with enhanced debugging');
    forceSave(); // Force save by clearing last saved data
    performSave();
  }, [performSave, forceSave]);

  // New immediate save function for critical user actions
  const immediateSave = useCallback(() => {
    console.log('Immediate save triggered for critical user action');
    
    // Prevent multiple saves running simultaneously
    if (isSaveInProgress()) {
      console.log('Skipping immediate save - save already in progress');
      return;
    }
    
    if (isInitialized) {
      forceSave(); // Force save
      setSaveInProgress(true);
      
      try {
        const savePromise = saveJob(saveDataMemo);
        
        // Handle save completion
        if (savePromise && typeof savePromise.then === 'function') {
          savePromise.then(() => {
            console.log('✅ Immediate save completed successfully');
          }).catch((error) => {
            console.error('❌ Failed immediate save:', error);
          });
        }
        
        // Sync equipment names to inventory
        if (saveDataMemo.equipmentAssignment) {
          syncJobEquipmentNames(
            {
              shearstreamBoxIds: saveDataMemo.equipmentAssignment.shearstreamBoxIds || [],
              starlinkId: saveDataMemo.equipmentAssignment.starlinkId,
              customerComputerIds: saveDataMemo.equipmentAssignment.customerComputerIds || []
            },
            {
              mainBoxName: saveDataMemo.mainBoxName,
              satelliteName: saveDataMemo.satelliteName,
              customerComputerNames: saveDataMemo.companyComputerNames
            }
          );
        }
        
        // Sync extras equipment only if not empty
        if (saveDataMemo.extrasOnLocation && saveDataMemo.extrasOnLocation.length > 0) {
          syncAllExtras(saveDataMemo.extrasOnLocation).catch(error => {
            console.error('Failed to sync extras equipment:', error);
          });
        }
        
        markAsSaved();
      } finally {
        setSaveInProgress(false);
      }
    }
  }, [isInitialized, saveJob, saveDataMemo, forceSave, setSaveInProgress, markAsSaved, syncJobEquipmentNames, syncAllExtras, isSaveInProgress]);

  return {
    performSave,
    manualSave,
    immediateSave,
  };
};
