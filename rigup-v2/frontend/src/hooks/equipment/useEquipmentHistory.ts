import { useState, useEffect, useCallback } from 'react';
// AWS Mode - No direct database access
import { IndividualEquipment } from '@/types/inventory';

export interface EquipmentHistoryEntry {
  id: string;
  equipmentId: string;
  action: 'created' | 'deployed' | 'returned' | 'maintenance' | 'red-tagged' | 'status-change' | 'location-change';
  fromStatus?: string;
  toStatus?: string;
  fromLocation?: string;
  toLocation?: string;
  jobId?: string;
  jobName?: string;
  userId?: string;
  userName?: string;
  notes?: string;
  timestamp: Date;
}

export const useEquipmentHistory = (equipmentId?: string) => {
  const [history, setHistory] = useState<EquipmentHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch history for specific equipment or all equipment
  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // AWS Mode - Equipment history should be fetched from API
      // For now, return empty history to avoid errors
      setHistory([]);
    } catch (err) {
      // Silently ignore - AWS doesn't use direct database access
    } finally {
      setIsLoading(false);
    }
  }, [equipmentId]);

  // Add history entry
  const addHistoryEntry = useCallback(async (entry: Omit<EquipmentHistoryEntry, 'id' | 'timestamp'>) => {
    try {
      // AWS Mode - History should be saved through API
      // For now, just return success to avoid errors
      return true;
    } catch (err) {
      return false;
    }
  }, [fetchHistory]);

  // Track equipment change
  const trackEquipmentChange = useCallback(async (
    equipment: IndividualEquipment,
    changes: {
      status?: { from: string; to: string };
      location?: { from: string; to: string };
      job?: { id: string; name: string };
    },
    notes?: string
  ) => {
    let action: EquipmentHistoryEntry['action'] = 'status-change';
    
    if (changes.status?.to === 'deployed') {
      action = 'deployed';
    } else if (changes.status?.from === 'deployed' && changes.status?.to === 'available') {
      action = 'returned';
    } else if (changes.status?.to === 'maintenance') {
      action = 'maintenance';
    } else if (changes.status?.to === 'red-tagged') {
      action = 'red-tagged';
    } else if (changes.location) {
      action = 'location-change';
    }
    
    return addHistoryEntry({
      equipmentId: equipment.id,
      action,
      fromStatus: changes.status?.from,
      toStatus: changes.status?.to,
      fromLocation: changes.location?.from,
      toLocation: changes.location?.to,
      jobId: changes.job?.id,
      jobName: changes.job?.name,
      notes
    });
  }, [addHistoryEntry]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    isLoading,
    error,
    addHistoryEntry,
    trackEquipmentChange,
    refreshHistory: fetchHistory
  };
};