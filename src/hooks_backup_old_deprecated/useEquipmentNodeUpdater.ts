
import { useCallback } from 'react';
import { Node } from '@xyflow/react';
import { useInventory } from '@/contexts/InventoryContext';

export const useEquipmentNodeUpdater = (onUpdate?: () => void) => {
  const { data } = useInventory();

  const updateShearstreamBoxNode = useCallback((
    nodes: Node[], 
    boxIndex: number, 
    equipmentId: string
  ): Node[] => {
    const equipment = data.individualEquipment.find(eq => eq.equipmentId === equipmentId);
    if (!equipment) {
      console.warn(`Equipment not found for ID: ${equipmentId}`);
      return nodes;
    }

    const boxNodeId = boxIndex === 0 ? 'main-box' : `main-box-${boxIndex + 1}`;
    console.log(`Updating ShearStream box node:`, {
      nodeId: boxNodeId,
      equipmentId: equipment.equipmentId,
      boxIndex
    });
    
    return nodes.map(node => {
      if (node.id === boxNodeId) {
        const updatedNode = { 
          ...node, 
          data: { 
            ...node.data, 
            label: equipment.equipmentId, 
            equipmentId: equipment.equipmentId,
            assigned: true
          }
        };
        console.log(`Node ${boxNodeId} updated with equipment ${equipment.equipmentId}`);
        return updatedNode;
      }
      return node;
    });
  }, [data.individualEquipment]);
  
  // Enhanced version with callback
  const updateShearstreamBoxNodeWithCallback = useCallback((
    nodes: Node[], 
    boxIndex: number, 
    equipmentId: string
  ): Node[] => {
    const result = updateShearstreamBoxNode(nodes, boxIndex, equipmentId);
    if (onUpdate) {
      setTimeout(() => onUpdate(), 50); // Trigger save after update
    }
    return result;
  }, [updateShearstreamBoxNode, onUpdate]);

  const updateStarlinkNode = useCallback((
    nodes: Node[], 
    equipmentId: string
  ): Node[] => {
    const equipment = data.individualEquipment.find(eq => eq.equipmentId === equipmentId);
    if (!equipment) {
      console.warn(`Starlink equipment not found for ID: ${equipmentId}`);
      return nodes;
    }

    console.log(`Updating Starlink node with equipment: ${equipment.equipmentId}`);
    
    return nodes.map(node => {
      if (node.type === 'satellite') {
        const updatedNode = { 
          ...node, 
          data: { 
            ...node.data, 
            label: equipment.equipmentId, 
            equipmentId: equipment.equipmentId,
            assigned: true
          }
        };
        console.log(`Satellite node updated with equipment ${equipment.equipmentId}`);
        return updatedNode;
      }
      return node;
    });
  }, [data.individualEquipment]);
  
  // Enhanced version with callback
  const updateStarlinkNodeWithCallback = useCallback((
    nodes: Node[], 
    equipmentId: string
  ): Node[] => {
    const result = updateStarlinkNode(nodes, equipmentId);
    if (onUpdate) {
      setTimeout(() => onUpdate(), 50); // Trigger save after update
    }
    return result;
  }, [updateStarlinkNode, onUpdate]);

  const updateCustomerComputerNode = useCallback((
    nodes: Node[], 
    computerIndex: number, 
    equipmentId: string
  ): Node[] => {
    const equipment = data.individualEquipment.find(eq => eq.equipmentId === equipmentId);
    if (!equipment) {
      console.warn(`Customer computer equipment not found for ID: ${equipmentId}`);
      return nodes;
    }

    const isTablet = equipment.equipmentId.startsWith('CT');
    const nodeId = `customer-computer-${computerIndex + 1}`;
    console.log(`Updating customer computer node:`, {
      nodeId,
      equipmentId: equipment.equipmentId,
      isTablet,
      computerIndex
    });
    
    return nodes.map(node => {
      if (node.id === nodeId) {
        const updatedNode = { 
          ...node, 
          data: { 
            ...node.data, 
            label: equipment.equipmentId, 
            equipmentId: equipment.equipmentId, 
            isTablet,
            assigned: true
          }
        };
        console.log(`Node ${nodeId} updated with equipment ${equipment.equipmentId}`);
        return updatedNode;
      }
      return node;
    });
  }, [data.individualEquipment]);
  
  // Enhanced version with callback
  const updateCustomerComputerNodeWithCallback = useCallback((
    nodes: Node[], 
    computerIndex: number, 
    equipmentId: string
  ): Node[] => {
    const result = updateCustomerComputerNode(nodes, computerIndex, equipmentId);
    if (onUpdate) {
      setTimeout(() => onUpdate(), 50); // Trigger save after update
    }
    return result;
  }, [updateCustomerComputerNode, onUpdate]);

  const updateAllNodes = useCallback((
    nodes: Node[],
    assignments: {
      shearstreamBoxes: string[];
      starlink?: string;
      customerComputers: string[];
    }
  ): Node[] => {
    return nodes.map(node => {
      // Update ShearStream Box nodes
      if (node.type === 'mainBox') {
        const boxIndex = node.id === 'main-box' ? 0 : parseInt(node.id.replace('main-box-', '')) - 1;
        const equipmentId = assignments.shearstreamBoxes[boxIndex];
        if (equipmentId) {
          const equipment = data.individualEquipment.find(eq => eq.equipmentId === equipmentId);
          if (equipment) {
            return {
              ...node,
              data: {
                ...node.data,
                label: equipment.equipmentId,
                equipmentId: equipment.equipmentId,
                assigned: true
              }
            };
          }
        }
      }

      // Update Starlink node
      if (node.type === 'satellite' && assignments.starlink) {
        const equipment = data.individualEquipment.find(eq => eq.equipmentId === assignments.starlink);
        if (equipment) {
          return {
            ...node,
            data: {
              ...node.data,
              label: equipment.equipmentId,
              equipmentId: equipment.equipmentId,
              assigned: true
            }
          };
        }
      }

      // Update Customer Computer nodes
      if (node.type === 'companyComputer') {
        const computerIndex = parseInt(node.id.replace('customer-computer-', '')) - 1;
        const equipmentId = assignments.customerComputers[computerIndex];
        if (equipmentId) {
          const equipment = data.individualEquipment.find(eq => eq.equipmentId === equipmentId);
          if (equipment) {
            const isTablet = equipment.equipmentId.startsWith('CT');
            return {
              ...node,
              data: {
                ...node.data,
                label: equipment.equipmentId,
                equipmentId: equipment.equipmentId,
                isTablet,
                assigned: true
              }
            };
          }
        }
      }

      return node;
    });
  }, [data.individualEquipment]);
  
  // Enhanced version with callback
  const updateAllNodesWithCallback = useCallback((
    nodes: Node[],
    assignments: {
      shearstreamBoxes: string[];
      starlink?: string;
      customerComputers: string[];
    }
  ): Node[] => {
    const result = updateAllNodes(nodes, assignments);
    if (onUpdate) {
      setTimeout(() => onUpdate(), 50); // Trigger save after update
    }
    return result;
  }, [updateAllNodes, onUpdate]);

  return {
    updateShearstreamBoxNode: onUpdate ? updateShearstreamBoxNodeWithCallback : updateShearstreamBoxNode,
    updateStarlinkNode: onUpdate ? updateStarlinkNodeWithCallback : updateStarlinkNode,
    updateCustomerComputerNode: onUpdate ? updateCustomerComputerNodeWithCallback : updateCustomerComputerNode,
    updateAllNodes: onUpdate ? updateAllNodesWithCallback : updateAllNodes,
  };
};
