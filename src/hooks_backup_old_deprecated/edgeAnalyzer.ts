
import { Edge } from '@xyflow/react';
import { EquipmentType } from '@/types/inventory';
import { DetailedEquipmentUsage } from '../types/equipmentUsageTypes';

interface EdgeData {
  connectionType?: string;
  cableTypeId?: string;
  cableType?: string;
  label?: string;
}

export const analyzeEdges = (
  edges: Edge[], 
  equipmentTypes: EquipmentType[], 
  usage: DetailedEquipmentUsage
): void => {
  // Ensure arrays are defined
  if (!edges || !Array.isArray(edges)) return;
  if (!equipmentTypes || !Array.isArray(equipmentTypes)) return;
  if (!usage) return;
  
  edges.forEach(edge => {
    const edgeData = edge.data as EdgeData;
    const connectionType = edgeData?.connectionType || 'cable';
    
    if (connectionType === 'direct') {
      usage.directConnections = (usage.directConnections || 0) + 1;
      return;
    }

    // For cable connections, determine cable type
    let cableTypeId: string;
    
    if (edgeData?.cableTypeId) {
      // Use explicit cable type ID if available
      cableTypeId = edgeData.cableTypeId;
    } else {
      // Default to 200ft cable if no type specified
      cableTypeId = '200ft-cable';
    }

    // Find the cable equipment type
    const cableType = equipmentTypes.find(type => type.id === cableTypeId);
    if (cableType) {
      const length = extractLengthFromName(cableType.name);
      const version = extractVersionFromName(cableType.name);
      
      // Initialize cables object if not exists
      if (!usage.cables) {
        usage.cables = {};
      }
      
      // Initialize cable entry if not exists
      if (!usage.cables[cableTypeId]) {
        usage.cables[cableTypeId] = {
          quantity: 0,
          typeName: cableType.name,
          category: cableType.category || 'cables',
          length,
          version
        };
      }
      
      // Increment quantity
      usage.cables[cableTypeId].quantity++;
    }
  });
};

const extractLengthFromName = (name: string): string => {
  const lengthMatch = name.match(/(\d+)\s*ft/i);
  return lengthMatch ? `${lengthMatch[1]}ft` : '';
};

const extractVersionFromName = (name: string): string | undefined => {
  if (name.toLowerCase().includes('v2') || name.toLowerCase().includes('version 2')) {
    return 'V2';
  }
  return undefined;
};
