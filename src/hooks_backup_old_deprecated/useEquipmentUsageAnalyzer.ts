
import { useMemo } from 'react';
import { Node, Edge } from '@xyflow/react';
import { useInventoryData } from '@/hooks/useInventoryData';
import { DetailedEquipmentUsage } from './types/equipmentUsageTypes';
import { analyzeEdges } from './utils/edgeAnalyzer';
import { analyzeNodes } from './utils/nodeAnalyzer';

export const useEquipmentUsageAnalyzer = (nodes: Node[], edges: Edge[]) => {
  const { data } = useInventoryData();

  const analyzeEquipmentUsage = () => {
    const usage: DetailedEquipmentUsage = {
      cables: {},
      gauges: 0,
      gauges1502: 0,
      pencilGauges: 0,
      adapters: 0,
      computers: 0,
      satellite: 0,
      shearstreamBoxes: 0,
      directConnections: 0,
      totalConnections: 0,
    };

    // Ensure data is loaded before analyzing
    if (!data || !data.equipmentTypes) {
      console.warn('Equipment types not loaded yet, skipping analysis');
      return usage;
    }

    // Analyze edges for cable usage
    analyzeEdges(edges || [], data.equipmentTypes || [], usage);

    // Analyze nodes for equipment usage
    analyzeNodes(nodes || [], usage);

    return usage;
  };

  return {
    analyzeEquipmentUsage,
  };
};

export type { DetailedEquipmentUsage } from './types/equipmentUsageTypes';
