
import React from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Circle } from 'lucide-react';
import { SimpleRedTagMenu } from './SimpleRedTagMenu';

// Extended node data interface for Well specific properties
interface WellNodeData {
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
  gaugeType?: string;
}

interface WellNodeProps {
  id: string;
  data: WellNodeData;
}

const WellNode: React.FC<WellNodeProps> = ({ id, data }) => {
  const { setNodes } = useReactFlow();
  const backgroundColor = data.color || '#3b82f6';
  const borderColor = data.color === '#3b82f6' ? '#2563eb' : data.color;
  const isAssigned = !!data.equipmentId;
  
  // Debug logging
  
  // Handle white wells - make text black and add black border
  const isWhiteWell = backgroundColor === '#ffffff' || backgroundColor === '#FFFFFF' || backgroundColor.toLowerCase() === '#fff';
  const textColor = isWhiteWell ? '#000000' : '#ffffff';
  const finalBorderColor = isWhiteWell ? '#000000' : borderColor;
  const borderWidth = '2px';
  
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
    <div 
      className="rounded-lg p-4 min-w-[120px] text-center relative"
      style={{ 
        backgroundColor,
        borderColor: finalBorderColor,
        borderWidth,
        borderStyle: 'solid',
        color: textColor,
      }}
    >
      {/* Red tag menu for assigned equipment */}
      {isAssigned && data.equipmentId && (
        <SimpleRedTagMenu 
          equipmentId={data.equipmentId} 
          nodeId={id}
          nodeType="Well"
          onRemoveEquipment={handleRemoveEquipment}
        />
      )}
      
      <Handle
        type="target"
        position={Position.Left}
        style={{
          left: -8,
          backgroundColor: finalBorderColor,
          border: '2px solid white',
          width: 12,
          height: 12,
        }}
      />
      
      <div className="flex flex-col items-center gap-2">
        <Circle className="h-6 w-6" />
        <div>
          <h3 className="font-bold">{data.label}</h3>
          {isAssigned && data.equipmentId && (
            <p className="text-xs font-medium" style={{ color: isWhiteWell ? '#059669' : '#86efac' }}>{data.equipmentId}</p>
          )}
          <p className="text-xs opacity-80">Well #{data.wellNumber}</p>
          {data.gaugeType && (
            <div className="text-xs opacity-70 mt-1">
              {data.gaugeType.replace('pressure-gauge-', '').replace('-', ' ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WellNode;
