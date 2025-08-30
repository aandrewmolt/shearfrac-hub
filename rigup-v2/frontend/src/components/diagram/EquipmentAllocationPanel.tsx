import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Cable, Square, Zap, Monitor, Satellite, MapPin, AlertTriangle, Package, CheckCircle, Info } from 'lucide-react';
import { useInventory } from '@/contexts/InventoryContext';
import { Node, Edge } from '@xyflow/react';

interface EquipmentAllocationPanelProps {
  nodes: Node[];
  edges: Edge[];
  jobId: string;
}

const EquipmentAllocationPanel: React.FC<EquipmentAllocationPanelProps> = ({
  nodes,
  edges,
  jobId
}) => {
  const { data: inventoryData } = useInventory();

  const getEquipmentById = (equipmentId: string) => {
    return inventoryData.individualEquipment.find(item => item.id === equipmentId);
  };

  const getEquipmentType = (typeId: string) => {
    return inventoryData.equipmentTypes.find(type => type.id === typeId);
  };

  const getLocation = (locationId: string) => {
    return inventoryData.storageLocations.find(loc => loc.id === locationId);
  };

  const getNodeIcon = (nodeType: string) => {
    switch (nodeType) {
      case 'mainBox': return <Square className="h-4 w-4" />;
      case 'yAdapter': return <Zap className="h-4 w-4" />;
      case 'customerComputer': return <Monitor className="h-4 w-4" />;
      case 'companyComputer': return <Monitor className="h-4 w-4" />;
      case 'satellite': return <Satellite className="h-4 w-4" />;
      case 'well': return <Package className="h-4 w-4" />;
      case 'wellsideGauge': return <Package className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getNodeEquipmentType = (nodeType: string) => {
    switch (nodeType) {
      case 'mainBox': return 'shearstream-box';
      case 'yAdapter': return 'y-adapter';
      case 'customerComputer': return 'customer-computer';
      case 'companyComputer': return 'customer-computer';
      case 'satellite': return 'starlink';
      case 'well': return 'pressure-gauge-1502';
      case 'wellsideGauge': return 'pressure-gauge-1502';
      default: return null;
    }
  };

  // Filter nodes that can have equipment allocated
  const allocatableNodes = nodes.filter(node => 
    ['mainBox', 'yAdapter', 'customerComputer', 'companyComputer', 'satellite', 'well', 'wellsideGauge'].includes(node.type || '')
  );

  // Filter cable edges - include all edge types that represent connections
  const cableEdges = edges.filter(edge => 
    !edge.type || ['cable', 'direct', 'smoothstep', 'default'].includes(edge.type)
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5" />
          Equipment Allocation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-6">
            {/* Node Equipment Allocation */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Equipment Items</h3>
              <div className="space-y-2">
                {allocatableNodes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No equipment nodes in diagram</p>
                ) : (
                  allocatableNodes.map(node => {
                    const assignedEquipmentId = node.data?.equipmentId;
                    const assignedEquipment = assignedEquipmentId ? 
                      inventoryData.individualEquipment.find(eq => eq.equipmentId === assignedEquipmentId) : 
                      null;
                    
                    return (
                      <div key={node.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getNodeIcon(node.type || '')}
                            <span className="font-medium text-sm">
                              {node.data?.label || node.type}
                            </span>
                          </div>
                          {assignedEquipment ? (
                            <Badge variant="outline" className="text-xs bg-card text-success flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Auto-Allocated
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Available
                            </Badge>
                          )}
                        </div>
                        
                        {assignedEquipment ? (
                          <div className="bg-card rounded p-2 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{assignedEquipment.equipmentId}</span>
                              <span className="text-xs text-success">
                                {assignedEquipment.status === 'deployed' ? 'Deployed' : assignedEquipment.status}
                              </span>
                            </div>
                            {assignedEquipment.serialNumber && (
                              <p className="text-xs text-muted-foreground">Serial: {assignedEquipment.serialNumber}</p>
                            )}
                            {assignedEquipment.locationId && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {getLocation(assignedEquipment.locationId)?.name || 'Storage'}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-card rounded p-2">
                            <p className="text-xs text-muted-foreground italic">
                              Drag equipment from inventory to assign
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Cable Allocation */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Cable Connections</h3>
              <div className="space-y-2">
                {cableEdges.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No cable connections in diagram</p>
                ) : (
                  cableEdges.map(edge => {
                    const cableType = edge.data?.cableTypeId ? getEquipmentType(edge.data.cableTypeId) : null;
                    
                    return (
                      <div key={edge.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Cable className="h-4 w-4" />
                            <span className="font-medium text-sm">
                              {edge.data?.label || 'Cable'}
                            </span>
                          </div>
                          {cableType && (
                            <Badge variant="outline" className="text-xs">
                              {cableType.name}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {edge.source} → {edge.target}
                        </div>
                        
                        {cableType ? (
                          <div className="bg-card rounded p-2">
                            <p className="text-xs text-foreground">
                              Type: {cableType.name}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-card rounded p-2">
                            <p className="text-xs text-muted-foreground">
                              Cable type configured
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Summary Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Auto-Allocation Active:</strong> Equipment is automatically allocated when you drag and drop items onto nodes. 
                When removing equipment, you'll be prompted to either return it to storage or red tag it for maintenance.
              </AlertDescription>
            </Alert>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default EquipmentAllocationPanel;