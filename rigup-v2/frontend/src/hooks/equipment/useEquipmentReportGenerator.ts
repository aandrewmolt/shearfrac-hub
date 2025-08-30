
import { useInventory } from '@/contexts/InventoryContext';
import { DetailedEquipmentUsage } from './useEquipmentUsageAnalyzer';

interface EquipmentReport {
  summary: {
    totalItems: number;
    totalValue: number;
    categoriesUsed: number;
    efficiency: number;
  };
  breakdown: {
    cables: { [category: string]: number };
    equipment: { [type: string]: number };
  };
  recommendations: string[];
}

export const useEquipmentReportGenerator = () => {
  const { data } = useInventory();

  const generateEquipmentReport = (usage?: DetailedEquipmentUsage): EquipmentReport => {
    if (!usage) {
      return {
        summary: { totalItems: 0, totalValue: 0, categoriesUsed: 0, efficiency: 0 },
        breakdown: { cables: {}, equipment: {} },
        recommendations: ['No equipment usage data available']
      };
    }

    const report: EquipmentReport = {
      summary: {
        totalItems: 0,
        totalValue: 0,
        categoriesUsed: 0,
        efficiency: 0
      },
      breakdown: {
        cables: {},
        equipment: {}
      },
      recommendations: []
    };

    // Calculate cable breakdown
    Object.entries(usage.cables).forEach(([typeId, details]) => {
      const category = details.category;
      if (!report.breakdown.cables[category]) {
        report.breakdown.cables[category] = 0;
      }
      report.breakdown.cables[category] += details.quantity;
      report.summary.totalItems += details.quantity;
    });

    // Calculate equipment breakdown
    if (usage.gauges1502 > 0) {
      report.breakdown.equipment['1502 Pressure Gauge'] = usage.gauges1502;
      report.summary.totalItems += usage.gauges1502;
    }
    if (usage.pencilGauges > 0) {
      report.breakdown.equipment['Pencil Gauge'] = usage.pencilGauges;
      report.summary.totalItems += usage.pencilGauges;
    }
    if (usage.adapters > 0) {
      report.breakdown.equipment['Y Adapters'] = usage.adapters;
      report.summary.totalItems += usage.adapters;
    }
    if (usage.computers > 0) {
      report.breakdown.equipment['Customer Computer'] = usage.computers;
      report.summary.totalItems += usage.computers;
    }
    if (usage.satellite > 0) {
      report.breakdown.equipment['Starlink'] = usage.satellite;
      report.summary.totalItems += usage.satellite;
    }

    // Calculate categories used
    report.summary.categoriesUsed = Object.keys(report.breakdown.cables).length + Object.keys(report.breakdown.equipment).length;

    // Calculate efficiency (ratio of direct vs cable connections)
    report.summary.efficiency = usage.totalConnections > 0 
      ? Math.round((usage.directConnections / usage.totalConnections) * 100)
      : 0;

    // Generate recommendations
    if (usage.directConnections > usage.totalConnections * 0.5) {
      report.recommendations.push('High direct connection ratio - consider cable consolidation for better organization');
    }

    if (Object.keys(usage.cables).length > 3) {
      report.recommendations.push('Multiple cable types used - consider standardizing cable types for easier management');
    }

    if (usage.totalConnections > 10) {
      report.recommendations.push('Complex diagram detected - consider implementing equipment tracking for better visibility');
    }

    if (report.recommendations.length === 0) {
      report.recommendations.push('Equipment usage appears optimized for current diagram configuration');
    }

    return report;
  };

  return {
    generateEquipmentReport
  };
};
