
import { useCallback } from 'react';
import { Node } from '@xyflow/react';
import { toast } from 'sonner';

interface UseStarlinkCustomerComputerHandlersProps {
  setNodes: (updater: (nodes: Node[]) => Node[]) => void;
  nodeIdCounter: number;
  setNodeIdCounter: (counter: number) => void;
}

export const useStarlinkCustomerComputerHandlers = ({
  setNodes,
  nodeIdCounter,
  setNodeIdCounter,
}: UseStarlinkCustomerComputerHandlersProps) => {
  
  const handleAddStarlink = useCallback(() => {
    const newStarlinkId = `satellite-${nodeIdCounter}`;
    
    setNodes((nodes) => {
      // Check if satellite already exists
      const existingSatellite = nodes.find(node => node.type === 'satellite');
      if (existingSatellite) {
        toast.warning('Only one Starlink satellite is allowed per job');
        return nodes;
      }

      const newNode: Node = {
        id: newStarlinkId,
        type: 'satellite',
        position: { x: 400, y: 50 },
        data: { 
          label: 'Starlink',
          equipmentId: `SL-${nodeIdCounter}`,
        },
      };

      toast.success('Starlink satellite added to diagram');
      return [...nodes, newNode];
    });

    setNodeIdCounter(nodeIdCounter + 1);
  }, [setNodes, nodeIdCounter, setNodeIdCounter]);

  const handleRemoveStarlink = useCallback((index: number) => {
    setNodes((nodes) => {
      const satellites = nodes.filter(node => node.type === 'satellite');
      if (satellites.length === 0) {
        toast.warning('No Starlink satellites to remove');
        return nodes;
      }

      const satelliteToRemove = satellites[index];
      if (!satelliteToRemove) {
        toast.warning('Starlink satellite not found');
        return nodes;
      }

      toast.success('Starlink satellite removed from diagram');
      return nodes.filter(node => node.id !== satelliteToRemove.id);
    });
  }, [setNodes]);

  const handleAddCustomerComputer = useCallback(() => {
    const newComputerId = `customer-computer-${nodeIdCounter}`;
    
    setNodes((nodes) => {
      const newNode: Node = {
        id: newComputerId,
        type: 'customerComputer',
        position: { x: 100 + (nodeIdCounter * 20), y: 300 + (nodeIdCounter * 20) },
        data: { 
          label: `Customer Computer ${nodeIdCounter}`,
          equipmentId: `CC-${nodeIdCounter}`,
        },
      };

      toast.success('Customer computer added to diagram');
      return [...nodes, newNode];
    });

    setNodeIdCounter(nodeIdCounter + 1);
  }, [setNodes, nodeIdCounter, setNodeIdCounter]);

  const handleRemoveCustomerComputer = useCallback((index: number) => {
    setNodes((nodes) => {
      const customerComputers = nodes.filter(node => node.type === 'customerComputer');
      if (customerComputers.length === 0) {
        toast.warning('No customer computers to remove');
        return nodes;
      }

      const computerToRemove = customerComputers[index];
      if (!computerToRemove) {
        toast.warning('Customer computer not found');
        return nodes;
      }

      toast.success('Customer computer removed from diagram');
      return nodes.filter(node => node.id !== computerToRemove.id);
    });
  }, [setNodes]);

  return {
    handleAddStarlink,
    handleRemoveStarlink,
    handleAddCustomerComputer,
    handleRemoveCustomerComputer,
  };
};
