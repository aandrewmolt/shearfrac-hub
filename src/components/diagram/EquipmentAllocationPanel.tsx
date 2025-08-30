import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Cable, Square, Zap, Monitor, Satellite, MapPin, AlertTriangle, Package, CheckCircle, Info } from 'lucide-react';
import { useAwsEquipmentAssignment, EquipmentAssignment } from '@/hooks/useAwsEquipmentAssignment';
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
  const { 
    getAvailableEquipment, 
    getJobEquipment, 
    assignEquipmentToJob, 
    removeEquipmentFromJob,
    loading 
  } = useAwsEquipmentAssignment();
  
  const [availableEquipment, setAvailableEquipment] = useState<EquipmentAssignment[]>([]);
  const [jobEquipment, setJobEquipment] = useState<EquipmentAssignment[]>([]);

  // Load equipment data
  useEffect(() => {
    const loadEquipment = async () => {
      try {
        const [available, assigned] = await Promise.all([
          getAvailableEquipment(),
          getJobEquipment(jobId)
        ]);
        setAvailableEquipment(available);
        setJobEquipment(assigned);
      } catch (error) {
        console.error('Failed to load equipment:', error);
      }
    };
    
    if (jobId) {
      loadEquipment();
    }
  }, [jobId, getAvailableEquipment, getJobEquipment]);

  // Handle equipment assignment
  const handleAssignEquipment = async (equipmentId: string) => {
    try {
      await assignEquipmentToJob(equipmentId, jobId);
      // Reload equipment data
      const [available, assigned] = await Promise.all([
        getAvailableEquipment(),
        getJobEquipment(jobId)
      ]);
      setAvailableEquipment(available);
      setJobEquipment(assigned);
    } catch (error) {
      console.error('Failed to assign equipment:', error);
    }
  };

  // Handle equipment removal
  const handleRemoveEquipment = async (equipmentId: string) => {
    try {
      await removeEquipmentFromJob(equipmentId, jobId);
      // Reload equipment data
      const [available, assigned] = await Promise.all([
        getAvailableEquipment(),
        getJobEquipment(jobId)
      ]);
      setAvailableEquipment(available);
      setJobEquipment(assigned);
    } catch (error) {
      console.error('Failed to remove equipment:', error);
    }
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
            {/* Available Equipment */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Available Equipment</h3>
              <div className="space-y-2">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : availableEquipment.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No available equipment</p>
                ) : (
                  availableEquipment.map(equipment => (
                    <div key={equipment.equipmentId} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <div>
                            <span className="font-medium text-sm">{equipment.equipmentCode}</span>
                            <p className="text-xs text-muted-foreground">{equipment.equipmentName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {equipment.equipmentType}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAssignEquipment(equipment.equipmentId)}
                            disabled={loading}
                          >
                            Assign
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Assigned Equipment */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground">Assigned to Job</h3>
              <div className="space-y-2">
                {jobEquipment.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No equipment assigned to this job</p>
                ) : (
                  jobEquipment.map(equipment => (
                    <div key={equipment.equipmentId} className="border rounded-lg p-3 bg-green-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <div>
                            <span className="font-medium text-sm">{equipment.equipmentCode}</span>
                            <p className="text-xs text-muted-foreground">{equipment.equipmentName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs bg-green-100">
                            {equipment.equipmentType}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleRemoveEquipment(equipment.equipmentId)}
                            disabled={loading}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Summary */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>AWS Equipment Management:</strong> Use the buttons above to assign available equipment to this job or remove assigned equipment.
              </AlertDescription>
            </Alert>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default EquipmentAllocationPanel;