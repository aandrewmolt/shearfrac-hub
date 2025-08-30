
import { Node } from '@xyflow/react';
import { DetailedEquipmentUsage } from '../types/equipmentUsageTypes';

export const analyzeNodes = (nodes: Node[], usage: DetailedEquipmentUsage): void => {
  // Ensure arrays and objects are defined
  if (!nodes || !Array.isArray(nodes)) return;
  if (!usage) return;
  
  nodes.forEach(node => {
    if (!node || !node.type) return;
    
    switch (node.type) {
      case 'well': {
        // Check the gauge type specified in the well node data
        const gaugeType = node.data?.gaugeType || 'pressure-gauge-1502'; // Default to 1502 if not specified
        if (gaugeType === 'pressure-gauge-pencil') {
          usage.pencilGauges = (usage.pencilGauges || 0) + 1;
        } else {
          usage.gauges1502 = (usage.gauges1502 || 0) + 1;
        }
        usage.gauges = (usage.gauges || 0) + 1; // Keep total count for backward compatibility
        break;
      }
      case 'wellsideGauge':
        // Wellside gauges are always 1502 pressure gauges
        usage.gauges1502 = (usage.gauges1502 || 0) + 1;
        usage.gauges = (usage.gauges || 0) + 1;
        break;
      case 'yAdapter':
        usage.adapters = (usage.adapters || 0) + 1;
        break;
      case 'mainBox':
        // ShearStream boxes
        usage.shearstreamBoxes = (usage.shearstreamBoxes || 0) + 1;
        break;
      case 'companyComputer':
        usage.computers = (usage.computers || 0) + 1;
        break;
      case 'satellite':
        usage.satellite = (usage.satellite || 0) + 1;
        break;
      case 'customerComputer':
        // Customer computers include both CC and CT equipment
        usage.computers = (usage.computers || 0) + 1;
        break;
      default:
        // Ignore unhandled node types silently
    }
  });
};
