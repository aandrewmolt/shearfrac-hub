import { Node } from '@xyflow/react';

export interface AssignedEquipment {
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  equipmentId: string | null;
  equipmentName: string | null;
  equipmentTypeId: string | null;
}

/**
 * Extract actual equipment assignments from nodes
 */
export const extractNodeEquipment = (nodes: Node[]): AssignedEquipment[] => {
  if (!nodes || !Array.isArray(nodes)) return [];
  
  const assignments: AssignedEquipment[] = [];
  
  nodes.forEach(node => {
    if (!node) return;
    
    // Extract equipment data from node.data
    const equipmentId = node.data?.equipmentId || null;
    const equipmentName = node.data?.equipmentName || node.data?.name || null;
    
    // Determine equipment type based on node type
    let equipmentTypeId: string | null = null;
    switch (node.type) {
      case 'mainBox':
        equipmentTypeId = 'shearstream-box';
        break;
      case 'yAdapter':
        equipmentTypeId = 'y-adapter';
        break;
      case 'customerComputer':
      case 'companyComputer':
        equipmentTypeId = 'customer-computer';
        break;
      case 'satellite':
        equipmentTypeId = 'starlink';
        break;
      case 'well':
      case 'wellsideGauge':
        equipmentTypeId = node.data?.gaugeType || 'pressure-gauge-1502';
        break;
    }
    
    assignments.push({
      nodeId: node.id,
      nodeType: node.type || 'unknown',
      nodeLabel: node.data?.label || node.data?.customName || '',
      equipmentId,
      equipmentName,
      equipmentTypeId
    });
  });
  
  return assignments;
};

/**
 * Get a summary of equipment by type with actual IDs
 */
export const getEquipmentSummaryFromNodes = (nodes: Node[]) => {
  const assignments = extractNodeEquipment(nodes);
  
  const summary = {
    shearstreamBoxes: [] as string[],
    yAdapters: [] as string[],
    computers: [] as string[],
    satellites: [] as string[],
    gauges: [] as string[],
    unassigned: [] as string[]
  };
  
  assignments.forEach(assignment => {
    if (!assignment.equipmentId) {
      summary.unassigned.push(`${assignment.nodeType} (${assignment.nodeLabel || assignment.nodeId})`);
      return;
    }
    
    switch (assignment.nodeType) {
      case 'mainBox':
        summary.shearstreamBoxes.push(assignment.equipmentId);
        break;
      case 'yAdapter':
        summary.yAdapters.push(assignment.equipmentId);
        break;
      case 'customerComputer':
      case 'companyComputer':
        summary.computers.push(assignment.equipmentId);
        break;
      case 'satellite':
        summary.satellites.push(assignment.equipmentId);
        break;
      case 'well':
      case 'wellsideGauge':
        summary.gauges.push(assignment.equipmentId);
        break;
    }
  });
  
  return summary;
};