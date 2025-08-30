
import { useCallback } from 'react';
import { Node } from '@xyflow/react';
import { useEquipmentDeployment } from './useEquipmentDeployment';
import { useEquipmentNodeUpdater } from './useEquipmentNodeUpdater';
import { useInventory } from '@/contexts/InventoryContext';
import { toast } from 'sonner';

interface Job {
  id: string;
  name: string;
  wellCount: number;
  hasWellsideGauge: boolean;
  createdAt: Date;
}

interface UseEquipmentSelectionProps {
  job: Job;
  selectedShearstreamBoxes: string[];
  selectedStarlink: string;
  selectedCustomerComputers: string[];
  setSelectedShearstreamBoxes: (boxes: string[]) => void;
  setSelectedStarlink: (starlink: string) => void;
  setSelectedCustomerComputers: (computers: string[]) => void;
  setNodes: (updater: (nodes: Node[]) => Node[]) => void;
  validateEquipmentAvailability?: (equipmentId: string, jobId: string) => Promise<boolean>;
  allocateEquipment?: (equipmentId: string, allocation: string | Record<string, unknown>) => Promise<void>;
  releaseEquipment?: (equipmentId: string, jobId?: string) => Promise<void>;
  onSave?: () => void;
}

export const useEquipmentSelection = ({
  job,
  selectedShearstreamBoxes,
  selectedStarlink,
  selectedCustomerComputers,
  setSelectedShearstreamBoxes,
  setSelectedStarlink,
  setSelectedCustomerComputers,
  setNodes,
  validateEquipmentAvailability,
  allocateEquipment,
  releaseEquipment,
  onSave,
}: UseEquipmentSelectionProps) => {
  const { data } = useInventory();
  const { deployEquipment, returnEquipment } = useEquipmentDeployment();
  const { 
    updateShearstreamBoxNode, 
    updateStarlinkNode, 
    updateCustomerComputerNode,
    updateAllNodes 
  } = useEquipmentNodeUpdater(onSave); // Pass onSave callback for immediate updates

  const handleEquipmentSelect = useCallback(async (
    type: 'shearstream-box' | 'starlink' | 'customer-computer', 
    equipmentId: string, 
    index?: number
  ) => {
    // Handle deselection (empty or none values)
    if (!equipmentId || equipmentId === '__none__' || equipmentId === 'none' || equipmentId === '') {
      if (type === 'shearstream-box' && index !== undefined) {
        const newBoxes = [...selectedShearstreamBoxes];
        const previousEquipment = newBoxes[index];
        
        if (previousEquipment && releaseEquipment) {
          await releaseEquipment(previousEquipment, job.id);
        }
        
        newBoxes[index] = '';
        setSelectedShearstreamBoxes(newBoxes);
        
        // Clear node assignment
        setNodes(nodes => nodes.map(node => {
          const boxNodeId = index === 0 ? 'main-box' : `main-box-${index + 1}`;
          return node.id === boxNodeId
            ? { ...node, data: { ...node.data, label: 'ShearStream Box', equipmentId: '', assigned: false } }
            : node;
        }));
      } else if (type === 'starlink') {
        if (selectedStarlink && releaseEquipment) {
          await releaseEquipment(selectedStarlink, job.id);
        }
        setSelectedStarlink('');
        
        // Clear node assignment
        setNodes(nodes => nodes.map(node => 
          node.type === 'satellite'
            ? { ...node, data: { ...node.data, label: 'Starlink', equipmentId: '', assigned: false } }
            : node
        ));
      } else if (type === 'customer-computer' && index !== undefined) {
        const newComputers = [...selectedCustomerComputers];
        const previousEquipment = newComputers[index];
        
        if (previousEquipment && releaseEquipment) {
          await releaseEquipment(previousEquipment, job.id);
        }
        
        newComputers[index] = '';
        setSelectedCustomerComputers(newComputers);
        
        // Clear node assignment
        setNodes(nodes => nodes.map(node => 
          node.id === `customer-computer-${index + 1}`
            ? { ...node, data: { ...node.data, label: 'Customer Computer', equipmentId: '', assigned: false, isTablet: false } }
            : node
        ));
      }
      
      // Auto-save after deselection
      if (onSave) {
        setTimeout(() => onSave(), 100);
      }
      return;
    }

    const equipment = data.individualEquipment.find(eq => eq.equipmentId === equipmentId);
    if (!equipment) return;

    // Check if equipment is red-tagged or in maintenance
    if (equipment.status === 'red-tagged' || equipment.status === 'maintenance') {
      toast.error(`Equipment ${equipment.name} is not available (Status: ${equipment.status})`);
      return;
    }

    // Use sync validation if available
    if (validateEquipmentAvailability) {
      const isAvailable = await validateEquipmentAvailability(equipment.equipmentId, job.id);
      if (!isAvailable) {
        // Validation failed, equipment is not available
        return;
      }
    }

    if (type === 'shearstream-box' && index !== undefined) {
      const newBoxes = [...selectedShearstreamBoxes];
      const previousEquipment = newBoxes[index];
      
      // Release previous equipment
      if (previousEquipment) {
        if (releaseEquipment) {
          await releaseEquipment(previousEquipment, job.id);
        } else {
          returnEquipment(previousEquipment);
        }
      }
      
      // Allocate new equipment
      newBoxes[index] = equipmentId;
      setSelectedShearstreamBoxes(newBoxes);
      
      // Update nodes immediately for optimistic UI update
      setNodes(nodes => updateShearstreamBoxNode(nodes, index, equipmentId));
      
      // Show pending status while allocating
      toast.info(`Allocating ${equipment.name} to job...`);
      
      try {
        if (allocateEquipment) {
          await allocateEquipment(equipmentId, job.id);
        } else {
          deployEquipment(equipmentId, job.id);
        }
        
        // Auto-save after equipment selection with visual feedback
        if (onSave) {
          toast.success(`${equipment.name} allocated successfully`);
          setTimeout(() => {
            console.log(`Triggering save after equipment allocation: ${equipmentId}`);
            onSave();
          }, 100);
        }
      } catch (error) {
        console.error('Failed to allocate equipment:', error);
        toast.error(`Failed to allocate ${equipment.name}`);
        // Revert the optimistic update
        newBoxes[index] = previousEquipment || '';
        setSelectedShearstreamBoxes(newBoxes);
        setNodes(nodes => updateShearstreamBoxNode(nodes, index, previousEquipment || ''));
      }
    } else if (type === 'starlink') {
      // Release previous equipment
      if (selectedStarlink) {
        if (releaseEquipment) {
          await releaseEquipment(selectedStarlink, job.id);
        } else {
          returnEquipment(selectedStarlink);
        }
      }
      
      // Allocate new equipment
      setSelectedStarlink(equipmentId);
      
      // Update nodes immediately for optimistic UI update
      setNodes(nodes => updateStarlinkNode(nodes, equipmentId));
      
      // Show pending status while allocating
      toast.info(`Allocating ${equipment.name} to job...`);
      
      try {
        if (allocateEquipment) {
          await allocateEquipment(equipmentId, job.id);
        } else {
          deployEquipment(equipmentId, job.id);
        }
        
        // Auto-save after equipment selection with visual feedback
        if (onSave) {
          toast.success(`${equipment.name} allocated successfully`);
          setTimeout(() => {
            console.log(`Triggering save after Starlink allocation: ${equipmentId}`);
            onSave();
          }, 100);
        }
      } catch (error) {
        console.error('Failed to allocate Starlink:', error);
        toast.error(`Failed to allocate ${equipment.name}`);
        // Revert the optimistic update
        setSelectedStarlink(selectedStarlink || '');
        setNodes(nodes => updateStarlinkNode(nodes, selectedStarlink || ''));
      }
    } else if (type === 'customer-computer' && index !== undefined) {
      const newComputers = [...selectedCustomerComputers];
      const previousEquipment = newComputers[index];
      
      // Release previous equipment
      if (previousEquipment) {
        if (releaseEquipment) {
          await releaseEquipment(previousEquipment, job.id);
        } else {
          returnEquipment(previousEquipment);
        }
      }
      
      // Allocate new equipment
      newComputers[index] = equipmentId;
      setSelectedCustomerComputers(newComputers);
      
      // Update nodes immediately for optimistic UI update
      setNodes(nodes => updateCustomerComputerNode(nodes, index, equipmentId));
      
      // Show pending status while allocating
      toast.info(`Allocating ${equipment.name} to job...`);
      
      try {
        if (allocateEquipment) {
          await allocateEquipment(equipmentId, job.id);
        } else {
          deployEquipment(equipmentId, job.id);
        }
        
        // Auto-save after equipment selection with visual feedback
        if (onSave) {
          toast.success(`${equipment.name} allocated successfully`);
          setTimeout(() => {
            console.log(`Triggering save after computer allocation: ${equipmentId}`);
            onSave();
          }, 100);
        }
      } catch (error) {
        console.error('Failed to allocate customer computer:', error);
        toast.error(`Failed to allocate ${equipment.name}`);
        // Revert the optimistic update
        newComputers[index] = previousEquipment || '';
        setSelectedCustomerComputers(newComputers);
        setNodes(nodes => updateCustomerComputerNode(nodes, index, previousEquipment || ''));
      }
    }
  }, [
    data.individualEquipment,
    selectedShearstreamBoxes, 
    selectedStarlink, 
    selectedCustomerComputers, 
    returnEquipment, 
    deployEquipment, 
    job.id,
    job.name,
    setNodes,
    setSelectedShearstreamBoxes,
    setSelectedStarlink,
    setSelectedCustomerComputers,
    updateShearstreamBoxNode,
    updateStarlinkNode,
    updateCustomerComputerNode,
    validateEquipmentAvailability,
    allocateEquipment,
    releaseEquipment,
    onSave
  ]);

  const handleEquipmentAssignment = useCallback((assignments: {
    shearstreamBoxes: string[];
    starlink?: string;
    customerComputers: string[];
  }) => {
    // Deploy all selected equipment
    [...assignments.shearstreamBoxes, ...(assignments.starlink ? [assignments.starlink] : []), ...assignments.customerComputers]
      .forEach(equipmentId => {
        if (equipmentId) {
          deployEquipment(equipmentId, job.id);
        }
      });

    // Update state
    setSelectedShearstreamBoxes(assignments.shearstreamBoxes);
    if (assignments.starlink) {
      setSelectedStarlink(assignments.starlink);
    }
    setSelectedCustomerComputers(assignments.customerComputers);

    // Update node labels with equipment IDs
    setNodes(nodes => updateAllNodes(nodes, assignments));
  }, [
    job.id, 
    deployEquipment, 
    setSelectedShearstreamBoxes, 
    setSelectedStarlink, 
    setSelectedCustomerComputers, 
    setNodes, 
    updateAllNodes
  ]);

  return {
    handleEquipmentSelect,
    handleEquipmentAssignment,
  };
};
