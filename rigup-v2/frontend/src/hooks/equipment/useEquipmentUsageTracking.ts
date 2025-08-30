import { useCallback } from 'react';
import { useEquipmentUsageTrackingV2 } from './managers/useEquipmentUsageTrackingV2';
import { useInventory } from '@/contexts/InventoryContext';

/**
 * Legacy compatibility wrapper for useEquipmentUsageTracking
 * 
 * This wrapper maintains the original API while using the new V2 managers internally.
 * This allows existing components to work without modification while we migrate to V2.
 * 
 * @deprecated Use useEquipmentUsageTrackingV2 for new code
 */
export const useEquipmentUsageTracking = () => {
  const v2Manager = useEquipmentUsageTrackingV2();
  const { data } = useInventory();
  
  // Legacy API compatibility layer
  
  // Original: createRedTagEvent(equipmentId, reason, severity)
  // New: createRedTagEvent(equipmentId, equipmentName, reason, description, reportedBy, severity)
  const createRedTagEvent = useCallback(async (
    equipmentId: string,
    reason: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) => {
    const equipment = data.individualEquipment.find(eq => 
      eq.equipmentId === equipmentId || eq.id === equipmentId
    );
    
    const equipmentName = equipment?.name || `Equipment ${equipmentId}`;
    const description = `Legacy red-tag event: ${reason}`;
    const reportedBy = 'Legacy System';
    
    return v2Manager.createRedTagEvent(
      equipmentId,
      equipmentName,
      reason,
      description,
      reportedBy,
      severity
    );
  }, [v2Manager, data]);

  // Original: endUsageSession(equipmentId, endDate?, notes?)  
  // New: endUsageSession(sessionId, endNotes)
  const endUsageSession = useCallback(async (
    equipmentId: string,
    endDate?: Date,
    notes?: string
  ) => {
    // Find the active session for this equipment
    const activeSession = v2Manager.getActiveSession(equipmentId);
    
    if (activeSession) {
      // If notes is provided as second parameter (when endDate is omitted)
      const endNotes = typeof endDate === 'string' ? endDate : notes;
      return v2Manager.endUsageSession(activeSession.id, endNotes);
    } else {
      console.warn(`No active session found for equipment ${equipmentId}`);
      // For backward compatibility, don't throw error
      return Promise.resolve();
    }
  }, [v2Manager]);

  // Original: startUsageSession(equipmentId, jobId, sessionType, notes)
  // New: startUsageSession(equipmentId, jobId, jobName, sessionType, notes)
  const startUsageSession = useCallback(async (
    equipmentId: string,
    jobId: string,
    sessionType: 'deployment' | 'maintenance' | 'testing' = 'deployment',
    notes?: string
  ) => {
    // We need job name for V2, try to find it or use default
    const jobName = `Job ${jobId}`; // TODO: Could look up actual job name
    
    return v2Manager.startUsageSession(
      equipmentId,
      jobId,
      jobName,
      sessionType,
      notes
    );
  }, [v2Manager]);

  // Pass through all other methods from V2 manager
  return {
    // Legacy API methods (backward compatible)
    createRedTagEvent,
    endUsageSession,
    startUsageSession,
    
    // All V2 methods are also available
    ...v2Manager
  };
};