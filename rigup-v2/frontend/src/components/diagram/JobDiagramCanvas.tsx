
import React from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  ReactFlowProvider,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import '../edges/EdgeSelectionStyles.css';

// Import all node types
import WellNode from '@/components/nodes/WellNode';
import YAdapterNode from '@/components/nodes/YAdapterNode';
import MainBoxNode from '@/components/nodes/MainBoxNode';
import SatelliteNode from '@/components/nodes/SatelliteNode';
import CustomerComputerNode from '@/components/nodes/CustomerComputerNode';
import WellsideGaugeNode from '@/components/nodes/WellsideGaugeNode';

// Import edge types
import InteractiveCableEdge from '@/components/edges/InteractiveCableEdge';

const nodeTypes = {
  well: WellNode,
  yAdapter: YAdapterNode,
  mainBox: MainBoxNode,
  satellite: SatelliteNode,
  customerComputer: CustomerComputerNode,
  wellsideGauge: WellsideGaugeNode,
};

const edgeTypes = {
  cable: InteractiveCableEdge,
  direct: InteractiveCableEdge,
  default: InteractiveCableEdge,
};

interface JobDiagramCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onNodesDelete?: (nodes: Node[]) => void;
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
  immediateSave?: () => void;
}

const JobDiagramCanvas: React.FC<JobDiagramCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodesDelete,
  reactFlowWrapper,
  immediateSave,
}) => {
  // Enhanced edges with immediateSave function
  const enhancedEdges = React.useMemo(() => {
    return edges.map(edge => ({
      ...edge,
      data: {
        ...edge.data,
        immediateSave,
      },
    }));
  }, [edges, immediateSave]);

  return (
    <div className="flex-1 h-full" ref={reactFlowWrapper}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={enhancedEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          className="bg-card"
          deleteKeyCode={['Backspace', 'Delete']}
          defaultEdgeOptions={{
            type: 'cable',
            animated: false,
          }}
        >
          <Background />
          <Controls className="react-flow__controls" />
          <MiniMap 
            nodeStrokeColor="#374151"
            nodeColor="#2a2a2a"
            nodeBorderRadius={8}
            maskColor="rgba(0, 0, 0, 0.1)"
            className="react-flow__minimap hidden md:block"
          />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default JobDiagramCanvas;
