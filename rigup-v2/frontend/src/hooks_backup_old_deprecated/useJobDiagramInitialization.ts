
import { useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import { JobDiagram } from '@/hooks/useJobs';
import { migrateCableTypeId } from '@/utils/consolidated/migrationUtils';
import { validateJobDiagramEquipment, cleanOrphanedEquipmentReferences, logValidationResults } from '@/utils/jobDiagramValidation';
import { toast } from '@/hooks/use-toast';
import { IndividualEquipment } from '@/types/equipment';

interface UseJobDiagramInitializationProps {
  job: JobDiagram;
  nodes: Node[];
  edges: Edge[];
  isInitialized: boolean;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setNodeIdCounter: (counter: number) => void;
  setIsInitialized: (initialized: boolean) => void;
  setMainBoxName: (name: string) => void;
  setSatelliteName: (name: string) => void;
  setWellsideGaugeName: (name: string) => void;
  setCustomerComputerNames: (names: Record<string, string>) => void;
  setSelectedCableType: (type: string) => void;
  setSelectedShearstreamBoxes: (boxes: string[]) => void;
  setSelectedStarlink: (starlink: string) => void;
  setSelectedCustomerComputers: (computers: string[]) => void;
  setEquipmentAssignment: (assignment: Record<string, string>) => void;
  syncWithLoadedData: (data: unknown) => void;
  mainBoxName: string;
  satelliteName: string;
  wellsideGaugeName: string;
  inventoryData?: IndividualEquipment[];
}

export const useJobDiagramInitialization = ({
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
}: UseJobDiagramInitializationProps) => {

  const createInitialNodes = useCallback((wellCount: number, hasWellsideGauge: boolean) => {
    const initialNodes: Node[] = [];
    const nodeId = 1;

    // Main ShearStream Box
    initialNodes.push({
      id: 'main-box',
      type: 'mainBox',
      position: { x: 100, y: 100 },
      data: { 
        label: mainBoxName,
        jobId: job.id,
        // Initialize COM port settings with defaults
        fracComPort: '',
        gaugeComPort: '',
        fracBaudRate: '19200',
        gaugeBaudRate: '9600',
      },
    });

    // Satellite
    initialNodes.push({
      id: 'satellite',
      type: 'satellite',
      position: { x: 100, y: 300 },
      data: { label: satelliteName },
    });

    // Customer Computer
    initialNodes.push({
      id: 'customer-computer-1',
      type: 'customerComputer',
      position: { x: 500, y: 100 },
      data: { label: 'Customer Computer' },
    });

    // Wells
    for (let i = 1; i <= wellCount; i++) {
      initialNodes.push({
        id: `well-${i}`,
        type: 'well',
        position: { x: 700 + (i - 1) * 150, y: 300 },
        data: { 
          label: `Well ${i}`,
          wellNumber: i,
          color: '#22c55e',
        },
      });
    }

    // Wellside Gauge (if needed)
    if (hasWellsideGauge) {
      initialNodes.push({
        id: 'wellside-gauge',
        type: 'wellsideGauge',
        position: { x: 700, y: 150 },
        data: { 
          label: wellsideGaugeName,
          color: '#8b5cf6',
        },
      });
    }

    setNodeIdCounter(nodeId + 1);
    return initialNodes;
  }, [job.id, mainBoxName, satelliteName, wellsideGaugeName, setNodeIdCounter]);

  const restoreNodesWithEnhancedData = useCallback((savedNodes: unknown[]) => {
    return savedNodes.map(node => {
      const restoredNode = {
        ...node,
        data: {
          ...node.data,
          // Ensure job ID is set for all nodes
          jobId: job.id,
          // CRITICAL: Restore equipmentId if it exists
          equipmentId: node.data?.equipmentId || '',
          // Restore assigned flag based on equipmentId
          assigned: !!node.data?.equipmentId,
          // Restore COM port settings for MainBox nodes
          ...(node.type === 'mainBox' && {
            fracComPort: node.data?.fracComPort || '',
            gaugeComPort: node.data?.gaugeComPort || '',
            fracBaudRate: node.data?.fracBaudRate || '19200',
            gaugeBaudRate: node.data?.gaugeBaudRate || '9600',
          }),
          // Restore other node-specific data
          wellNumber: node.data?.wellNumber,
          boxNumber: node.data?.boxNumber,
          color: node.data?.color,
          isTablet: node.data?.isTablet,
        },
      };
      
      console.log('Restoring node with equipment:', {
        nodeId: node.id,
        nodeType: node.type,
        equipmentId: restoredNode.data.equipmentId,
        assigned: restoredNode.data.assigned,
        originalData: node.data
      });
      
      return restoredNode;
    });
  }, [job.id]);

  const restoreEdgesWithEnhancedData = useCallback((savedEdges: unknown[]) => {
    return savedEdges.map(edge => {
      // Migrate cable type ID if needed
      const cableTypeId = edge.data?.cableTypeId ? migrateCableTypeId(edge.data.cableTypeId) : undefined;
      
      const restoredEdge = {
        ...edge,
        // Ensure all required edge properties are present
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle || edge.data?.sourceHandle,
        targetHandle: edge.targetHandle || edge.data?.targetHandle,
        type: edge.type || 'cable',
        label: edge.label || edge.data?.label || 'Cable',
        animated: edge.animated || false,
        style: edge.style || {},
        data: {
          ...edge.data,
          // Restore connection data
          connectionType: edge.data?.connectionType || (edge.type === 'direct' ? 'direct' : 'cable'),
          label: edge.data?.label || edge.label || 'Cable',
          sourceHandle: edge.data?.sourceHandle || edge.sourceHandle,
          targetHandle: edge.data?.targetHandle || edge.targetHandle,
          cableTypeId: cableTypeId,
        },
      };

      console.log('Restoring edge:', {
        id: edge.id,
        type: restoredEdge.type,
        connectionType: restoredEdge.data.connectionType,
        label: restoredEdge.data.label,
        sourceHandle: restoredEdge.sourceHandle,
        originalCableTypeId: edge.data?.cableTypeId,
        migratedCableTypeId: cableTypeId,
        originalData: edge.data
      });

      return restoredEdge;
    });
  }, []);

  const initializeJob = useCallback(() => {
    console.log('Initializing job diagram:', { 
      jobId: job.id, 
      wellCount: job.wellCount, 
      hasWellsideGauge: job.hasWellsideGauge,
      hasExistingNodes: job.nodes && job.nodes.length > 0,
      hasExistingEdges: job.edges && job.edges.length > 0
    });

    if (job.nodes && job.nodes.length > 0) {
      console.log('Loading existing job data');
      
      // Restore nodes with enhanced data
      const restoredNodes = restoreNodesWithEnhancedData(job.nodes);
      
      // Validate equipment references against inventory if available
      if (inventoryData && inventoryData.length > 0) {
        const validationResult = validateJobDiagramEquipment(restoredNodes, inventoryData);
        logValidationResults(validationResult, job.name);
        
        if (!validationResult.isValid) {
          // Show warning to user about orphaned equipment
          toast({
            title: "Equipment Validation Warning",
            description: `Found ${validationResult.orphanedEquipment.length} equipment references that don't exist in inventory. These have been removed from the diagram.`,
            variant: "destructive",
          });
          
          // Clean orphaned equipment references
          const { cleanedNodes, removedCount } = cleanOrphanedEquipmentReferences(restoredNodes, inventoryData);
          console.log(`🧹 Cleaned ${removedCount} orphaned equipment references from job diagram`);
          setNodes(cleanedNodes);
        } else {
          setNodes(restoredNodes);
        }
      } else {
        // No inventory data available, just restore nodes without validation
        setNodes(restoredNodes);
      }

      // Restore edges with enhanced data
      if (job.edges && job.edges.length > 0) {
        const restoredEdges = restoreEdgesWithEnhancedData(job.edges);
        setEdges(restoredEdges);
      } else {
        setEdges([]);
      }

      // Restore additional job data
      if (job.mainBoxName) setMainBoxName(job.mainBoxName);
      if (job.satelliteName) setSatelliteName(job.satelliteName);
      if (job.wellsideGaugeName) setWellsideGaugeName(job.wellsideGaugeName);
      // Fix: Use companyComputerNames instead of customerComputerNames
      if (job.companyComputerNames) setCustomerComputerNames(job.companyComputerNames);
      if (job.selectedCableType) setSelectedCableType(job.selectedCableType);
      
      // Restore equipment assignments
      if (job.equipmentAssignment) {
        setEquipmentAssignment(job.equipmentAssignment);
        setSelectedShearstreamBoxes(job.equipmentAssignment.shearstreamBoxIds || []);
        setSelectedStarlink(job.equipmentAssignment.starlinkId || '');
        setSelectedCustomerComputers(job.equipmentAssignment.customerComputerIds || []);
      }

      // Sync with loaded data
      syncWithLoadedData(job);
      
      console.log('Job data restored successfully');
    } else {
      console.log('Creating new job diagram');
      
      // Create initial diagram
      const initialNodes = createInitialNodes(job.wellCount, job.hasWellsideGauge);
      setNodes(initialNodes);
      setEdges([]);
    }

    setIsInitialized(true);
  }, [
    job,
    setNodes,
    setEdges,
    setIsInitialized,
    createInitialNodes,
    restoreNodesWithEnhancedData,
    restoreEdgesWithEnhancedData,
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
    inventoryData,
  ]);

  return {
    initializeJob,
  };
};
