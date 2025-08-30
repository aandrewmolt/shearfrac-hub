
import { useDiagramActions } from '@/hooks/useDiagramActions';
import { Node, Edge } from '@xyflow/react';

interface Job {
  id: string;
  name: string;
  wellCount: number;
  hasWellsideGauge: boolean;
  createdAt: Date;
}

interface UseJobDiagramActionsProps {
  job: Job;
  nodeIdCounter: number;
  setNodeIdCounter: (counter: number) => void;
  setNodes: (updater: (nodes: Node[]) => Node[]) => void;
  setEdges: (updater: (edges: Edge[]) => Edge[]) => void;
  setIsInitialized: (initialized: boolean) => void;
  initializeJob: () => void;
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
  openYAdapterDialog?: () => void;
  openNodeEquipmentDialog?: (nodeType: string, position: { x: number; y: number }) => void;
}

export const useJobDiagramActions = ({
  job,
  nodeIdCounter,
  setNodeIdCounter,
  setNodes,
  setEdges,
  setIsInitialized,
  initializeJob,
  reactFlowWrapper,
  openYAdapterDialog,
  openNodeEquipmentDialog,
}: UseJobDiagramActionsProps) => {
  const {
    addYAdapter,
    addYAdapterWithEquipment,
    addShearstreamBox,
    addShearstreamBoxWithEquipment,
    removeShearstreamBox,
    addCompanyComputer,
    addCustomerComputerWithEquipment,
    updateWellName,
    updateWellColor,
    updateWellsideGaugeColor,
    clearDiagram,
    saveDiagram,
  } = useDiagramActions(
    job,
    nodeIdCounter,
    setNodeIdCounter,
    setNodes,
    setEdges,
    setIsInitialized,
    initializeJob,
    reactFlowWrapper,
    openYAdapterDialog,
    openNodeEquipmentDialog
  );

  // Rename addCompanyComputer to addCustomerComputer for consistency
  const addCustomerComputer = addCompanyComputer;

  const updateWellsideGaugeName = (name: string) => {
    setNodes((nds) => 
      nds.map((node) => 
        node.id === 'wellside-gauge' 
          ? { ...node, data: { ...node.data, label: name } }
          : node
      )
    );
  };

  return {
    addYAdapter,
    addYAdapterWithEquipment,
    addShearstreamBox,
    addShearstreamBoxWithEquipment,
    removeShearstreamBox,
    addCustomerComputer,
    addCustomerComputerWithEquipment,
    updateWellName,
    updateWellColor,
    updateWellsideGaugeName,
    updateWellsideGaugeColor,
    clearDiagram,
    saveDiagram,
  };
};
