
import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Square } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useJobs } from '@/hooks/useJobs';
import NodeDeleteButton from './NodeDeleteButton';
import { SimpleRedTagMenu } from './SimpleRedTagMenu';

// Extended node data interface for Main Box specific properties
interface MainBoxNodeData {
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
}

interface MainBoxNodeProps {
  id: string;
  data: MainBoxNodeData;
  selected?: boolean;
}

const MainBoxNode: React.FC<MainBoxNodeProps> = ({ id, data, selected }) => {
  const { getNodes, setNodes, deleteElements } = useReactFlow();
  const { saveJob, getJobById } = useJobs();
  const [fracDataPort, setFracDataPort] = useState<string>(data.fracComPort || '');
  const [gaugeDataPort, setGaugeDataPort] = useState<string>(data.gaugeComPort || '');
  const [fracBaudRate, setFracBaudRate] = useState<string>(data.fracBaudRate || '19200');
  const [gaugeBaudRate, setGaugeBaudRate] = useState<string>(data.gaugeBaudRate || '9600');

  // Enhanced update node data function with immediate persistence
  const updateNodeData = (updates: Partial<MainBoxNodeData>) => {
    setNodes((nodes) => {
      const updatedNodes = nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              ...updates
            }
          };
        }
        return node;
      });
      return updatedNodes;
    });
    
    // Trigger save if equipment ID or critical data changed
    if (updates.equipmentId !== undefined || updates.fracComPort !== undefined || 
        updates.gaugeComPort !== undefined || updates.fracBaudRate !== undefined || 
        updates.gaugeBaudRate !== undefined) {
      // Trigger save after state update
      setTimeout(() => {
        // Note: MainBoxNode save now handled by unified save system in JobDiagram
        // Individual node changes are captured by the node change handler
        console.log('MainBox data updated:', updates);
      }, 100);
    }
  };

  // Enhanced frac data port change handler
  const handleFracDataPortChange = (value: string) => {
    
    // If ColdBore is selected, clear the baud rate
    if (value === 'coldbore') {
      setFracBaudRate('');
      updateNodeData({ fracComPort: value, fracBaudRate: '' });
    } else {
      // If switching from ColdBore to a COM port, set default baud rate
      if (fracDataPort === 'coldbore' && !fracBaudRate) {
        setFracBaudRate('19200');
        updateNodeData({ fracComPort: value, fracBaudRate: '19200' });
      } else {
        updateNodeData({ fracComPort: value });
      }
    }
  };

  // Enhanced gauge data port change handler
  const handleGaugeDataPortChange = (value: string) => {
    updateNodeData({ gaugeComPort: value });
  };

  // Enhanced frac baud rate change handler
  const handleFracBaudRateChange = (value: string) => {
    updateNodeData({ fracBaudRate: value });
  };

  // Enhanced gauge baud rate change handler
  const handleGaugeBaudRateChange = (value: string) => {
    updateNodeData({ gaugeBaudRate: value });
  };

  // Enhanced sync with node data when data changes
  useEffect(() => {
    if (data.fracComPort !== undefined && data.fracComPort !== fracDataPort) {
      setFracDataPort(data.fracComPort);
    }
    if (data.gaugeComPort !== undefined && data.gaugeComPort !== gaugeDataPort) {
      setGaugeDataPort(data.gaugeComPort);
    }
    if (data.fracBaudRate !== undefined && data.fracBaudRate !== fracBaudRate) {
      setFracBaudRate(data.fracBaudRate);
    }
    if (data.gaugeBaudRate !== undefined && data.gaugeBaudRate !== gaugeBaudRate) {
      setGaugeBaudRate(data.gaugeBaudRate);
    }
  }, [data.fracComPort, data.gaugeComPort, data.fracBaudRate, data.gaugeBaudRate, fracDataPort, gaugeDataPort, fracBaudRate, gaugeBaudRate]);

  // Available COM ports for selection
  const comPorts = [
    { id: 'com1', label: 'COM1' },
    { id: 'com2', label: 'COM2' },
    { id: 'com3', label: 'COM3' },
    { id: 'com4', label: 'COM4' },
    { id: 'com5', label: 'COM5' },
    { id: 'com6', label: 'COM6' },
    { id: 'com7', label: 'COM7' },
    { id: 'com8', label: 'COM8' },
  ];

  // Frac COM ports include ColdBore option
  const fracComPorts = [
    { id: 'coldbore', label: 'ColdBore' },
    ...comPorts
  ];

  // Common baud rates with 9600 and 19200 first
  const baudRates = [
    { id: '9600', label: '9600' },
    { id: '19200', label: '19200' },
    { id: '38400', label: '38400' },
    { id: '57600', label: '57600' },
    { id: '115200', label: '115200' },
  ];

  // These pressure ports all come from the selected gauge COM port
  const pressurePorts = [
    { id: 'p1', label: 'P1', pressure: 'Pressure1,2' },
    { id: 'p2', label: 'P2', pressure: 'Pressure3,4' },
    { id: 'p3', label: 'P3', pressure: 'Pressure5,6' },
    { id: 'p4', label: 'P4', pressure: 'Pressure7,8' },
  ];

  const isAssigned = !!data.equipmentId;
  
  // Debug logging to understand equipment ID display issues
  React.useEffect(() => {
    console.log(`MainBoxNode ${id} render debug:`, {
      equipmentId: data.equipmentId,
      assigned: data.assigned,
      isAssigned,
      label: data.label,
      equipmentName: data.equipmentName,
      allNodeData: data
    });
  }, [id, data.equipmentId, data.assigned, data.label, data.equipmentName, isAssigned, data]);
  
  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

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
    <Card className="bg-muted-foreground text-white p-4 border-2 border-border min-w-[280px] shadow-lg relative">
      {selected && <NodeDeleteButton onDelete={handleDelete} />}
      {isAssigned && data.equipmentId && (
        <SimpleRedTagMenu 
          equipmentId={data.equipmentId} 
          nodeId={id}
          onRemoveEquipment={handleRemoveEquipment}
        />
      )}
      <div className="flex items-center gap-2 mb-4">
        <Square className="h-5 w-5 text-foreground" />
        <div>
          <h3 className="font-bold text-lg text-white">ShearStream Box</h3>
          {isAssigned && data.equipmentId && (
            <p className="text-sm text-success font-medium">{data.equipmentId}</p>
          )}
        </div>
      </div>
      
      {/* COM Port Selection with Baud Rates - Enhanced with debugging */}
      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground w-12">Frac:</span>
          <Select value={fracDataPort} onValueChange={handleFracDataPortChange}>
            <SelectTrigger className="h-8 text-sm bg-muted border-border text-white hover:bg-muted/90 flex-1">
              <SelectValue placeholder="COM" />
            </SelectTrigger>
            <SelectContent className="bg-muted border-border">
              {fracComPorts.map(port => (
                <SelectItem key={port.id} value={port.id} className="text-white hover:bg-muted">
                  {port.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fracDataPort !== 'coldbore' && (
            <Select value={fracBaudRate} onValueChange={handleFracBaudRateChange}>
              <SelectTrigger className="h-8 text-sm bg-muted border-border text-white hover:bg-muted/90 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                {baudRates.map(rate => (
                  <SelectItem key={rate.id} value={rate.id} className="text-white hover:bg-muted">
                    {rate.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {fracDataPort === 'coldbore' && (
            <span className="text-xs text-muted-foreground italic">API Connection</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground w-12">Gauge:</span>
          <Select value={gaugeDataPort} onValueChange={handleGaugeDataPortChange}>
            <SelectTrigger className="h-8 text-sm bg-muted border-border text-white hover:bg-muted/90 flex-1">
              <SelectValue placeholder="COM" />
            </SelectTrigger>
            <SelectContent className="bg-muted border-border">
              {comPorts.map(port => (
                <SelectItem key={port.id} value={port.id} className="text-white hover:bg-muted">
                  {port.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={gaugeBaudRate} onValueChange={handleGaugeBaudRateChange}>
            <SelectTrigger className="h-8 text-sm bg-muted border-border text-white hover:bg-muted/90 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-muted border-border">
              {baudRates.map(rate => (
                <SelectItem key={rate.id} value={rate.id} className="text-white hover:bg-muted">
                  {rate.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        {pressurePorts.map((port, index) => (
          <div key={port.id} className="flex items-center justify-between bg-muted rounded-md p-3 relative border border-border">
            <div>
              <span className="font-semibold text-white text-base">{port.label}</span>
              <span className="text-sm text-muted-foreground ml-2">({port.pressure})</span>
            </div>
            <Handle
              type="source"
              position={Position.Right}
              id={port.id}
              style={{
                right: -8,
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: 'hsl(var(--primary))',
                border: '2px solid white',
                width: 12,
                height: 12,
              }}
            />
          </div>
        ))}
      </div>
    </Card>
  );
};

export default MainBoxNode;
