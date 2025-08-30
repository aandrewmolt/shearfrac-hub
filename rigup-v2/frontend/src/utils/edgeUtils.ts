
import { Edge } from '@xyflow/react';

export const getCurrentLabel = (
  data?: {
    label?: string;
    connectionType?: string;
    cableTypeId?: string;
    equipmentId?: string;
    cableEquipmentId?: string;
  },
  currentEdge?: Edge
): string => {
  // Check for equipment ID first (actual allocated cable)
  const equipmentId = data?.equipmentId || data?.cableEquipmentId || 
                      currentEdge?.data?.equipmentId || currentEdge?.data?.cableEquipmentId;
  
  if (equipmentId) {
    // If we have an equipment ID like "CC01", show it with the cable type
    const connectionType = data?.connectionType || currentEdge?.data?.connectionType || currentEdge?.type || 'cable';
    const cableTypeId = data?.cableTypeId || currentEdge?.data?.cableTypeId;
    
    if (connectionType === 'direct') return 'Direct Connection';
    if (cableTypeId === '1' || connectionType === '100ft') return `${equipmentId} (100ft)`;
    if (cableTypeId === '2' || connectionType === '300ft') return `${equipmentId} (300ft)`;
    return equipmentId;
  }
  
  if (data?.label) {
    return data.label;
  }
  if (currentEdge?.label) {
    // Safely handle the unknown type from @xyflow/react
    const label = typeof currentEdge.label === 'string' ? currentEdge.label : 'Cable';
    return label;
  }
  
  // Determine label based on connection type when no equipment allocated
  const connectionType = data?.connectionType || currentEdge?.data?.connectionType || currentEdge?.type || 'cable';
  
  if (connectionType === 'direct') return 'Direct Connection';
  if (data?.cableTypeId === '1' || currentEdge?.data?.cableTypeId === '1') return '100ft Cable';
  if (data?.cableTypeId === '2' || currentEdge?.data?.cableTypeId === '2') return '300ft Cable';
  return 'Cable';
};

export const checkIsYToWellConnection = (
  sourceNodeType?: string,
  targetNodeType?: string
): boolean => {
  return (
    (sourceNodeType === 'yAdapter' && targetNodeType === 'well') ||
    (sourceNodeType === 'well' && targetNodeType === 'yAdapter') ||
    (sourceNodeType === 'yAdapter' && targetNodeType === 'wellsideGauge') ||
    (sourceNodeType === 'wellsideGauge' && targetNodeType === 'yAdapter')
  );
};

export const logEdgeDebugging = (
  id: string,
  sourceId: string,
  targetId: string,
  sourceNodeType?: string,
  targetNodeType?: string,
  edgeType?: string,
  connectionType?: string,
  label?: string
) => {
};
