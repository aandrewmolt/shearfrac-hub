
import { Node, Edge } from '@xyflow/react';
import { useEquipmentUsageAnalyzer } from './useEquipmentUsageAnalyzer';
import { useEquipmentAvailabilityChecker } from './useEquipmentAvailabilityChecker';
import { useEquipmentReportGenerator } from './useEquipmentReportGenerator';

export const useComprehensiveEquipmentTracking = (nodes: Node[], edges: Edge[]) => {
  const { analyzeEquipmentUsage } = useEquipmentUsageAnalyzer(nodes, edges);
  const { validateEquipmentAvailability } = useEquipmentAvailabilityChecker();
  const { generateEquipmentReport } = useEquipmentReportGenerator();

  return {
    analyzeEquipmentUsage,
    validateEquipmentAvailability,
    generateEquipmentReport,
  };
};
