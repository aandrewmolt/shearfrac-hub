
import { useState, useEffect } from 'react';
import { useInventoryData } from './useInventoryData';

interface AuditEntry {
  id: string;
  timestamp: Date;
  action: 'deploy' | 'return' | 'transfer' | 'create' | 'delete' | 'modify';
  entityType: 'equipment' | 'job' | 'location' | 'type';
  entityId: string;
  details: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    quantity?: number;
    fromLocation?: string;
    toLocation?: string;
    locationId?: string;
    jobId?: string;
    reason?: string;
  };
  metadata: {
    source: 'manual' | 'auto-sync' | 'job-creation' | 'job-deletion';
    user?: string;
  };
}

export const useAuditTrail = () => {
  const { data } = useInventoryData();
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  const addAuditEntry = (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    const newEntry: AuditEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    
    setAuditLog(prev => [newEntry, ...prev].slice(0, 1000)); // Keep last 1000 entries
    
    // Persist to localStorage
    try {
      const stored = localStorage.getItem('audit-trail') || '[]';
      const existing = JSON.parse(stored);
      const updated = [newEntry, ...existing].slice(0, 1000);
      localStorage.setItem('audit-trail', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to persist audit entry:', error);
    }
  };

  const getAuditTrailForEntity = (entityType: string, entityId: string) => {
    return auditLog.filter(entry => 
      entry.entityType === entityType && entry.entityId === entityId
    );
  };

  const getRecentActivity = (limit: number = 50) => {
    return auditLog.slice(0, limit);
  };

  const getActivityByAction = (action: AuditEntry['action']) => {
    return auditLog.filter(entry => entry.action === action);
  };

  const getEquipmentMovementHistory = (equipmentTypeId: string) => {
    return auditLog.filter(entry => 
      entry.entityType === 'equipment' && 
      (entry.action === 'deploy' || entry.action === 'return' || entry.action === 'transfer') &&
      entry.entityId === equipmentTypeId
    );
  };

  const generateActivitySummary = (timeframe: 'day' | 'week' | 'month' = 'week') => {
    const now = new Date();
    const cutoff = new Date();
    
    switch (timeframe) {
      case 'day':
        cutoff.setDate(now.getDate() - 1);
        break;
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setDate(now.getDate() - 30);
        break;
    }

    const recentEntries = auditLog.filter(entry => entry && entry.timestamp >= cutoff);
    
    return {
      totalActivities: recentEntries.length,
      deployments: recentEntries.filter(e => e && e.action === 'deploy').length,
      returns: recentEntries.filter(e => e && e.action === 'return').length,
      transfers: recentEntries.filter(e => e && e.action === 'transfer').length,
      creations: recentEntries.filter(e => e && e.action === 'create').length,
      autoActions: recentEntries.filter(e => e && e.metadata && e.metadata.source === 'auto-sync').length,
      manualActions: recentEntries.filter(e => e && e.metadata && e.metadata.source === 'manual').length,
    };
  };

  const formatAuditEntry = (entry: AuditEntry) => {
    const getEntityName = (type: string, id: string) => {
      switch (type) {
        case 'equipment':
          return data.equipmentTypes.find(t => t.id === id)?.name || 'Unknown Equipment';
        case 'location':
          return data.storageLocations.find(l => l.id === id)?.name || 'Unknown Location';
        default:
          return id;
      }
    };

    const formatAction = () => {
      switch (entry.action) {
        case 'deploy':
          return `Deployed ${entry.details.quantity}x ${getEntityName('equipment', entry.entityId)} to job`;
        case 'return':
          return `Returned ${entry.details.quantity}x ${getEntityName('equipment', entry.entityId)} from job`;
        case 'transfer':
          return `Transferred ${entry.details.quantity}x ${getEntityName('equipment', entry.entityId)} from ${getEntityName('location', entry.details.fromLocation || '')} to ${getEntityName('location', entry.details.toLocation || '')}`;
        case 'create':
          return `Created ${getEntityName(entry.entityType, entry.entityId)}`;
        case 'delete':
          return `Deleted ${getEntityName(entry.entityType, entry.entityId)}`;
        case 'modify':
          return `Modified ${getEntityName(entry.entityType, entry.entityId)}`;
        default:
          return `Unknown action on ${getEntityName(entry.entityType, entry.entityId)}`;
      }
    };

    return {
      ...entry,
      formattedAction: formatAction(),
      entityName: getEntityName(entry.entityType, entry.entityId),
    };
  };

  // Load audit trail from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('audit-trail');
      if (stored) {
        const parsed = JSON.parse(stored).map((entry: Omit<AuditEntry, 'timestamp'> & { timestamp: string }) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }));
        setAuditLog(parsed);
      }
    } catch (error) {
      console.error('Failed to load audit trail:', error);
    }
  }, []);

  return {
    auditLog,
    addAuditEntry,
    getAuditTrailForEntity,
    getRecentActivity,
    getActivityByAction,
    getEquipmentMovementHistory,
    generateActivitySummary,
    formatAuditEntry,
  };
};
