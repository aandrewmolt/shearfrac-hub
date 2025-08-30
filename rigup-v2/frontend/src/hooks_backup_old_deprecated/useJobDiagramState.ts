
import { useState, useCallback } from 'react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import { JobEquipmentAssignment } from '@/types/equipment';
import { useInventoryData } from './useInventoryData';
import { useCableTypeService } from './cables/useCableTypeService';
import { useJobPersistence } from './useJobPersistence';

export const useJobDiagramState = () => {
  const { data } = useInventoryData();
  const { getDefaultCableType } = useCableTypeService(data.equipmentTypes);
  
  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Equipment selection state
  const [selectedShearstreamBoxes, setSelectedShearstreamBoxes] = useState<string[]>([]);
  const [selectedStarlink, setSelectedStarlink] = useState<string>('');
  const [selectedCustomerComputers, setSelectedCustomerComputers] = useState<string[]>([]);
  
  // Cable and equipment state
  const [selectedCableType, setSelectedCableType] = useState<string>('');
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  
  // Component naming state
  const [mainBoxName, setMainBoxName] = useState('ShearStream Box');
  const [satelliteName, setSatelliteName] = useState('Starlink');
  const [wellsideGaugeName, setWellsideGaugeName] = useState('Wellside Gauge');
  const [customerComputerNames, setCustomerComputerNames] = useState<Record<string, string>>({});
  
  // Initialization state
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Equipment assignment state
  const [equipmentAssignment, setEquipmentAssignment] = useState<JobEquipmentAssignment>({
    shearstreamBoxIds: [],
    customerComputerIds: []
  });

  // Initialize cable type when equipment types are available
  const initializeCableType = useCallback(() => {
    if (!selectedCableType && data.equipmentTypes.length > 0) {
      const defaultType = getDefaultCableType();
      if (defaultType) {
        setSelectedCableType(defaultType);
      }
    }
  }, [selectedCableType, data.equipmentTypes, getDefaultCableType]);

  // Update functions for node labels
  const updateMainBoxName = useCallback((name: string) => {
    setMainBoxName(name);
    setNodes((nds) => 
      nds.map((node) => 
        node.id === 'main-box' 
          ? { ...node, data: { ...node.data, label: name } }
          : node
      )
    );
  }, [setNodes]);

  const updateSatelliteName = useCallback((name: string) => {
    setSatelliteName(name);
    setNodes((nds) => 
      nds.map((node) => 
        node.id === 'satellite' 
          ? { ...node, data: { ...node.data, label: name } }
          : node
      )
    );
  }, [setNodes]);

  const updateWellsideGaugeName = useCallback((name: string) => {
    setWellsideGaugeName(name);
    setNodes((nds) => 
      nds.map((node) => 
        node.id === 'wellside-gauge' 
          ? { ...node, data: { ...node.data, label: name } }
          : node
      )
    );
  }, [setNodes]);

  const updateCustomerComputerName = useCallback((computerId: string, name: string) => {
    setCustomerComputerNames(prev => ({ ...prev, [computerId]: name }));
    setNodes((nds) => 
      nds.map((node) => 
        node.id === computerId 
          ? { ...node, data: { ...node.data, label: name } }
          : node
      )
    );
  }, [setNodes]);

  // Sync function for loading persisted data
  const syncWithLoadedData = useCallback((jobData: { 
    selectedCableType?: string; 
    equipmentAssignment?: Record<string, string | string[]>; 
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
      setSelectedShearstreamBoxes(jobData.equipmentAssignment.shearstreamBoxIds || []);
      setSelectedStarlink(jobData.equipmentAssignment.starlinkId || '');
      setSelectedCustomerComputers(jobData.equipmentAssignment.customerComputerIds || []);
    }
    if (jobData.mainBoxName) setMainBoxName(jobData.mainBoxName);
    if (jobData.satelliteName) setSatelliteName(jobData.satelliteName);
    if (jobData.wellsideGaugeName) setWellsideGaugeName(jobData.wellsideGaugeName);
    if (jobData.customerComputerNames) setCustomerComputerNames(jobData.customerComputerNames);
  }, []);

  return {
    // React Flow state
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    
    // Equipment selection
    selectedShearstreamBoxes,
    setSelectedShearstreamBoxes,
    selectedStarlink,
    setSelectedStarlink,
    selectedCustomerComputers,
    setSelectedCustomerComputers,
    
    // Cable and equipment
    selectedCableType,
    setSelectedCableType,
    initializeCableType,
    nodeIdCounter,
    setNodeIdCounter,
    
    // Component naming
    mainBoxName,
    setMainBoxName,
    satelliteName,
    setSatelliteName,
    wellsideGaugeName,
    setWellsideGaugeName,
    customerComputerNames,
    setCustomerComputerNames,
    
    // Initialization
    isInitialized,
    setIsInitialized,
    
    // Equipment assignment
    equipmentAssignment,
    setEquipmentAssignment,
    
    // Update functions
    updateMainBoxName,
    updateSatelliteName,
    updateWellsideGaugeName,
    updateCustomerComputerName,
    syncWithLoadedData,
  };
};
