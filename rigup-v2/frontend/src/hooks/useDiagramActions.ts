import { useCallback } from 'react';
import { Node, Edge, getNodesBounds, getViewportForBounds } from '@xyflow/react';
import { toast } from 'sonner';
import { toPng, toJpeg, toSvg } from 'html-to-image';

interface Job {
  id: string;
  name: string;
  wellCount: number;
  hasWellsideGauge: boolean;
  createdAt: Date;
}

export const useDiagramActions = (
  job: Job,
  nodeIdCounter: number,
  setNodeIdCounter: (counter: number) => void,
  setNodes: (updater: (nodes: Node[]) => Node[]) => void,
  setEdges: (updater: (edges: Edge[]) => Edge[]) => void,
  setIsInitialized: (initialized: boolean) => void,
  initializeJob: () => void,
  reactFlowWrapper: React.RefObject<HTMLDivElement>,
  openYAdapterDialog?: () => void,
  openNodeEquipmentDialog?: (nodeType: string, position: { x: number; y: number }) => void
) => {
  const addYAdapter = useCallback(() => {
    if (openYAdapterDialog) {
      // Open the dialog to select a specific Y-adapter
      openYAdapterDialog();
    } else {
      // Fallback to old behavior if dialog not provided
      const newYAdapter: Node = {
        id: `y-adapter-${nodeIdCounter}`,
        type: 'yAdapter',
        position: { x: 250 + (nodeIdCounter * 30), y: 200 + (nodeIdCounter * 30) },
        data: { label: 'Y Adapter' },
        deletable: true, // Make deletable
      };
      
      setNodes((nds) => [...nds, newYAdapter]);
      setNodeIdCounter(nodeIdCounter + 1);
      toast.success('Y Adapter added!');
    }
  }, [nodeIdCounter, setNodes, setNodeIdCounter, openYAdapterDialog]);

  const addShearstreamBox = useCallback(() => {
    if (openNodeEquipmentDialog) {
      // We need to pass the position calculation to the parent component
      // Since we can't access nodes state directly here
      openNodeEquipmentDialog('shearstreamBox', { x: 0, y: 0 });
    } else {
      // Fallback to old behavior
      setNodes((nds) => {
        const existingBoxes = nds.filter(node => node.type === 'mainBox');
        const newBoxNumber = existingBoxes.length + 1;
        
        // Grid layout: 2 columns, horizontal spacing of 300px, vertical spacing of 250px
        const column = (existingBoxes.length) % 2;
        const row = Math.floor(existingBoxes.length / 2);
        
        const newBox: Node = {
          id: `main-box-${newBoxNumber}`,
          type: 'mainBox',
          position: { 
            x: 50 + (column * 300), // Horizontal spacing: first box at 50, second at 350, etc.
            y: 100 + (row * 250) // Vertical spacing: stack rows with 250px spacing
          },
          data: { 
            label: 'ShearStream Box', // Generic label until equipment is assigned
            boxNumber: newBoxNumber,
            equipmentId: null,
            assigned: false
          },
          draggable: true,
          deletable: true, // Make deletable
        };
        
        setNodeIdCounter(nodeIdCounter + 1);
        toast.success(`ShearStream Box ${newBoxNumber} added!`);
        return [...nds, newBox];
      });
    }
  }, [nodeIdCounter, setNodes, setNodeIdCounter, openNodeEquipmentDialog]);

  const removeShearstreamBox = useCallback((boxId: string) => {
    setNodes((nds) => {
      const filteredNodes = nds.filter(node => node.id !== boxId);
      
      // Remove any edges connected to this box
      setEdges((edges) => edges.filter(edge => 
        edge.source !== boxId && edge.target !== boxId
      ));
      
      toast.success('ShearStream Box removed!');
      return filteredNodes;
    });
  }, [setNodes, setEdges]);

  const addCompanyComputer = useCallback(() => {
    if (openNodeEquipmentDialog) {
      // We need to pass the position calculation to the parent component
      // Since we can't access nodes state directly here
      openNodeEquipmentDialog('customerComputer', { x: 0, y: 0 });
    } else {
      // Fallback to old behavior
      setNodes((nds) => {
        const existingComputers = nds.filter(node => node.type === 'customerComputer'); // Fixed node type
        const newComputerNumber = existingComputers.length + 1;
        
        // Position Customer Computers at top-left of ShearStream boxes with proper spacing
        // First computer goes above the first box, subsequent ones offset to avoid overlap
        const baseX = 50; // Same as first ShearStream box X position
        const baseY = 20; // Above the ShearStream boxes (which start at y: 100)
        
        const newComputer: Node = {
          id: `customer-computer-${newComputerNumber}`,
          type: 'customerComputer', // Fixed node type
          // Position at top-left area with horizontal spacing to prevent overlap
          position: { 
            x: baseX + (existingComputers.length * 180), // Horizontal spacing between computers
            y: baseY 
          },
          data: { 
            label: 'Customer Computer', // Generic label until equipment is assigned
            equipmentId: null,
            assigned: false,
            isTablet: false
          },
          draggable: true,
          deletable: true, // Make deletable
        };
        
        setNodeIdCounter(nodeIdCounter + 1);
        toast.success('Customer Computer added!');
        return [...nds, newComputer];
      });
    }
  }, [nodeIdCounter, setNodes, setNodeIdCounter, openNodeEquipmentDialog]);

  const updateWellName = useCallback((wellId: string, newName: string) => {
    setNodes((nds) => 
      nds.map((node) => 
        node.id === wellId 
          ? { ...node, data: { ...node.data, label: newName } }
          : node
      )
    );
  }, [setNodes]);

  const updateWellColor = useCallback((wellId: string, newColor: string) => {
    setNodes((nds) => 
      nds.map((node) => 
        node.id === wellId 
          ? { ...node, data: { ...node.data, color: newColor } }
          : node
      )
    );
  }, [setNodes]);

  const updateWellsideGaugeColor = useCallback((newColor: string) => {
    setNodes((nds) => 
      nds.map((node) => 
        node.id === 'wellside-gauge' 
          ? { ...node, data: { ...node.data, color: newColor } }
          : node
      )
    );
  }, [setNodes]);

  const clearDiagram = useCallback(() => {
    setIsInitialized(false);
    setNodes(() => []);
    setEdges(() => []);
    setTimeout(() => {
      initializeJob();
    }, 0);
    toast.success('Diagram cleared!');
  }, [setIsInitialized, setNodes, setEdges, initializeJob]);

  const downloadImage = useCallback((dataUrl: string, format: string) => {
    const link = document.createElement('a');
    link.download = `${job.name}-cable-diagram.${format}`;
    link.href = dataUrl;
    link.click();
  }, [job.name]);

  const saveDiagram = useCallback(async () => {
    if (!reactFlowWrapper.current) {
      toast.error('Diagram container not found');
      return;
    }
    
    const loadingToast = toast.loading('Exporting diagram...');
    
    try {
      // Find the ReactFlow viewport element that contains the actual diagram
      const reactFlowElement = reactFlowWrapper.current.querySelector('.react-flow__viewport');
      
      if (!reactFlowElement) {
        toast.error('Diagram viewport not found');
        return;
      }

      // Configuration for better SVG and canvas rendering
      const config = {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#1a1a1a',
        cacheBust: true,
        filter: (node: Element) => {
          // Include all elements but exclude controls and attribution
          if (node.classList) {
            return !node.classList.contains('react-flow__controls') && 
                   !node.classList.contains('react-flow__attribution');
          }
          return true;
        },
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      };

      // Try html-to-image library which handles SVG better than html2canvas
      const dataUrl = await toPng(reactFlowElement as HTMLElement, config);
      
      downloadImage(dataUrl, 'png');
      toast.success('Diagram exported successfully!');
      
    } catch (error) {
      console.error('Export error:', error);
      
      // Fallback to html2canvas if html-to-image fails
      try {
        const html2canvas = (await import('html2canvas')).default;
        
        const canvas = await html2canvas(reactFlowWrapper.current, {
          backgroundColor: '#1a1a1a',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          foreignObjectRendering: true,
          logging: false,
        });
        
        const dataUrl = canvas.toDataURL('image/png');
        downloadImage(dataUrl, 'png');
        toast.success('Diagram exported successfully (fallback method)!');
        
      } catch (fallbackError) {
        console.error('Fallback export error:', fallbackError);
        toast.error('Failed to export diagram. Please try again.');
      }
    } finally {
      toast.dismiss(loadingToast);
    }
  }, [reactFlowWrapper, downloadImage]);

  const addYAdapterWithEquipment = useCallback((equipmentId: string, equipmentName: string) => {
    const newYAdapter: Node = {
      id: `y-adapter-${nodeIdCounter}`,
      type: 'yAdapter',
      position: { x: 250 + (nodeIdCounter * 30), y: 200 + (nodeIdCounter * 30) },
      data: { 
        label: equipmentName,
        equipmentId: equipmentId,
        equipmentName: equipmentName,
        assigned: true,
        color: '#eab308', // Default yellow color for Y-adapters
        jobId: null,
        customName: null,
        fracComPort: null,
        gaugeComPort: null,
        fracBaudRate: null,
        gaugeBaudRate: null
      },
      deletable: true,
      draggable: true, // Make it draggable like other nodes
    };
    
    setNodes((nds) => [...nds, newYAdapter]);
    setNodeIdCounter(nodeIdCounter + 1);
    toast.success(`Y Adapter ${equipmentName} added!`);
  }, [nodeIdCounter, setNodes, setNodeIdCounter]);

  const addShearstreamBoxWithEquipment = useCallback((equipmentId: string, equipmentName: string) => {
    setNodes((nds) => {
      const existingBoxes = nds.filter(node => node.type === 'mainBox');
      const newBoxNumber = existingBoxes.length + 1;
      
      const column = (existingBoxes.length) % 2;
      const row = Math.floor(existingBoxes.length / 2);
      
      const newBox: Node = {
        id: `main-box-${newBoxNumber}`,
        type: 'mainBox',
        position: { 
          x: 50 + (column * 300),
          y: 100 + (row * 250)
        },
        data: { 
          label: equipmentName,
          boxNumber: newBoxNumber,
          equipmentId: equipmentId,
          assigned: true
        },
        draggable: true,
        deletable: true,
      };
      
      setNodeIdCounter(nodeIdCounter + 1);
      toast.success(`ShearStream Box ${equipmentName} added!`);
      return [...nds, newBox];
    });
  }, [nodeIdCounter, setNodes, setNodeIdCounter]);

  const addCustomerComputerWithEquipment = useCallback((equipmentId: string, equipmentName: string, isTablet: boolean = false) => {
    setNodes((nds) => {
      const existingComputers = nds.filter(node => node.type === 'customerComputer');
      const newComputerNumber = existingComputers.length + 1;
      
      const newComputer: Node = {
        id: `customer-computer-${newComputerNumber}`,
        type: 'customerComputer',
        position: { 
          x: 50 + (existingComputers.length * 180),
          y: 20
        },
        data: { 
          label: equipmentName,
          equipmentId: equipmentId,
          assigned: true,
          isTablet: isTablet
        },
        draggable: true,
        deletable: true,
      };
      
      setNodeIdCounter(nodeIdCounter + 1);
      toast.success(`${isTablet ? 'Customer Tablet' : 'Customer Computer'} ${equipmentName} added!`);
      return [...nds, newComputer];
    });
  }, [nodeIdCounter, setNodes, setNodeIdCounter]);

  return {
    addYAdapter,
    addYAdapterWithEquipment,
    addShearstreamBox,
    addShearstreamBoxWithEquipment,
    removeShearstreamBox,
    addCompanyComputer,
    addCustomerComputerWithEquipment,
    updateWellName,
    updateWellColor,
    updateWellsideGaugeColor,
    clearDiagram,
    saveDiagram,
  };
};
