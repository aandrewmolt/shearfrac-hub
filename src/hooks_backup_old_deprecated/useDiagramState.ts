
import { useState, useCallback } from 'react';
import { Node } from '@xyflow/react';

export interface JobEquipmentAssignment {
  shearstreamBoxIds: string[]; // Changed to support multiple boxes
  starlinkId?: string;
  customerComputerIds: string[]; // Changed from companyComputerIds
}

export const useDiagramState = () => {
  // Change selectedCableType to use string instead of hardcoded union
  const [selectedCableType, setSelectedCableType] = useState<string>('');
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  const [mainBoxName, setMainBoxName] = useState('ShearStream Box');
  const [satelliteName, setSatelliteName] = useState('Starlink');
  const [wellsideGaugeName, setWellsideGaugeName] = useState('Wellside Gauge');
  const [customerComputerNames, setCustomerComputerNames] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [equipmentAssignment, setEquipmentAssignment] = useState<JobEquipmentAssignment>({
    shearstreamBoxIds: [], // Changed to array
    customerComputerIds: [],
  });

  const updateMainBoxName = useCallback((nodeId: string, name: string, setNodes: (updater: (nodes: Node[]) => Node[]) => void) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, label: name } }
          : node
      )
    );
  }, []);

  const updateCustomerComputerName = useCallback((nodeId: string, name: string, setNodes: (updater: (nodes: Node[]) => Node[]) => void) => {
    setCustomerComputerNames(prev => ({ ...prev, [nodeId]: name }));
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, label: name } }
          : node
      )
    );
  }, []);

  const updateSatelliteName = useCallback((name: string, setNodes: (updater: (nodes: Node[]) => Node[]) => void) => {
    setSatelliteName(name);
    setNodes((nodes) =>
      nodes.map((node) =>
        node.type === 'satellite'
          ? { ...node, data: { ...node.data, label: name } }
          : node
      )
    );
  }, []);

  const updateWellsideGaugeName = useCallback((name: string, setNodes: (updater: (nodes: Node[]) => Node[]) => void) => {
    setWellsideGaugeName(name);
    setNodes((nodes) =>
      nodes.map((node) =>
        node.type === 'wellsideGauge'
          ? { ...node, data: { ...node.data, label: name } }
          : node
      )
    );
  }, []);

  const syncWithLoadedData = useCallback((jobData: { 
    selectedCableType?: string; 
    equipmentAssignment?: Record<string, string>; 
    companyComputerNames?: Record<string, string>;
    fracBaudRate?: string;
    gaugeBaudRate?: string;
    fracComPort?: string;
    gaugeComPort?: string;
    mainBoxName?: string;
    satelliteName?: string;
    wellsideGaugeName?: string;
  }) => {
    if (jobData.selectedCableType) {
      setSelectedCableType(jobData.selectedCableType);
    }
    if (jobData.equipmentAssignment) {
      setEquipmentAssignment(jobData.equipmentAssignment);
    }
  }, []);

  return {
    selectedCableType,
    setSelectedCableType,
    nodeIdCounter,
    setNodeIdCounter,
    mainBoxName,
    setMainBoxName,
    satelliteName,
    setSatelliteName,
    wellsideGaugeName,
    setWellsideGaugeName,
    customerComputerNames,
    setCustomerComputerNames,
    isInitialized,
    setIsInitialized,
    equipmentAssignment,
    setEquipmentAssignment,
    updateMainBoxName,
    updateCustomerComputerName,
    updateSatelliteName,
    updateWellsideGaugeName,
    syncWithLoadedData,
  };
};
