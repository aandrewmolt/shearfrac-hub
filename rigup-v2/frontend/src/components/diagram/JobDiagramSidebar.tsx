
import React from 'react';
import { Node } from '@xyflow/react';
import WellConfigurationPanel from './WellConfigurationPanel';
import { UnifiedEquipmentSelectionPanel } from '@/components/shared';
import ExtrasOnLocationPanel from './ExtrasOnLocationPanel';
import EquipmentSummaryPanel from './EquipmentSummaryPanel';
import { UnifiedRedTagPanel } from '@/components/shared';
import ConflictIndicator from './ConflictIndicator';
import CableConfigurationPanel from './CableConfigurationPanel';
import { ExtrasOnLocationItem } from '@/hooks/useExtrasOnLocation';

interface JobDiagramSidebarProps {
  nodes: Node[];
  edges: unknown[];
  selectedShearstreamBoxes: string[];
  selectedStarlink: string;
  selectedCustomerComputers: string[];
  selectedWellGauges?: Record<string, string>;
  selectedYAdapters?: string[];
  updateWellName: (wellId: string, newName: string) => void;
  updateWellColor: (wellId: string, newColor: string) => void;
  updateWellsideGaugeName: (name: string) => void;
  updateWellsideGaugeColor: (newColor: string) => void;
  updateWellGaugeType: (wellId: string, gaugeType: string) => void;
  extrasOnLocation: ExtrasOnLocationItem[];
  onAddExtra: (equipmentTypeId: string, quantity: number, reason: string, notes?: string, individualEquipmentId?: string) => void;
  onRemoveExtra: (extraId: string) => void;
  onEquipmentSelect: (type: 'shearstream-box' | 'starlink' | 'customer-computer' | 'well-gauge' | 'y-adapter' | 'pressure-gauge-1502' | 'pressure-gauge-abra' | 'pressure-gauge-pencil', equipmentId: string, index?: number, nodeId?: string) => void;
  onAddShearstreamBox: () => void;
  onRemoveShearstreamBox: (index: number) => void;
  onAddStarlink: () => void;
  onRemoveStarlink: (index: number) => void;
  onAddCustomerComputer: () => void;
  onRemoveCustomerComputer: (index: number) => void;
  getEquipmentStatus?: (equipmentId: string) => 'available' | 'allocated' | 'deployed' | 'unavailable';
  conflicts?: unknown[];
  resolveConflict?: (conflict: { id: string; equipmentId: string }, resolution: 'current' | 'requested') => Promise<void>;
}

const JobDiagramSidebar: React.FC<JobDiagramSidebarProps> = ({
  nodes,
  edges,
  selectedShearstreamBoxes,
  selectedStarlink,
  selectedCustomerComputers,
  selectedWellGauges = {},
  selectedYAdapters = [],
  updateWellName,
  updateWellColor,
  updateWellsideGaugeName,
  updateWellsideGaugeColor,
  updateWellGaugeType,
  extrasOnLocation,
  onAddExtra,
  onRemoveExtra,
  onEquipmentSelect,
  onAddShearstreamBox,
  onRemoveShearstreamBox,
  onAddStarlink,
  onRemoveStarlink,
  onAddCustomerComputer,
  onRemoveCustomerComputer,
  getEquipmentStatus,
  conflicts,
  resolveConflict,
}) => {
  // Get well and wellside gauge nodes for configuration
  const wellNodes = nodes.filter(node => node.type === 'well');
  const wellsideGaugeNode = nodes.find(node => node.type === 'wellsideGauge');
  const yAdapterNodes = nodes.filter(node => node.type === 'yAdapter');
  
  // Calculate counts from nodes
  const shearstreamBoxCount = nodes.filter(node => node.type === 'mainBox').length;
  const customerComputerCount = nodes.filter(node => node.type === 'customerComputer').length;
  const hasWellsideGauge = !!wellsideGaugeNode;

  return (
    <div className="w-full md:w-80 h-full space-y-4 p-3 md:p-4 bg-card overflow-y-auto">
      {/* Conflict Indicator at the top if there are conflicts */}
      {conflicts && conflicts.length > 0 && (
        <div className="flex justify-center">
          <ConflictIndicator 
            conflicts={conflicts} 
            onResolveConflict={resolveConflict}
            className="text-sm"
          />
        </div>
      )}
      
      <UnifiedEquipmentSelectionPanel
        selectedShearstreamBoxes={selectedShearstreamBoxes}
        selectedStarlink={selectedStarlink}
        selectedCustomerComputers={selectedCustomerComputers}
        selectedWellGauges={selectedWellGauges}
        selectedYAdapters={selectedYAdapters}
        customerComputerCount={customerComputerCount}
        shearstreamBoxCount={shearstreamBoxCount}
        wellNodes={wellNodes}
        yAdapterNodes={yAdapterNodes}
        onEquipmentSelect={onEquipmentSelect}
        onAddShearstreamBox={onAddShearstreamBox}
        onRemoveShearstreamBox={onRemoveShearstreamBox}
        onAddStarlink={onAddStarlink}
        onRemoveStarlink={onRemoveStarlink}
        onAddCustomerComputer={onAddCustomerComputer}
        onRemoveCustomerComputer={onRemoveCustomerComputer}
        hasWellsideGauge={hasWellsideGauge}
        getEquipmentStatus={getEquipmentStatus}
      />

      <WellConfigurationPanel
        wellNodes={wellNodes}
        wellsideGaugeNode={wellsideGaugeNode}
        updateWellName={updateWellName}
        updateWellColor={updateWellColor}
        updateWellsideGaugeName={updateWellsideGaugeName}
        updateWellsideGaugeColor={updateWellsideGaugeColor}
        updateWellGaugeType={updateWellGaugeType}
      />

      <EquipmentSummaryPanel
        nodes={nodes}
        edges={edges}
        selectedShearstreamBoxes={selectedShearstreamBoxes}
        selectedStarlink={selectedStarlink}
        selectedCustomerComputers={selectedCustomerComputers}
        extrasOnLocation={extrasOnLocation}
      />

      <ExtrasOnLocationPanel 
        extrasOnLocation={extrasOnLocation}
        onAddExtra={onAddExtra}
        onRemoveExtra={onRemoveExtra}
      />

      <UnifiedRedTagPanel variant="location" />
    </div>
  );
};

export default JobDiagramSidebar;
