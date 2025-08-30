import { useState, useEffect, useCallback } from 'react';
import { turso } from '@/utils/consolidated/databaseUtils';
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
      // First check if the table exists
      try {
        await turso.execute({ sql: 'SELECT 1 FROM equipment_history LIMIT 1', args: [] });
      } catch (tableError) {
        if (tableError instanceof Error && tableError.message?.includes('no such table')) {
          // Table doesn't exist, return empty history
          return;
        }
        throw tableError;
      }

      const query = equipmentId 
        ? `SELECT * FROM equipment_history WHERE equipment_id = ? ORDER BY timestamp DESC`
        : `SELECT * FROM equipment_history ORDER BY timestamp DESC LIMIT 100`;
      
      const params = equipmentId ? [equipmentId] : [];
      const result = await turso.execute({ sql: query, args: params });
      
      const entries: EquipmentHistoryEntry[] = result.rows.map(row => ({
        id: row.id as string,
        equipmentId: row.equipment_id as string,
        action: row.action as EquipmentHistoryEntry['action'],
        fromStatus: row.from_status as string | undefined,
        toStatus: row.to_status as string | undefined,
        fromLocation: row.from_location as string | undefined,
        toLocation: row.to_location as string | undefined,
        jobId: row.job_id as string | undefined,
        jobName: row.job_name as string | undefined,
        userId: row.user_id as string | undefined,
        userName: row.user_name as string | undefined,
        notes: row.notes as string | undefined,
        timestamp: new Date(row.timestamp as string)
      }));
      
      setHistory(entries);
    } catch (err) {
      console.error('Error fetching equipment history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [equipmentId]);

  // Add history entry
  const addHistoryEntry = useCallback(async (entry: Omit<EquipmentHistoryEntry, 'id' | 'timestamp'>) => {
    try {
      const id = `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();
      
      await turso.execute({
        sql: `INSERT INTO equipment_history (
          id, equipment_id, action, from_status, to_status, 
          from_location, to_location, job_id, job_name, 
          user_id, user_name, notes, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          entry.equipmentId,
          entry.action,
          entry.fromStatus || null,
          entry.toStatus || null,
          entry.fromLocation || null,
          entry.toLocation || null,
          entry.jobId || null,
          entry.jobName || null,
          entry.userId || null,
          entry.userName || null,
          entry.notes || null,
          timestamp
        ]
      });
      
      // Refresh history
      await fetchHistory();
      
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