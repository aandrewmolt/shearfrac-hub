
import React from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Satellite } from 'lucide-react';
import NodeDeleteButton from './NodeDeleteButton';
import { SimpleRedTagMenu } from './SimpleRedTagMenu';

// Extended node data interface for component-specific properties
interface SatelliteNodeData {
  label?: string;
  equipmentId?: string;
  color?: string;
  wellNumber?: number;
  jobId?: string;
  assigned?: boolean;
  customName?: string;
  fracComPort?: string;
  gaugeComPort?: string;
  fracBaudRate?: string;
  gaugeBaudRate?: string;
  equipmentName?: string | null;
}

interface SatelliteNodeProps {
  id: string;
  data: SatelliteNodeData;
  selected?: boolean;
}

const SatelliteNode: React.FC<SatelliteNodeProps> = ({ id, data, selected }) => {
  const { deleteElements, setNodes } = useReactFlow();
  const isAssigned = !!data.equipmentId;

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  const handleRemoveEquipment = () => {
    setNodes((nodes) => 
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              equipmentId: null,
              equipmentName: null,
              assigned: false
            }
          };
        }
        return node;
      })
    );
  };

  return (
    <div className="bg-green-600 text-white rounded-lg p-4 border-2 border-green-400 min-w-[120px] text-center relative">
      {selected && <NodeDeleteButton onDelete={handleDelete} />}
      {isAssigned && data.equipmentId && (
        <SimpleRedTagMenu 
          equipmentId={data.equipmentId} 
          nodeId={id}
          onRemoveEquipment={handleRemoveEquipment}
        />
      )}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          right: -8,
          backgroundColor: '#16a34a',
          border: '2px solid white',
          width: 12,
          height: 12,
        }}
      />
      
      <div className="flex flex-col items-center gap-2">
        <Satellite className="h-6 w-6" />
        <div>
          <h3 className="font-bold">Starlink</h3>
          {isAssigned && data.equipmentId && (
            <p className="text-xs text-green-100">{data.equipmentId}</p>
          )}
          <p className="text-xs text-green-100">Satellite</p>
        </div>
      </div>
    </div>
  );
};

export default SatelliteNode;
