
import { useState, useEffect, useCallback, useMemo } from 'react';
import { TrackedEquipment, EquipmentDeploymentHistory } from '@/types/equipment';
import { useInventoryData } from '@/hooks/useInventoryData';
import { useTrackedEquipmentTypes } from './trackedEquipment/useTrackedEquipmentTypes';
import { useTrackedEquipmentSync } from './trackedEquipment/useTrackedEquipmentSync';
import { useTrackedEquipmentStorage } from './trackedEquipment/useTrackedEquipmentStorage';
import { useTrackedEquipmentOperations } from './trackedEquipment/useTrackedEquipmentOperations';

export const useTrackedEquipment = () => {
  const { data: inventoryData } = useInventoryData();
  const [trackedEquipment, setTrackedEquipment] = useState<TrackedEquipment[]>([]);
  const [deploymentHistory, setDeploymentHistory] = useState<EquipmentDeploymentHistory[]>([]);

  const { createDefaultEquipment } = useTrackedEquipmentTypes();
  const { syncFromInventory, forceSyncFromInventory } = useTrackedEquipmentSync();
  const { loadData, saveData } = useTrackedEquipmentStorage();
  const operations = useTrackedEquipmentOperations(
    trackedEquipment,
    setTrackedEquipment,
    deploymentHistory,
    setDeploymentHistory
  );

  // Memoize getAvailableEquipment to prevent it from changing on every render
  const getAvailableEquipment = useCallback((type: TrackedEquipment['type']) => {
    return trackedEquipment.filter(eq => eq.type === type && eq.status === 'available');
  }, [trackedEquipment]);

  // Force sync function that can be called externally
  const performForceSyncFromInventory = useCallback(() => {
    const syncedEquipment = forceSyncFromInventory();
    setTrackedEquipment(syncedEquipment);
    return syncedEquipment;
  }, [forceSyncFromInventory]);

  // Load data on mount
  useEffect(() => {
    const historyData = loadData();
    setDeploymentHistory(historyData);
  }, [loadData]);

  // Sync from inventory with improved timing - only when individual equipment count changes
  const individualEquipmentLength = inventoryData.individualEquipment.length;
  const lastSyncTime = inventoryData.lastSync.getTime();
  
  useEffect(() => {
    if (individualEquipmentLength > 0) {
      // Use a slight delay to ensure all inventory operations are complete
      const timeoutId = setTimeout(() => {
        const syncedEquipment = syncFromInventory();
        setTrackedEquipment(syncedEquipment);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    } else if (trackedEquipment.length === 0) {
      // Fallback to default equipment if no inventory data
      setTrackedEquipment(createDefaultEquipment());
    }
  }, [individualEquipmentLength, lastSyncTime, syncFromInventory, createDefaultEquipment, trackedEquipment.length]);

  // Save whenever tracked equipment or deployment history changes
  useEffect(() => {
    if (trackedEquipment.length > 0) {
      saveData(trackedEquipment, deploymentHistory);
    }
  }, [trackedEquipment, deploymentHistory, saveData]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    trackedEquipment,
    deploymentHistory,
    getAvailableEquipment,
    forceSyncFromInventory: performForceSyncFromInventory,
    ...operations,
  }), [
    trackedEquipment,
    deploymentHistory,
    getAvailableEquipment,
    performForceSyncFromInventory,
    operations
  ]);
};
