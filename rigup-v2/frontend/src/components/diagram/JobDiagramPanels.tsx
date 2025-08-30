
import React from 'react';
import { Node } from '@xyflow/react';
import WellConfigurationPanel from './WellConfigurationPanel';
import CompactJobEquipmentPanel from './CompactJobEquipmentPanel';
import { UnifiedEquipmentSelectionPanel } from '@/components/shared';

interface Job {
  id: string;
  name: string;
  wellCount: number;
  hasWellsideGauge: boolean;
  createdAt: Date;
}

interface JobDiagramPanelsProps {
  job: Job;
  nodes: Node[];
  edges: unknown[];
  selectedCableType: string;
  setSelectedCableType: (type: string) => void;
  selectedShearstreamBoxes: string[];
  selectedStarlink: string;
  selectedCustomerComputers: string[];
  onEquipmentSelect: (type: 'shearstream-box' | 'starlink' | 'customer-computer', equipmentId: string, index?: number) => void;
  onAddShearstreamBox: () => void;
  onRemoveShearstreamBox: (index: number) => void;
  addYAdapter: () => void;
  addCustomerComputer: () => void;
  clearDiagram: () => void;
  saveDiagram: () => void;
  updateWellName: (wellId: string, newName: string) => void;
  updateWellColor: (wellId: string, newColor: string) => void;
  updateWellsideGaugeName: (name: string) => void;
  updateWellsideGaugeColor: (newColor: string) => void;
}

const JobDiagramPanels: React.FC<JobDiagramPanelsProps> = ({
  job,
  nodes,
  edges,
  selectedCableType,
  setSelectedCableType,
  selectedShearstreamBoxes,
  selectedStarlink,
  selectedCustomerComputers,
  onEquipmentSelect,
  onAddShearstreamBox,
  onRemoveShearstreamBox,
  addYAdapter,
  addCustomerComputer,
  clearDiagram,
  saveDiagram,
  updateWellName,
  updateWellColor,
  updateWellsideGaugeName,
  updateWellsideGaugeColor,
}) => {
  const wellNodes = nodes.filter(node => node.type === 'well');
  const wellsideGaugeNode = nodes.find(node => node.type === 'wellsideGauge');
  const customerComputerNodes = nodes.filter(node => node.type === 'customerComputer');
  const shearstreamBoxNodes = nodes.filter(node => node.type === 'mainBox');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      <UnifiedEquipmentSelectionPanel
        variant="compact"
        selectedShearstreamBoxes={selectedShearstreamBoxes}
        selectedStarlink={selectedStarlink}
        selectedCustomerComputers={selectedCustomerComputers}
        customerComputerCount={customerComputerNodes.length}
        shearstreamBoxCount={shearstreamBoxNodes.length}
        onEquipmentSelect={onEquipmentSelect}
        onAddShearstreamBox={onAddShearstreamBox}
        onRemoveShearstreamBox={onRemoveShearstreamBox}
        hasWellsideGauge={job.hasWellsideGauge}
      />

      <WellConfigurationPanel
        wellNodes={wellNodes}
        wellsideGaugeNode={wellsideGaugeNode}
        updateWellName={updateWellName}
        updateWellColor={updateWellColor}
        updateWellsideGaugeName={updateWellsideGaugeName}
        updateWellsideGaugeColor={updateWellsideGaugeColor}
      />

      <CompactJobEquipmentPanel
        jobId={job.id}
        jobName={job.name}
        nodes={nodes}
        edges={edges}
      />

      {/* Optional 4th column for future expansion */}
      <div className="hidden xl:block">
        {/* Reserved for additional controls if needed */}
      </div>
    </div>
  );
};

export default JobDiagramPanels;
