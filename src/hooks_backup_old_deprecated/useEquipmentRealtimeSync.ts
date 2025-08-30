import { useEffect, useCallback, useRef } from 'react';
import { Node, Edge } from '@xyflow/react';
import { useInventory } from '@/contexts/InventoryContext';
import { useUnifiedEvents } from '@/services/unifiedEventSystem';
import { toast } from 'sonner';

interface UseEquipmentRealtimeSyncProps {
  nodes: Node[];
  edges: Edge[];
  setNodes: (updater: (nodes: Node[]) => Node[]) => void;
  setEdges: (updater: (edges: Edge[]) => Edge[]) => void;
  jobId: string;
  onSync?: () => void;
}

export const useEquipmentRealtimeSync = ({
  nodes,
  edges,
  setNodes,
  setEdges,
  jobId,
  onSync
}: UseEquipmentRealtimeSyncProps) => {
  const { data: inventoryData, refreshData } = useInventory();
  const eventSystem = useUnifiedEvents();
  const syncInProgress = useRef(false);

  // Sync node equipment with inventory
  const syncNodeEquipment = useCallback(() => {
    let hasChanges = false;
    
    setNodes((currentNodes) => {
      return currentNodes.map(node => {
        // Check if node has equipment assigned
        if (node.data?.equipmentId) {
          const equipment = inventoryData.individualEquipment.find(
            eq => eq.id === node.data.equipmentId || eq.equipmentId === node.data.equipmentId
          );
          
          if (equipment) {
            // Check if equipment ID changed
            if (node.data.equipmentId !== equipment.equipmentId) {
              hasChanges = true;
              console.log(`Syncing node ${node.id} equipment ID: ${node.data.equipmentId} -> ${equipment.equipmentId}`);
              return {
                ...node,
                data: {
                  ...node.data,
                  equipmentId: equipment.equipmentId,
                  label: equipment.equipmentId,
                  equipmentName: equipment.name
                }
              };
            }
            
            // Check if equipment status changed
            if (equipment.status !== 'deployed' || equipment.jobId !== jobId) {
              console.warn(`Equipment ${equipment.equipmentId} status mismatch on node ${node.id}`);
              // Equipment is no longer deployed to this job
              if (equipment.status === 'available') {
                hasChanges = true;
                return {
                  ...node,
                  data: {
                    ...node.data,
                    equipmentId: undefined,
                    label: node.type === 'mainBox' ? 'ShearStream Box' : node.data.label,
                    equipmentName: undefined,
                    assigned: false
                  }
                };
              }
            }
          }
        }
        
        return node;
      });
    });
    
    if (hasChanges && onSync) {
      onSync();
    }
    
    return hasChanges;
  }, [inventoryData.individualEquipment, setNodes, jobId, onSync]);

  // Sync edge equipment (cables) with inventory
  const syncEdgeEquipment = useCallback(() => {
    let hasChanges = false;
    
    setEdges((currentEdges) => {
      return currentEdges.map(edge => {
        // Check if edge has equipment (cable) assigned
        if (edge.data?.equipmentId) {
          const cable = inventoryData.individualEquipment.find(
            eq => eq.id === edge.data.equipmentId || eq.equipmentId === edge.data.equipmentId
          );
          
          if (cable) {
            // Check if cable ID changed
            if (edge.data.equipmentId !== cable.equipmentId) {
              hasChanges = true;
              console.log(`Syncing edge ${edge.id} cable ID: ${edge.data.equipmentId} -> ${cable.equipmentId}`);
              return {
                ...edge,
                data: {
                  ...edge.data,
                  equipmentId: cable.equipmentId,
                  cableLabel: cable.equipmentId
                }
              };
            }
            
            // Check if cable status changed
            if (cable.status !== 'deployed' || cable.jobId !== jobId) {
              console.warn(`Cable ${cable.equipmentId} status mismatch on edge ${edge.id}`);
              // Cable is no longer deployed to this job
              if (cable.status === 'available') {
                hasChanges = true;
                return {
                  ...edge,
                  data: {
                    ...edge.data,
                    equipmentId: undefined,
                    cableLabel: undefined
                  }
                };
              }
            }
          }
        }
        
        return edge;
      });
    });
    
    if (hasChanges && onSync) {
      onSync();
    }
    
    return hasChanges;
  }, [inventoryData.individualEquipment, setEdges, jobId, onSync]);

  // Subscribe to unified event system for real-time updates
  useEffect(() => {
    const unsubscribers = [];

    // Listen for equipment status changes
    unsubscribers.push(
      eventSystem.subscribe('equipment_status_change', (event) => {
        if (syncInProgress.current) return;
        
        const { equipmentId, newStatus, jobId: eventJobId } = event.data;
        console.log('Received equipment status change:', equipmentId, newStatus, eventJobId);
        
        // Check if this equipment affects our diagram
        const nodeWithEquipment = nodes.find(n => n.data?.equipmentId === equipmentId);
        const edgeWithEquipment = edges.find(e => e.data?.equipmentId === equipmentId);
        
        if (nodeWithEquipment || edgeWithEquipment) {
          console.log(`Equipment ${equipmentId} status changed to ${newStatus}, updating diagram`);
          
          if (newStatus === 'available' && eventJobId !== jobId) {
            // Equipment returned from our job, clear from diagram
            setNodes(currentNodes => currentNodes.map(node => 
              node.data?.equipmentId === equipmentId 
                ? { ...node, data: { ...node.data, equipmentId: undefined, assigned: false } }
                : node
            ));
            
            setEdges(currentEdges => currentEdges.map(edge =>
              edge.data?.equipmentId === equipmentId
                ? { ...edge, data: { ...edge.data, equipmentId: undefined, cableLabel: undefined } }
                : edge
            ));
            
            if (onSync) onSync();
            toast.info(`Equipment ${equipmentId} returned to inventory`);
          }
        }
      })
    );

    // Listen for equipment allocation events
    unsubscribers.push(
      eventSystem.subscribe('equipment_allocation', (event) => {
        if (syncInProgress.current) return;
        
        const { equipmentId, jobId: eventJobId, nodeId } = event.data;
        
        if (eventJobId === jobId) {
          console.log(`Equipment ${equipmentId} allocated to our job, updating diagram`);
          
          // Update node if nodeId is specified
          if (nodeId) {
            setNodes(currentNodes => currentNodes.map(node =>
              node.id === nodeId
                ? { ...node, data: { ...node.data, equipmentId, assigned: true } }
                : node
            ));
            
            if (onSync) onSync();
            toast.success(`Equipment ${equipmentId} allocated to diagram`);
          }
        }
      })
    );

    // Listen for equipment return events
    unsubscribers.push(
      eventSystem.subscribe('equipment_return', (event) => {
        if (syncInProgress.current) return;
        
        const { equipmentId, jobId: eventJobId } = event.data;
        
        if (eventJobId === jobId) {
          console.log(`Equipment ${equipmentId} returned from our job`);
          
          // Clear equipment from diagram
          setNodes(currentNodes => currentNodes.map(node => 
            node.data?.equipmentId === equipmentId 
              ? { ...node, data: { ...node.data, equipmentId: undefined, assigned: false } }
              : node
          ));
          
          setEdges(currentEdges => currentEdges.map(edge =>
            edge.data?.equipmentId === equipmentId
              ? { ...edge, data: { ...edge.data, equipmentId: undefined, cableLabel: undefined } }
              : edge
          ));
          
          if (onSync) onSync();
        }
      })
    );

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [nodes, edges, eventSystem, jobId, setNodes, setEdges, onSync]);

  // Set up periodic sync as backup (reduced frequency since we have real-time events)
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (syncInProgress.current) return;
      
      syncInProgress.current = true;
      const nodeChanges = syncNodeEquipment();
      const edgeChanges = syncEdgeEquipment();
      syncInProgress.current = false;
      
      if (nodeChanges || edgeChanges) {
        console.log('Periodic sync detected changes, triggering refresh...');
        refreshData();
      }
    }, 30000); // Sync every 30 seconds (reduced from 5 seconds)
    
    return () => clearInterval(syncInterval);
  }, [syncNodeEquipment, syncEdgeEquipment, refreshData]);

  // Listen for inventory update events
  useEffect(() => {
    const handleInventoryUpdate = (event: CustomEvent) => {
      const { equipmentId, field, value } = event.detail;
      
      // Check if this equipment is used in our diagram
      const nodeWithEquipment = nodes.find(n => n.data?.equipmentId === equipmentId);
      const edgeWithEquipment = edges.find(e => e.data?.equipmentId === equipmentId);
      
      if (nodeWithEquipment || edgeWithEquipment) {
        console.log(`Equipment ${equipmentId} updated, syncing diagram...`);
        syncNodeEquipment();
        syncEdgeEquipment();
        
        if (field === 'equipmentId') {
          toast.info(`Equipment ID changed: ${equipmentId} → ${value}`);
        }
      }
    };
    
    window.addEventListener('equipment-updated', handleInventoryUpdate as EventListener);
    
    return () => {
      window.removeEventListener('equipment-updated', handleInventoryUpdate as EventListener);
    };
  }, [nodes, edges, syncNodeEquipment, syncEdgeEquipment]);

  // Manual sync function with event system integration
  const manualSync = useCallback(async () => {
    console.log('Manual equipment sync triggered');
    
    if (syncInProgress.current) {
      toast.info('Sync already in progress');
      return;
    }
    
    syncInProgress.current = true;
    
    try {
      // Sync with local inventory data first
      const nodeChanges = syncNodeEquipment();
      const edgeChanges = syncEdgeEquipment();
      
      // Only refresh data if there were changes
      if (nodeChanges || edgeChanges) {
        await refreshData();
        toast.success('Equipment synchronized');
      } else {
        toast.info('Equipment already in sync');
      }
      
      // Don't loop through all equipment items - the event system handles this
      // Only correct mismatches when explicitly detected during sync operations
    } catch (error) {
      console.error('Manual sync failed:', error);
      toast.error('Sync failed: ' + error.message);
    } finally {
      syncInProgress.current = false;
    }
  }, [syncNodeEquipment, syncEdgeEquipment, refreshData]);

  return {
    syncNodeEquipment,
    syncEdgeEquipment,
    manualSync
  };
};