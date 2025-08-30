
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Package, AlertTriangle, CheckCircle, RefreshCw, Wrench } from 'lucide-react';
import { useUnifiedInventory } from '@/hooks/useUnifiedInventory';
import { useRobustEquipmentTracking } from '@/hooks/useRobustEquipmentTracking';
import { useUnifiedEquipmentSync } from '@/hooks/useUnifiedEquipmentSync';
import ExtrasOnLocationPanel from './ExtrasOnLocationPanel';
import EquipmentLocationSelector from './equipment/EquipmentLocationSelector';
import EquipmentAvailabilityStatus from './equipment/EquipmentAvailabilityStatus';
import { Node, Edge } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SyncStatusIndicator } from '@/components/InventoryMapperSync/SyncStatusIndicator';
import { isEquipmentAtLocation } from '@/utils/equipmentLocation';
import EquipmentConflictResolver from '@/components/shared/EquipmentConflictResolver';

interface JobEquipmentPanelProps {
  jobId: string;
  jobName: string;
  nodes: Node[];
  edges: Edge[];
  extrasOnLocation?: Array<{
    id: string;
    equipmentTypeId: string;
    quantity: number;
    reason: string;
    addedDate: Date;
    notes?: string;
  }>;
  onAddExtra?: (equipmentTypeId: string, quantity: number, reason: string, notes?: string) => void;
  onRemoveExtra?: (extraId: string) => void;
}

