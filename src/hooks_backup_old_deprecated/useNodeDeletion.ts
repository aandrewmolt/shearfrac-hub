import { useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import { toast } from 'sonner';

interface UseNodeDeletionProps {
  nodes: Node[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  selectedShearstreamBoxes: string[];
  selectedStarlink: string;
  selectedCustomerComputers: string[];
  setSelectedShearstreamBoxes: (boxes: string[]) => void;
  setSelectedStarlink: (starlink: string) => void;
  setSelectedCustomerComputers: (computers: string[]) => void;
  releaseEquipment?: (equipmentId: string, jobId: string) => Promise<void>;
  jobId: string;
  immediateSave?: () => void;
}

export const useNodeDeletion = ({
  nodes,
  edges,
  setNodes,
  setEdges,
  selectedShearstreamBoxes,
  selectedStarlink,
  selectedCustomerComputers,
  setSelectedShearstreamBoxes,
  setSelectedStarlink,
  setSelectedCustomerComputers,
  releaseEquipment,
  jobId,
  immediateSave,
}: UseNodeDeletionProps) => {
  const onNodesDelete = useCallback(async (deletedNodes: Node[]) => {
    // Process each deleted node
    for (const node of deletedNodes) {
      // Prevent deletion of well nodes (they are essential)
      if (node.type === 'well') {
        toast.error('Cannot delete well nodes');
        return;
      }

      // Handle equipment deallocation based on node type
      if (node.type === 'mainBox') {
        // Find which index this mainBox is
        const mainBoxIndex = nodes
          .filter(n => n.type === 'mainBox')
          .findIndex(n => n.id === node.id);
        
        if (mainBoxIndex !== -1 && selectedShearstreamBoxes[mainBoxIndex]) {
          const equipmentId = selectedShearstreamBoxes[mainBoxIndex];
          if (releaseEquipment) {
            await releaseEquipment(equipmentId, jobId);
          }
          
          // Update selected equipment array
          const newBoxes = [...selectedShearstreamBoxes];
          newBoxes.splice(mainBoxIndex, 1);
          setSelectedShearstreamBoxes(newBoxes);
        }
      } else if (node.type === 'satellite' && selectedStarlink) {
        if (releaseEquipment) {
          await releaseEquipment(selectedStarlink, jobId);
        }
        setSelectedStarlink('');
      } else if (node.type === 'customerComputer') {
        // Find which index this computer is
        const computerIndex = nodes
          .filter(n => n.type === 'customerComputer')
          .findIndex(n => n.id === node.id);
        
        if (computerIndex !== -1 && selectedCustomerComputers[computerIndex]) {
          const equipmentId = selectedCustomerComputers[computerIndex];
          if (releaseEquipment) {
            await releaseEquipment(equipmentId, jobId);
          }
          
          // Update selected equipment array
          const newComputers = [...selectedCustomerComputers];
          newComputers.splice(computerIndex, 1);
          setSelectedCustomerComputers(newComputers);
        }
      }
    }

    // Get IDs of nodes to delete
    const nodeIdsToDelete = deletedNodes.map(node => node.id);

    // Remove connected edges
    const updatedEdges = edges.filter(edge => 
      !nodeIdsToDelete.includes(edge.source) && !nodeIdsToDelete.includes(edge.target)
    );
    
    // Remove nodes
    const updatedNodes = nodes.filter(node => !nodeIdsToDelete.includes(node.id));

    // Update state
    setNodes(updatedNodes);
    setEdges(updatedEdges);

    // Show feedback
    const nodeTypes = deletedNodes.map(n => n.type).join(', ');
    toast.success(`Deleted ${deletedNodes.length} node(s): ${nodeTypes}`);

    // Save changes
    if (immediateSave) {
      setTimeout(() => immediateSave(), 100);
    }
  }, [
    nodes,
    edges,
    setNodes,
    setEdges,
    selectedShearstreamBoxes,
    selectedStarlink,
    selectedCustomerComputers,
    setSelectedShearstreamBoxes,
    setSelectedStarlink,
    setSelectedCustomerComputers,
    releaseEquipment,
    jobId,
    immediateSave,
  ]);

  // Handle single node deletion (can be called from node components)
  const deleteNode = useCallback((nodeId: string) => {
    const nodeToDelete = nodes.find(n => n.id === nodeId);
    if (nodeToDelete) {
      onNodesDelete([nodeToDelete]);
    }
  }, [nodes, onNodesDelete]);

  return {
    onNodesDelete,
    deleteNode,
  };
};