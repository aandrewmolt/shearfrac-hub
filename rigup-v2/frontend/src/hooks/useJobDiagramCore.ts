
import React, { useRef, useEffect } from 'react';
import { useJobDiagramState } from '@/hooks/useJobDiagramState';
import { useJobDiagramInitialization } from '@/hooks/useJobDiagramInitialization';
import { useDiagramConnections } from '@/hooks/useDiagramConnections';
import { JobDiagram } from '@/hooks/useJobs';
import { IndividualEquipment } from '@/types/equipment';

export const useJobDiagramCore = (job: JobDiagram, inventoryData?: IndividualEquipment[]) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // State management
  const {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    selectedShearstreamBoxes,
    setSelectedShearstreamBoxes,
    selectedStarlink,
    setSelectedStarlink,
    selectedCustomerComputers,
    setSelectedCustomerComputers,
    selectedWellGauges,
    setSelectedWellGauges,
    selectedYAdapters,
    setSelectedYAdapters,
    initializeCableType,
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
  } = useJobDiagramState();

  // Job initialization
  const { initializeJob } = useJobDiagramInitialization({
    job,
    nodes,
    edges,
    isInitialized,
    setNodes,
    setEdges,
    setNodeIdCounter,
    setIsInitialized,
    setMainBoxName,
    setSatelliteName,
    setWellsideGaugeName,
    setCustomerComputerNames,
    setSelectedCableType,
    setSelectedShearstreamBoxes,
    setSelectedStarlink,
    setSelectedCustomerComputers,
    setEquipmentAssignment,
    syncWithLoadedData,
    mainBoxName,
    satelliteName,
    wellsideGaugeName,
    inventoryData,
  });

  // Initialize cable type
  React.useEffect(() => {
    initializeCableType();
  }, [initializeCableType]);

  // Track if we've initialized this specific job
  const initializedJobId = React.useRef<string | null>(null);
  
  // Initialize job ONLY ONCE per job ID
  React.useEffect(() => {
    // Only initialize if:
    // 1. We have a job with an ID
    // 2. We haven't initialized this specific job yet
    // 3. The system says it's not initialized
    if (job && job.id && initializedJobId.current !== job.id && !isInitialized) {
      console.log('Core hook effect - ONE TIME initialization for job:', job.id);
      initializedJobId.current = job.id;
      initializeJob();
    }
  }, [job.id, isInitialized, initializeJob]);

  // Diagram connections
  const { onConnect } = useDiagramConnections(selectedCableType, nodes, setEdges);

  return {
    reactFlowWrapper,
    // State
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    selectedCableType,
    setSelectedCableType,
    selectedShearstreamBoxes,
    setSelectedShearstreamBoxes,
    selectedStarlink,
    setSelectedStarlink,
    selectedCustomerComputers,
    setSelectedCustomerComputers,
    selectedWellGauges,
    setSelectedWellGauges,
    selectedYAdapters,
    setSelectedYAdapters,
    nodeIdCounter,
    setNodeIdCounter,
    isInitialized,
    setIsInitialized,
    equipmentAssignment,
    setEquipmentAssignment,
    mainBoxName,
    satelliteName,
    wellsideGaugeName,
    customerComputerNames,
    // Functions
    onConnect,
    initializeJob,
    updateMainBoxName,
    updateCustomerComputerName,
    updateSatelliteName,
    updateWellsideGaugeName,
  };
};