const JobEquipmentPanel: React.FC<JobEquipmentPanelProps> = ({ 
  jobId, 
  jobName, 
  nodes,
  edges,
  extrasOnLocation = [],
  onAddExtra,
  onRemoveExtra,
}) => {
  const { data } = useUnifiedInventory();
  const [selectedLocation, setSelectedLocation] = useState<string>(data?.storageLocations?.[0]?.id || '');
  const { conflicts, getJobEquipment, isValidating } = useUnifiedEquipmentSync();
  
  const {
    performComprehensiveAllocation,
    returnAllJobEquipment,
    validateInventoryConsistency,
    analyzeEquipmentUsage,
    generateEquipmentReport,
    isProcessing
  } = useRobustEquipmentTracking(jobId, nodes, edges);
  
  // Get equipment conflicts for this job
  const jobConflicts = conflicts.filter(
    c => c.currentJobId === jobId || c.requestedJobId === jobId
  );

  const usage = analyzeEquipmentUsage();
  const report = generateEquipmentReport(usage);
  // Get deployed equipment using unified inventory method
  const deployedEquipment = data?.individualEquipment?.filter(
    item => item.status === 'deployed' && isEquipmentAtLocation(item, jobId, 'job')
  );
  const isConsistent = validateInventoryConsistency();

  // Check equipment availability
  const checkAvailability = () => {
    const issues: string[] = [];
    
    if (usage?.cables) {
      Object.entries(usage.cables).forEach(([typeId, details]) => {
        // Check bulk equipment
        const availableBulk = data.equipmentItems
          .filter(item => item.typeId === typeId && item.locationId === selectedLocation && item.status === 'available')
          .reduce((sum, item) => sum + item.quantity, 0);
        
        // Check individual equipment using unified inventory (check both typeId and equipmentTypeId for compatibility)
        // Also check against typeName since database may store display names
        const availableIndividual = data.individualEquipment
          .filter(item => {
            // Check if Type field matches the display name OR typeId/equipmentTypeId matches the ID
            const typeMatch = item.Type === details.typeName || 
                            item.typeId === typeId || 
                            item.equipmentTypeId === typeId ||
                            item.Type === typeId;
            const statusMatch = item.status === 'available';
            const locationMatch = isEquipmentAtLocation(item, selectedLocation, 'storage');
            return typeMatch && statusMatch && locationMatch;
          })
          .length;
        
        const totalAvailable = availableBulk + availableIndividual;
        
        if (totalAvailable < details.quantity) {
          issues.push(`${details.typeName}: need ${details.quantity}, have ${totalAvailable} (${availableBulk} bulk + ${availableIndividual} individual)`);
        }
      });
    }

    // Check other equipment - match on both type ID and type name since data may use either
    const equipmentChecks = [
      { typeId: 'pressure-gauge-1502', typeName: '1502 Pressure Gauge', quantity: usage.gauges1502 || usage.gauges || 0, name: '1502 Pressure Gauge' },
      { typeId: 'pressure-gauge-pencil', typeName: 'Pencil Gauge', quantity: usage.pencilGauges || 0, name: 'Pencil Gauge' },
      { typeId: 'y-adapter', typeName: 'Y-Adapter', quantity: usage.adapters, name: 'Y Adapter' },
      { typeId: 'customer-computer', typeName: 'Customer Computer', quantity: usage.computers, name: 'Customer Computer' },
      { typeId: 'starlink', typeName: 'Starlink', quantity: usage.satellite, name: 'Starlink' },
      { typeId: 'shearstream-box', typeName: 'ShearStream Box', quantity: usage.shearstreamBoxes || 0, name: 'ShearStream Box' },
    ];

    equipmentChecks.forEach(({ typeId, typeName, quantity, name }) => {
      if (quantity > 0) {
        // Check bulk equipment
        const availableBulk = data.equipmentItems
          .filter(item => item.typeId === typeId && item.locationId === selectedLocation && item.status === 'available')
          .reduce((sum, item) => sum + item.quantity, 0);
        
        // Check individual equipment using unified inventory (check both typeId and equipmentTypeId for compatibility)
        // Also check against typeName since database may store display names
        const availableIndividual = data.individualEquipment
          .filter(item => {
            // Check if Type field matches the display name OR typeId/equipmentTypeId matches the ID
            const typeMatch = item.Type === typeName || 
                            item.typeId === typeId || 
                            item.equipmentTypeId === typeId ||
                            item.Type === typeId;
            const statusMatch = item.status === 'available';
            const locationMatch = (item.locationId === selectedLocation || item.storageLocationId === selectedLocation) || 
                                isEquipmentAtLocation(item, selectedLocation, 'storage');
            return typeMatch && statusMatch && locationMatch;
          })
          .length;
        
        const totalAvailable = availableBulk + availableIndividual;
        
        if (totalAvailable < quantity) {
          issues.push(`${name}: need ${quantity}, have ${totalAvailable} (${availableBulk} bulk + ${availableIndividual} individual)`);
        }
      }
    });

    return { hasIssues: issues.length > 0, issues };
  };

  const availability = selectedLocation ? checkAvailability() : { hasIssues: false, issues: [] };

  return (
    <div className="space-y-4">
      <Card className="bg-card shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            Equipment Overview - {jobName}
            <SyncStatusIndicator />
            {isConsistent ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
            {deployedEquipment.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {deployedEquipment.length} deployed
              </Badge>
            )}
            {jobConflicts.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {jobConflicts.length} conflict{jobConflicts.length > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EquipmentLocationSelector
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
          />

          {/* Equipment Requirements Summary */}
          <div className="bg-muted p-3 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              Equipment Required from Diagram
              <Badge variant="outline" className="text-xs">
                {Object.values(usage.cables).reduce((sum, cable) => sum + cable.quantity, 0) + 
                 usage.gauges + usage.adapters + usage.computers + usage.satellite} items
              </Badge>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(usage.cables).map(([typeId, details]) => (
                <div key={typeId} className="flex justify-between">
                  <span className="truncate">{details.typeName}:</span>
                  <span className="font-bold">{details.quantity}</span>
                </div>
              ))}
              {usage.gauges > 0 && (
                <div className="flex justify-between">
                  <span>1502 Pressure Gauge:</span>
                  <span className="font-bold">{usage.gauges}</span>
                </div>
              )}
              {usage.adapters > 0 && (
                <div className="flex justify-between">
                  <span>Y Adapters:</span>
                  <span className="font-bold">{usage.adapters}</span>
                </div>
              )}
              {usage.computers > 0 && (
                <div className="flex justify-between">
                  <span>Customer Computer:</span>
                  <span className="font-bold">{usage.computers}</span>
                </div>
              )}
              {usage.satellite > 0 && (
                <div className="flex justify-between">
                  <span>Starlink:</span>
                  <span className="font-bold">{usage.satellite}</span>
                </div>
              )}
              {usage.directConnections > 0 && (
                <div className="flex justify-between">
                  <span>Direct Connections:</span>
                  <span className="font-bold text-foreground">{usage.directConnections}</span>
                </div>
              )}
            </div>
          </div>

          {/* Equipment Availability Status */}
          {selectedLocation && (
            <EquipmentAvailabilityStatus
              availability={availability}
              equipmentUsage={{
                cables: Object.fromEntries(
                  Object.entries(usage.cables).map(([typeId, details]) => [
                    typeId, details.quantity
                  ])
                ),
                gauges: usage.gauges,
                adapters: usage.adapters,
                computers: usage.computers,
                satellite: usage.satellite
              }}
              jobId={jobId}
              selectedLocationId={selectedLocation}
            />
          )}

          <Separator />

          {/* Equipment Conflicts */}
          {jobConflicts.length > 0 && (
            <>
              <div className="bg-muted p-3 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2 text-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  Equipment Conflicts
                </h4>
                <div className="space-y-2">
                  {jobConflicts.map((conflict) => (
                    <div key={conflict.equipmentId} className="text-sm">
                      <div className="font-medium text-foreground">{conflict.equipmentName}</div>
                      <div className="text-muted-foreground">
                        {conflict.currentJobId === jobId 
                          ? `Requested by: ${conflict.requestedJobName}`
                          : `Currently deployed to: ${conflict.currentJobName}`
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Currently Deployed Equipment */}
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              Currently Deployed
              <Badge variant={deployedEquipment.length > 0 ? "default" : "secondary"} className="text-xs">
                {deployedEquipment.length} items
              </Badge>
            </h4>
            {deployedEquipment.length > 0 ? (
              <div className="space-y-1">
                {deployedEquipment.map(item => {
                  const equipmentType = data?.equipmentTypes?.find(type => type.id === item.equipmentTypeId);
                  return (
                    <div key={item.id} className="flex justify-between text-sm p-2 bg-muted rounded">
                      <span>
                        {item.name || item.equipmentId} ({equipmentType?.name || 'Unknown'})
                      </span>
                      <span className="font-medium">1</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No equipment currently deployed</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => performComprehensiveAllocation(selectedLocation)}
              className="flex-1"
              disabled={!selectedLocation || isProcessing || availability.hasIssues}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Allocating...
                </span>
              ) : (
                'Allocate Equipment'
              )}
            </Button>
            <Button
              onClick={returnAllJobEquipment}
              className="flex-1"
              variant="destructive"
              disabled={isProcessing}
            >
              Return All Equipment
            </Button>
          </div>

          {/* Validation Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => validateInventoryConsistency()}
              className="flex-1"
              variant="secondary"
              disabled={isProcessing}
            >
              <Wrench className="h-4 w-4 mr-2 inline" />
              Validate Consistency
            </Button>
          </div>
        </CardContent>
      </Card>

      <EquipmentConflictResolver 
        jobId={jobId}
        className="mb-4"
      />

      <ExtrasOnLocationPanel
        extrasOnLocation={extrasOnLocation}
        onAddExtra={onAddExtra || (() => {})}
        onRemoveExtra={onRemoveExtra || (() => {})}
      />
    </div>
  );
};

export default JobEquipmentPanel;
