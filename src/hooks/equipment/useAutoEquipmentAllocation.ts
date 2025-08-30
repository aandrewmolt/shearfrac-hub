import { useCallback, useEffect, useState } from 'react';
import { useAwsInventory as useInventory } from '@/hooks/useAwsInventory';
import awsDatabase from '@/services/awsDatabase';
import { toast } from '@/hooks/use-toast';
import { useEquipmentUsageTracking } from '@/hooks/equipment/useEquipmentUsageTracking';
import { Node } from '@xyflow/react';

interface RemovalOptions {
  action: 'return' | 'redtag' | 'cancel';
  reason?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface UseAutoEquipmentAllocationProps {
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  jobId: string;
  jobName: string;
}

export const useAutoEquipmentAllocation = ({
  nodes,
  setNodes,
  jobId,
  jobName
}: UseAutoEquipmentAllocationProps) => {
  const { data: inventoryData, refreshData } = useInventory();
  const { startUsageSession, endUsageSession, createRedTagEvent } = useEquipmentUsageTracking();
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-allocate equipment when it's assigned to a node
  const autoAllocateEquipment = useCallback(async (
    nodeId: string,
    equipmentId: string,
    equipmentName: string
  ) => {
    if (isProcessing) return false;
    
    setIsProcessing(true);
    try {
      // Find the equipment in inventory
      const equipment = inventoryData.equipment?.find(
        e => e.equipmentCode === equipmentId
      );
      
      if (!equipment) {
        toast({
          title: "Error",
          description: "Equipment not found in inventory",
          variant: "destructive"
        });
        return false;
      }

      // Check if already allocated
      if (equipment.status === 'deployed' && equipment.jobId === jobId) {
        return true; // Already allocated to this job
      }

      // Update equipment status to deployed
      await awsDatabase.updateEquipment(equipment.id, {
        status: 'deployed',
        jobId: jobId
      });

      // Start usage tracking
      await startUsageSession(equipment.id, jobId);

      // Update node data to reflect allocation
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                equipmentId: equipmentId,
                equipmentName: equipmentName,
                assigned: true,
                allocatedAt: new Date().toISOString()
              }
            };
          }
          return node;
        })
      );

      // Refresh inventory
      await refreshData();

      toast({
        title: "Equipment Auto-Allocated",
        description: `${equipmentId} is now allocated to ${jobName}`,
      });

      return true;
    } catch (error) {
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [inventoryData, jobId, jobName, startUsageSession, setNodes, refreshData, isProcessing]);

  // Handle equipment removal with options
  const handleEquipmentRemoval = useCallback(async (
    nodeId: string,
    equipmentId: string,
    options: RemovalOptions
  ) => {
    if (isProcessing) return false;
    
    setIsProcessing(true);
    try {
      const equipment = inventoryData.equipment?.find(
        e => e.equipmentCode === equipmentId
      );
      
      if (!equipment) {
        throw new Error('Equipment not found');
      }

      // End usage session
      await endUsageSession(
        equipment.id, 
        new Date(), 
        options.action === 'redtag' ? `Red tagged: ${options.reason}` : 'Returned to storage'
      );

      if (options.action === 'redtag') {
        // Red tag the equipment
        await createRedTagEvent(
          equipment.id,
          options.reason || 'Equipment failure',
          options.severity || 'medium'
        );

        await awsDatabase.updateEquipment(equipment.id, {
          status: 'red-tagged',
          jobId: null,
          notes: `Red tagged: ${options.reason} (${options.severity} severity)`
        });

        toast({
          title: "Equipment Red Tagged",
          description: `${equipmentId} has been red-tagged and removed from job`,
          variant: "destructive"
        });
      } else if (options.action === 'return') {
        // Return to original storage location
        const originalLocation = equipment.location || 'Midland Office';
        
        await awsDatabase.updateEquipment(equipment.id, {
          status: 'available',
          jobId: null,
          location: originalLocation,
          notes: `Returned from ${jobName}`
        });

        toast({
          title: "Equipment Returned",
          description: `${equipmentId} returned to storage`,
        });
      }

      // Clear node data
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                equipmentId: null,
                equipmentName: null,
                assigned: false,
                allocatedAt: null
              }
            };
          }
          return node;
        })
      );

      // Refresh inventory
      await refreshData();

      return true;
    } catch (error) {
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [inventoryData, jobName, endUsageSession, createRedTagEvent, setNodes, refreshData, isProcessing]);

  // Check if equipment needs allocation on node updates
  const checkAndAutoAllocate = useCallback(() => {
    nodes.forEach(async (node) => {
      // Check if node has equipment assigned but not allocated
      if (node.data?.equipmentId && node.data?.assigned && !node.data?.allocatedAt) {
        await autoAllocateEquipment(node.id, node.data.equipmentId, node.data.equipmentName || '');
      }
    });
  }, [nodes, autoAllocateEquipment]);

  // Monitor for equipment assignments
  useEffect(() => {
    const interval = setInterval(() => {
      checkAndAutoAllocate();
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [checkAndAutoAllocate]);

  return {
    autoAllocateEquipment,
    handleEquipmentRemoval,
    isProcessing
  };
};