
import { Node, Edge } from '@xyflow/react';

interface EdgeData {
  cableType?: '100ft' | '200ft' | '300ft';
  connectionType?: 'cable' | 'direct';
  label?: string;
}

export interface EquipmentUsage {
  cables: { [key: string]: number };
  gauges: number;
  adapters: number;
  computers: number;
  satellite: number;
  directConnections: number;
}

export const useEquipmentUsageCalculator = (nodes: Node[], edges: Edge[]) => {
  const calculateEquipmentUsage = (): EquipmentUsage => {
    const usage: EquipmentUsage = {
      cables: {},
      gauges: 0,
      adapters: 0,
      computers: 0,
      satellite: 0,
      directConnections: 0,
    };

    // Count cables and direct connections from edges
    edges.forEach(edge => {
      const edgeData = edge.data as EdgeData;
      
      if (edgeData?.connectionType === 'direct') {
        usage.directConnections += 1;
      } else {
        // Handle cable connections
        const cableType = edgeData?.cableType || '200ft';
        usage.cables[cableType] = (usage.cables[cableType] || 0) + 1;
      }
    });

    // Count equipment from nodes
    nodes.forEach(node => {
      switch (node.type) {
        case 'well':
          usage.gauges += 1;
          break;
        case 'wellsideGauge':
          usage.gauges += 1;
          break;
        case 'yAdapter':
          usage.adapters += 1;
          break;
        case 'companyComputer':
          usage.computers += 1;
          break;
        case 'satellite':
          usage.satellite += 1;
          break;
      }
    });

    return usage;
  };

  return {
    calculateEquipmentUsage,
  };
};
