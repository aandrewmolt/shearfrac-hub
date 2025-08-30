
import { useCallback } from 'react';
import { Node } from '@xyflow/react';
import { useInventory } from '@/contexts/InventoryContext';

export const useWellConfiguration = (setNodes: (updater: (nodes: Node[]) => Node[]) => void) => {
  const { data: inventoryData, updateSingleEquipmentItem } = useInventory();
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
    // Get current gauge type for this well
    let currentGaugeType: string | undefined;
    setNodes(nodes => {
      const wellNode = nodes.find(node => node.id === wellId);
      currentGaugeType = wellNode?.data?.gaugeType;
      return nodes;
    });
    
    // Only update inventory if gauge type is actually changing
    if (currentGaugeType && currentGaugeType !== gaugeType) {
      try {
        // Find equipment items for old and new gauge types
        const oldGaugeItem = inventoryData.equipmentItems.find(item => item.typeId === currentGaugeType);
        const newGaugeItem = inventoryData.equipmentItems.find(item => item.typeId === gaugeType);
        
        if (oldGaugeItem && newGaugeItem) {
          // Return one unit of the old gauge type
          await updateSingleEquipmentItem(oldGaugeItem.id, {
            quantity: (oldGaugeItem.quantity || 0) + 1
          });
          
          // Take one unit of the new gauge type (only if available)
          if ((newGaugeItem.quantity || 0) > 0) {
            await updateSingleEquipmentItem(newGaugeItem.id, {
              quantity: (newGaugeItem.quantity || 0) - 1
            });
          } else {
            // If no gauges available, don't allow the change
            console.warn(`No ${gaugeType} gauges available in inventory`);
            return;
          }
        }
      } catch (error) {
        console.error('Failed to update gauge inventory:', error);
        return; // Don't update the node if inventory update fails
      }
    }
    
    // Update the node with new gauge type
    setNodes(nodes => 
      nodes.map(node => 
        node.id === wellId 
          ? { ...node, data: { ...node.data, gaugeType } }
          : node
      )
    );
  }, [setNodes, inventoryData, updateSingleEquipmentItem]);

  return {
    updateWellName,
    updateWellColor,
    updateWellsideGaugeColor,
    updateWellGaugeType,
  };
};
