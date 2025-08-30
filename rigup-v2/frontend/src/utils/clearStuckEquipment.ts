import { Node } from '@xyflow/react';

/**
 * Clears stuck equipment assignments from nodes
 * This is useful when equipment IDs in saved jobs no longer exist in inventory
 */
export function clearStuckEquipmentFromNodes(nodes: Node[]): Node[] {
  return nodes.map(node => {
    // Check if node has equipment assigned
    if (node.data?.equipmentId && node.data?.assigned) {
      console.log(`Clearing stuck equipment ${node.data.equipmentId} from node ${node.id}`);
      
      // Clear the equipment assignment
      return {
        ...node,
        data: {
          ...node.data,
          equipmentId: null,
          equipmentName: null,
          assigned: false,
          // Keep the label for display purposes
          label: node.data.label || getDefaultLabelForNodeType(node.type)
        }
      };
    }
    return node;
  });
}

/**
 * Gets the default label for a node type
 */
function getDefaultLabelForNodeType(nodeType?: string): string {
  switch (nodeType) {
    case 'mainBox':
      return 'ShearStream Box';
    case 'satellite':
      return 'Starlink';
    case 'customerComputer':
      return 'Customer Computer';
    case 'wellsideGauge':
      return 'Wellside Gauge';
    case 'yAdapter':
      return 'Y-Adapter';
    case 'well':
      return 'Well';
    default:
      return 'Equipment';
  }
}

/**
 * Checks if equipment ID exists in inventory
 */
export function isEquipmentIdValid(
  equipmentId: string, 
  individualEquipment: Array<{ equipmentId: string; id: string }>
): boolean {
  return individualEquipment.some(
    item => item.equipmentId === equipmentId || item.id === equipmentId
  );
}

/**
 * Clears only invalid equipment assignments
 */
export function clearInvalidEquipmentFromNodes(
  nodes: Node[], 
  individualEquipment: Array<{ equipmentId: string; id: string }>
): Node[] {
  return nodes.map(node => {
    // Check if node has equipment assigned
    if (node.data?.equipmentId && node.data?.assigned) {
      // Check if the equipment ID is valid
      if (!isEquipmentIdValid(node.data.equipmentId, individualEquipment)) {
        console.log(`Clearing invalid equipment ${node.data.equipmentId} from node ${node.id}`);
        
        // Clear the invalid equipment assignment
        return {
          ...node,
          data: {
            ...node.data,
            equipmentId: null,
            equipmentName: null,
            assigned: false,
            label: node.data.label || getDefaultLabelForNodeType(node.type)
          }
        };
      }
    }
    return node;
  });
}