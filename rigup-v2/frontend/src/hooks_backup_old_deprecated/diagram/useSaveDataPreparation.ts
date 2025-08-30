
import { useMemo } from 'react';
import { JobEquipmentAssignment } from '@/types/equipment';

interface Job {
  id: string;
  name: string;
  wellCount: number;
  hasWellsideGauge: boolean;
  createdAt: Date;
}

interface UseSaveDataPreparationProps {
  job: Job;
  nodes: unknown[];
  edges: unknown[];
  mainBoxName: string;
  satelliteName: string;
  wellsideGaugeName: string;
  customerComputerNames: Record<string, string>;
  selectedCableType: string;
  selectedShearstreamBoxes: string[];
  selectedStarlink: string;
  selectedCustomerComputers: string[];
  extrasOnLocation?: unknown[];
}

export const useSaveDataPreparation = ({
  job,
  nodes,
  edges,
  mainBoxName,
  satelliteName,
  wellsideGaugeName,
  customerComputerNames,
  selectedCableType,
  selectedShearstreamBoxes,
  selectedStarlink,
  selectedCustomerComputers,
  extrasOnLocation = [],
}: UseSaveDataPreparationProps) => {
  const saveDataMemo = useMemo(() => {
    // Preserve ALL edge data with enhanced data structure
    const preservedEdges = edges.map(edge => {
      const edgeData = {
        // Core edge properties
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        type: edge.type || 'cable',
        label: edge.label,
        animated: edge.animated || false,
        style: edge.style || {},
        
        // Enhanced data preservation
        data: {
          ...edge.data,
          // Ensure sourceHandle and targetHandle are preserved in data as well
          sourceHandle: edge.data?.sourceHandle || edge.sourceHandle,
          targetHandle: edge.data?.targetHandle || edge.targetHandle,
          // Preserve connection type and label
          connectionType: edge.data?.connectionType || (edge.type === 'direct' ? 'direct' : 'cable'),
          label: edge.data?.label || edge.label,
          // Preserve cable type if it exists
          cableTypeId: edge.data?.cableTypeId,
        },
      };

      console.log('Saving edge with enhanced debugging:', {
        id: edge.id,
        type: edgeData.type,
        connectionType: edgeData.data.connectionType,
        label: edgeData.data.label,
        sourceHandle: edgeData.sourceHandle,
        originalEdge: edge
      });

      return edgeData;
    });

    // Preserve ALL node data with enhanced structure
    const preservedNodes = nodes.map(node => {
      const preservedNode = {
        id: node.id,
        type: node.type,
        position: node.position,
        style: node.style || {},
        draggable: node.draggable,
        deletable: node.deletable,
        data: {
          ...node.data,
          // Preserve all existing node data
          label: node.data?.label,
          color: node.data?.color,
          wellNumber: node.data?.wellNumber,
          boxNumber: node.data?.boxNumber,
          equipmentId: node.data?.equipmentId,
          assigned: node.data?.assigned,
          // Explicitly preserve COM port and baud rate settings
          fracBaudRate: node.data?.fracBaudRate,
          gaugeBaudRate: node.data?.gaugeBaudRate,
          fracComPort: node.data?.fracComPort,
          gaugeComPort: node.data?.gaugeComPort,
          // Preserve job reference
          jobId: job.id,
        },
      };
      
      // Log nodes with equipment assignments
      if (node.data?.equipmentId) {
        console.log('Saving node with equipment:', {
          nodeId: node.id,
          nodeType: node.type,
          equipmentId: node.data.equipmentId,
          label: node.data.label,
          assigned: node.data.assigned
        });
      }
      
      return preservedNode;
    });

    // Extract configuration data from MainBox nodes with better fallbacks
    const mainBoxNodes = preservedNodes.filter(node => node.type === 'mainBox');
    const primaryMainBox = mainBoxNodes[0]; // Use first MainBox as primary source
    
    const fracBaudRate = primaryMainBox?.data?.fracBaudRate || '19200';
    const gaugeBaudRate = primaryMainBox?.data?.gaugeBaudRate || '9600';
    const fracComPort = primaryMainBox?.data?.fracComPort || '';
    const gaugeComPort = primaryMainBox?.data?.gaugeComPort || '';

    console.log('Enhanced COM port debugging:', {
      fracBaudRate,
      gaugeBaudRate,
      fracComPort,
      gaugeComPort,
      mainBoxCount: mainBoxNodes.length,
      primaryMainBoxData: primaryMainBox?.data
    });

    return {
      id: job.id,
      name: job.name,
      wellCount: job.wellCount,
      hasWellsideGauge: job.hasWellsideGauge,
      nodes: preservedNodes,
      edges: preservedEdges,
      mainBoxName,
      satelliteName,
      wellsideGaugeName,
      customerComputerNames,
      selectedCableType,
      fracBaudRate,
      gaugeBaudRate,
      fracComPort,
      gaugeComPort,
      equipmentAssignment: {
        shearstreamBoxIds: selectedShearstreamBoxes.filter(Boolean),
        starlinkId: selectedStarlink || undefined,
        customerComputerIds: selectedCustomerComputers.filter(Boolean),
      } as JobEquipmentAssignment,
      equipmentAllocated: true,
      extrasOnLocation: extrasOnLocation,
    };
  }, [
    job,
    nodes,
    edges,
    mainBoxName,
    satelliteName,
    wellsideGaugeName,
    customerComputerNames,
    selectedCableType,
    selectedShearstreamBoxes,
    selectedStarlink,
    selectedCustomerComputers,
    extrasOnLocation
  ]);

  return { saveDataMemo };
};
