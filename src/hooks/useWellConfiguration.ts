
import { useCallback } from 'react';
import { Node } from '@xyflow/react';

export const useWellConfiguration = (setNodes: (updater: (nodes: Node[]) => Node[]) => void) => {
  const updateWellName = useCallback((wellId: string, newName: string) => {
    setNodes(nodes => 
      nodes.map(node => 
        node.id === wellId 
          ? { ...node, data: { ...node.data, label: newName } }
          : node
      )
    );
  }, [setNodes]);

  const updateWellColor = useCallback((wellId: string, newColor: string) => {
    setNodes(nodes => 
      nodes.map(node => 
        node.id === wellId 
          ? { ...node, data: { ...node.data, color: newColor } }
          : node
      )
    );
  }, [setNodes]);

  const updateWellsideGaugeColor = useCallback((newColor: string) => {
    setNodes(nodes => 
      nodes.map(node => 
        node.type === 'wellsideGauge' 
          ? { ...node, data: { ...node.data, color: newColor } }
          : node
      )
    );
  }, [setNodes]);

  const updateWellGaugeType = useCallback(async (wellId: string, gaugeType: string) => {
    // Update the node with the new gauge type
    // This just sets the gauge type preference - actual equipment allocation happens
    // through the NodeEquipmentAllocationDialog when the user assigns specific equipment
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === wellId) {
          // Clear the existing equipment allocation if gauge type is changing
          const currentGaugeType = node.data?.gaugeType;
          if (currentGaugeType && currentGaugeType !== gaugeType) {
            // Clear the equipment assignment when gauge type changes
            // The user will need to select new equipment of the new type
            return { 
              ...node, 
              data: { 
                ...node.data, 
                gaugeType,
                equipmentId: undefined,
                equipmentName: undefined,
                assigned: false
              } 
            };
          }
          // Just update the gauge type
          return { ...node, data: { ...node.data, gaugeType } };
        }
        return node;
      })
    );
  }, [setNodes]);

  return {
    updateWellName,
    updateWellColor,
    updateWellsideGaugeColor,
    updateWellGaugeType,
  };
};
