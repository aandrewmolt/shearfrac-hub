import { useCallback, useEffect, useState } from 'react';
import { Node, Edge } from '@xyflow/react';
import { useInventory } from '@/contexts/InventoryContext';
import { useUnifiedEvents } from '@/services/unifiedEventSystem';
import { unifiedEquipmentSync } from '@/services/unifiedEquipmentSync';

interface UseUnifiedEquipmentSyncProps {
  jobId: string;
  nodes?: Node[];
  edges?: Edge[];
  setNodes?: (updater: (nodes: Node[]) => Node[]) => void;
  setEdges?: (updater: (edges: Edge[]) => Edge[]) => void;
  onEquipmentChange?: (equipmentId: string, change: any) => void;
  onConflictDetected?: (conflict: any) => void;
  onSyncComplete?: () => void;
}

export const useUnifiedEquipmentSync = ({
  jobId,
  nodes,
  edges,
  setNodes,
  setEdges,
  onEquipmentChange,
  onConflictDetected,
  onSyncComplete
}: UseUnifiedEquipmentSyncProps) => {
  const { data: inventoryData } = useInventory();
  const eventSystem = useUnifiedEvents();
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Initialize the sync manager only once
  useEffect(() => {
    unifiedEquipmentSync.initialize({
      eventSystem,
      inventoryData,
      onEquipmentChange: (equipmentId, change) => {
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 1000);
        if (onEquipmentChange) onEquipmentChange(equipmentId, change);
      },
      onConflictDetected: (conflict) => {
        setConflicts(prev => [...prev.filter(c => c.equipmentId !== conflict.equipmentId), conflict]);
        if (onConflictDetected) onConflictDetected(conflict);
      },
      onSyncComplete: () => {
        if (onSyncComplete) onSyncComplete();
      }
    });
    // Only re-initialize if eventSystem changes (which should be never)
    // Remove inventoryData from deps to prevent re-initialization on data changes
  }, [eventSystem]); // Removed inventoryData, onEquipmentChange, onConflictDetected, onSyncComplete from deps

  // Equipment status change
  const syncEquipmentStatus = useCallback((equipmentId: string, newStatus: string, reason: string) => {
    setSyncStatus('syncing');
    unifiedEquipmentSync.requestSync({
      type: 'status_change',
      equipmentId,
      jobId,
      newStatus,
      reason,
      priority: 'medium'
    });
  }, [jobId]);

  // Equipment allocation
  const allocateEquipment = useCallback((equipmentId: string, reason: string) => {
    setSyncStatus('syncing');
    unifiedEquipmentSync.requestSync({
      type: 'allocation',
      equipmentId,
      jobId,
      reason,
      priority: 'high'
    });
  }, [jobId]);

  // Equipment return
  const returnEquipment = useCallback((equipmentId: string, reason: string) => {
    setSyncStatus('syncing');
    unifiedEquipmentSync.requestSync({
      type: 'return',
      equipmentId,
      jobId,
      reason,
      priority: 'high'
    });
  }, [jobId]);

  // Node synchronization
  const syncNodeEquipment = useCallback((nodeId: string, equipmentId: string, reason: string) => {
    if (setNodes) {
      unifiedEquipmentSync.requestSync({
        type: 'node_sync',
        equipmentId,
        nodeId,
        jobId,
        reason,
        priority: 'medium',
        data: { setNodes }
      });
    }
  }, [jobId, setNodes]);

  // Extras equipment deployment
  const deployExtraEquipment = useCallback((extra: any, reason: string) => {
    setSyncStatus('syncing');
    unifiedEquipmentSync.requestSync({
      type: 'extras_deploy',
      equipmentId: extra.individualEquipmentId || extra.equipmentTypeId,
      jobId,
      reason,
      priority: 'high',
      data: { extra }
    });
  }, [jobId]);

  // Validate equipment availability
  const validateEquipmentAvailability = useCallback((equipmentId: string, reason: string) => {
    unifiedEquipmentSync.requestSync({
      type: 'validation',
      equipmentId,
      jobId,
      reason,
      priority: 'low'
    });
  }, [jobId]);

  // Bulk node sync (replaces useEquipmentRealtimeSync functionality)
  const syncAllNodesEquipment = useCallback((reason: string) => {
    if (!nodes || !setNodes) return;

    let hasChanges = false;
    
    setNodes((currentNodes) => {
      return currentNodes.map(node => {
        if (node.data?.equipmentId) {
          const equipment = inventoryData.individualEquipment.find(
            eq => eq.id === node.data.equipmentId || eq.equipmentId === node.data.equipmentId
          );
          
          if (equipment && node.data.equipmentId !== equipment.equipmentId) {
            hasChanges = true;
            console.log(`Syncing node ${node.id} equipment ID: ${node.data.equipmentId} -> ${equipment.equipmentId}`);
            
            // Request sync through unified system
            unifiedEquipmentSync.requestSync({
              type: 'node_sync',
              equipmentId: equipment.equipmentId,
              nodeId: node.id,
              jobId,
              reason: `${reason} - node equipment ID sync`,
              priority: 'medium'
            });

            return {
              ...node,
              data: {
                ...node.data,
                equipmentId: equipment.equipmentId,
                label: equipment.equipmentId,
                assigned: true
              }
            };
          }
        }
        return node;
      });
    });

    if (hasChanges && onSyncComplete) {
      setTimeout(onSyncComplete, 100);
    }
  }, [nodes, setNodes, inventoryData, jobId, onSyncComplete]);

  // Resolve conflicts
  const resolveConflict = useCallback((equipmentId: string, resolution: 'accept_current' | 'accept_requested' | 'manual') => {
    unifiedEquipmentSync.resolveConflict(equipmentId, resolution);
    setConflicts(prev => prev.filter(c => c.equipmentId !== equipmentId));
  }, []);

  // Get current status
  const getStatus = useCallback(() => {
    return unifiedEquipmentSync.getStatus();
  }, []);

  // Periodic sync for compatibility with existing code
  const triggerPeriodicSync = useCallback(() => {
    syncAllNodesEquipment('periodic sync');
  }, [syncAllNodesEquipment]);

  return {
    // Core sync operations (replaces useUnifiedEquipmentSync)
    syncEquipmentStatus,
    allocateEquipment,
    returnEquipment,
    validateEquipmentAvailability,
    
    // Node operations (replaces useEquipmentRealtimeSync)
    syncNodeEquipment,
    syncAllNodesEquipment,
    triggerPeriodicSync,
    
    // Extras operations (replaces useExtrasEquipmentSync)
    deployExtraEquipment,
    
    // Conflict management (replaces useUniversalSync)
    conflicts,
    resolveConflict,
    
    // Status and monitoring
    syncStatus,
    getStatus,
    
    // Manual sync trigger
    manualSync: triggerPeriodicSync,
    
    // Emergency controls
    clearQueue: () => unifiedEquipmentSync.clearQueue()
  };
};