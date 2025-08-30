
import React, { useCallback, useEffect } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
} from '@xyflow/react';
import { useEdgeToggleLogic } from '@/hooks/edges/useEdgeToggleLogic';
import { getCurrentLabel, checkIsYToWellConnection, logEdgeDebugging } from '@/utils/edgeUtils';
import EdgeLabel from './EdgeLabel';
import EdgeContextMenu from './EdgeContextMenu';

interface InteractiveCableEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  style?: React.CSSProperties;
  markerEnd?: string;
  selected?: boolean;
  data?: {
    connectionType?: string;
    label?: string;
    cableTypeId?: string;
    sourceHandle?: string;
    targetHandle?: string;
    immediateSave?: () => void;
  };
}

const InteractiveCableEdge: React.FC<InteractiveCableEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected = false,
  data,
}) => {
  const { getNodes, getEdges, setEdges } = useReactFlow();
  
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Get the actual edge to find source and target
  const edges = getEdges();
  const nodes = getNodes();
  const currentEdge = edges.find(edge => edge.id === id);
  
  const sourceNode = currentEdge ? nodes.find(n => n.id === currentEdge.source) : undefined;
  const targetNode = currentEdge ? nodes.find(n => n.id === currentEdge.target) : undefined;

  // Get current label and ensure it's a string with type guard
  const labelResult = getCurrentLabel(data, currentEdge);
  const currentLabel: string = typeof labelResult === 'string' ? labelResult : 'Cable';

  // Safely extract connectionType with proper type conversion
  const getConnectionType = (): string => {
    if (data?.connectionType) return data.connectionType;
    if (currentEdge.data?.connectionType) {
      return String(currentEdge.data.connectionType);
    }
    return '';
  };

  // Log debugging information with properly typed parameters
  logEdgeDebugging(
    id,
    currentEdge.source,
    currentEdge.target,
    sourceNode?.type || '',
    targetNode?.type || '',
    currentEdge.type || '',
    getConnectionType(),
    currentLabel
  );
  
  // Check if this is a Y to Well connection (can toggle between 100ft and direct)
  const isYToWellConnection = checkIsYToWellConnection(sourceNode?.type, targetNode?.type);
  
  // Use the edge toggle logic hook - must be called before any early returns
  const { handleEdgeToggle } = useEdgeToggleLogic({ id, data, currentEdge });

  // Handle edge deletion - must be defined before any early returns
  const handleEdgeDelete = useCallback(() => {
    console.log('Deleting edge:', id);
    setEdges((edges) => edges.filter(edge => edge.id !== id));
    
    // Trigger immediate save if available
    if (data?.immediateSave) {
      console.log('Triggering immediate save after edge deletion');
      setTimeout(() => data.immediateSave!(), 50);
    }
  }, [id, setEdges, data]);
  
  // Add click handler directly to the edge - must be defined before any early returns
  const handleEdgeClick = useCallback(() => {
    console.log('Edge clicked directly:', { id, selected, isYToWellConnection });
    if (isYToWellConnection) {
      handleEdgeToggle();
    }
  }, [id, selected, isYToWellConnection, handleEdgeToggle]);

  // Keyboard shortcuts - must be defined before any early returns
  useEffect(() => {
    if (!selected) return;

    console.log('Edge selected:', { 
      id, 
      sourceNodeType: sourceNode?.type, 
      targetNodeType: targetNode?.type,
      isYToWellConnection 
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        handleEdgeDelete();
      } else if (event.key === 't' || event.key === 'T') {
        event.preventDefault();
        console.log('T key pressed on edge:', { id, isYToWellConnection });
        if (isYToWellConnection) {
          handleEdgeToggle();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selected, handleEdgeDelete, handleEdgeToggle, isYToWellConnection, id, sourceNode?.type, targetNode?.type]);

  // Additional debugging for selection state
  React.useEffect(() => {
    if (selected) {
      console.log('Edge selected:', { 
        id, 
        isYToWellConnection,
        sourceType: sourceNode?.type,
        targetType: targetNode?.type,
        canToggle: isYToWellConnection
      });
    }
  }, [selected, id, isYToWellConnection, sourceNode?.type, targetNode?.type]);
  
  // Additional debug for Y-Well connections
  if (sourceNode?.type === 'yAdapter' || targetNode?.type === 'yAdapter') {
    console.log('Y-adapter edge detected:', {
      id,
      sourceType: sourceNode?.type,
      targetType: targetNode?.type,
      isYToWellConnection,
      canToggle: isYToWellConnection
    });
  }
  
  // Early return if no current edge - AFTER all hooks
  if (!currentEdge) return null;
  
  // Enhanced styling based on connection type and selection state
  const getEdgeStyle = () => {
    const connectionType = getConnectionType();
    const baseStyle = { ...style };
    
    // Apply connection type styling
    if (connectionType === 'direct') {
      baseStyle.stroke = '#10b981';
      baseStyle.strokeDasharray = '5,5';
    } else {
      baseStyle.stroke = style.stroke || '#3b82f6';
      baseStyle.strokeDasharray = undefined;
    }
    
    // Apply selection styling with enhanced effects
    if (selected) {
      baseStyle.strokeWidth = 5;
      baseStyle.filter = 'drop-shadow(0px 3px 6px rgba(59, 130, 246, 0.4))';
      baseStyle.opacity = 1;
    } else {
      baseStyle.strokeWidth = 3;
      baseStyle.opacity = 0.8;
    }
    
    return baseStyle;
  };

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={getEdgeStyle()}
        className={`
          ${selected ? 'react-flow__edge-selected' : ''}
          transition-all duration-200 ease-in-out
          hover:drop-shadow-md
          cursor-pointer
        `}
        onClick={handleEdgeClick}
      />
      <EdgeLabelRenderer>
        <EdgeLabel
          label={currentLabel}
          isInteractive={isYToWellConnection}
          onToggle={handleEdgeToggle}
          onDelete={handleEdgeDelete}
          labelX={labelX}
          labelY={labelY}
          selected={selected}
        />
        {selected && (
          <EdgeContextMenu
            edgeId={id}
            isYToWellConnection={isYToWellConnection}
            onToggle={handleEdgeToggle}
            onDelete={handleEdgeDelete}
            labelX={labelX}
            labelY={labelY}
          />
        )}
      </EdgeLabelRenderer>
    </>
  );
};

export default InteractiveCableEdge;
