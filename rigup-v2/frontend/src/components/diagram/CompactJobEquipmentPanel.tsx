
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Settings, 
  TrendingUp,
  Zap,
  AlertCircle
} from 'lucide-react';
import { useInventory } from '@/contexts/InventoryContext';
import { useRobustEquipmentTracking } from '@/hooks/useRobustEquipmentTracking';
import { useUnifiedEquipmentSync } from '@/hooks/useUnifiedEquipmentSync';
import { Node, Edge } from '@xyflow/react';
import { toast } from 'sonner';
import ConflictIndicator from './ConflictIndicator';
import { useEquipmentDebugger } from '@/hooks/equipment/useEquipmentDebugger';
import { useEquipmentCleanup } from '@/hooks/equipment/useEquipmentCleanup';
import { isEquipmentAtLocation } from '@/utils/equipmentLocation';
import { extractNodeEquipment, getEquipmentSummaryFromNodes } from '@/hooks/equipment/utils/nodeEquipmentExtractor';
import { 
  filterEquipment, 
  getAvailableEquipmentCount
} from '@/utils/equipmentNormalizer';

interface CompactJobEquipmentPanelProps {
  jobId: string;
  jobName: string;
  nodes: Node[];
  edges: Edge[];
}

const CompactJobEquipmentPanel: React.FC<CompactJobEquipmentPanelProps> = ({ 
  jobId, 
  jobName, 
  nodes,
  edges,
}) => {
  const { data, getDeployedEquipment } = useInventory();
  
  // Find "Midland Office" or default location as the initial selection
  const defaultLocation = data.storageLocations.find(loc => 
    loc.name.toLowerCase().includes('midland') || loc.isDefault
  ) || data.storageLocations[0];
  
  const [selectedLocation, setSelectedLocation] = useState<string>(defaultLocation?.id || '');
  const [autoAllocationEnabled, setAutoAllocationEnabled] = useState(false);
  
  // Reset to Midland Office when storage locations change
  useEffect(() => {
    const midlandOffice = data.storageLocations.find(loc => 
      loc.name.toLowerCase().includes('midland') || loc.isDefault
    ) || data.storageLocations[0];
    
    if (midlandOffice && (!selectedLocation || !data.storageLocations.find(loc => loc.id === selectedLocation))) {
      setSelectedLocation(midlandOffice.id);
    }
  }, [data.storageLocations, selectedLocation]);
  
  // Debug equipment state
  useEquipmentDebugger();
  
  // Get cleanup functions
  const { cleanupIncorrectDeployments } = useEquipmentCleanup();
  
  // Get sync data
  const {
    conflicts,
    allocations,
    getEquipmentStatus,
    getJobEquipment,
    resolveConflict,
    syncInventoryStatus
  } = useUnifiedEquipmentSync();
  
  const {
    performComprehensiveAllocation,
    returnAllJobEquipment,
    validateInventoryConsistency,
    analyzeEquipmentUsage,
    generateEquipmentReport,
    isProcessing
  } = useRobustEquipmentTracking(jobId, nodes, edges);

  const usage = analyzeEquipmentUsage();
  const report = generateEquipmentReport(usage);
  
  // Get actual equipment assignments from nodes
  const nodeEquipment = extractNodeEquipment(nodes);
  const equipmentSummary = getEquipmentSummaryFromNodes(nodes);
  
  // Get deployed equipment using unified inventory method - filter by jobId
  const deployedEquipment = getDeployedEquipment().filter(item => item.jobId === jobId);
  
  const isConsistent = validateInventoryConsistency();
  
  // Get real-time job equipment
  const jobEquipmentIds = getJobEquipment(jobId);
  const jobConflicts = conflicts.filter(c => c.requestedJobId === jobId || c.currentJobId === jobId);

  // Enhanced availability check with detailed feedback
  const checkDetailedAvailability = () => {
    const availabilityReport = {
      available: true,
      issues: [] as string[],
      warnings: [] as string[],
      totalRequired: 0,
      totalAvailable: 0,
    };
    
    // Check cables
    if (usage.cables && typeof usage.cables === 'object') {
      Object.entries(usage.cables).forEach(([typeId, details]) => {
      // Check individual equipment using unified inventory (check both typeId and equipmentTypeId for compatibility)
      // Also check against typeName since database may store display names
      const available = data.individualEquipment
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
      
      availabilityReport.totalRequired += details.quantity;
      availabilityReport.totalAvailable += available;
      
      if (available < details.quantity) {
        availabilityReport.available = false;
        availabilityReport.issues.push(`${details.typeName}: need ${details.quantity}, have ${available}`);
      } else if (available === details.quantity) {
        availabilityReport.warnings.push(`${details.typeName}: exact match (${available})`);
      }
    });
    }

    // Check other equipment
    const equipmentChecks = [
      { typeId: 'pressure-gauge-1502', typeName: '1502 Pressure Gauge', quantity: usage.gauges1502, name: '1502 Pressure Gauge' },
      { typeId: 'pressure-gauge-pencil', typeName: 'Pencil Gauge', quantity: usage.pencilGauges, name: 'Pencil Gauge' },
      { typeId: 'y-adapter', typeName: 'Y-Adapter', quantity: usage.adapters, name: 'Y Adapter' },
      { typeId: 'customer-computer', typeName: 'Customer Computer', quantity: usage.computers, name: 'Customer Computer' },
      { typeId: 'starlink', typeName: 'Starlink', quantity: usage.satellite, name: 'Starlink' },
      { typeId: 'shearstream-box', typeName: 'ShearStream Box', quantity: usage.shearstreamBoxes, name: 'ShearStream Box' },
    ];

    equipmentChecks.forEach(({ typeId, typeName, quantity, name }) => {
      if (quantity > 0) {
        // Check individual equipment using unified inventory (check both typeId and equipmentTypeId for compatibility)
        // Also check against typeName since database may store display names
        const available = data.individualEquipment
          .filter(item => {
            // Check if Type field matches the display name OR typeId/equipmentTypeId matches the ID
            const typeMatch = item.Type === typeName || 
                            item.typeId === typeId || 
                            item.equipmentTypeId === typeId ||
                            item.Type === typeId;
            const statusMatch = item.status === 'available';
            const locationMatch = isEquipmentAtLocation(item, selectedLocation, 'storage');
            return typeMatch && statusMatch && locationMatch;
          })
          .length;
        
        availabilityReport.totalRequired += quantity;
        availabilityReport.totalAvailable += available;
        
        if (available < quantity) {
          availabilityReport.available = false;
          availabilityReport.issues.push(`${name}: need ${quantity}, have ${available}`);
        }
      }
    });

    return availabilityReport;
  };

  const availability = selectedLocation ? checkDetailedAvailability() : { 
    available: false, 
    issues: ['No location selected'], 
    warnings: [],
    totalRequired: 0,
    totalAvailable: 0,
  };

  const handleQuickAllocation = async () => {
    if (!selectedLocation) {
      toast.error('Please select a storage location first');
      return;
    }

    if (!availability.available) {
      toast.error(`Cannot allocate: ${availability.issues.join(', ')}`);
      return;
    }

    try {
      await performComprehensiveAllocation(selectedLocation);
      toast.success('Equipment allocated successfully!');
    } catch (error) {
      toast.error('Failed to allocate equipment');
      console.error('Allocation error:', error);
    }
  };

  const handleValidateAndFix = () => {
    toast.info('Validating equipment allocation...');
    
    const isValid = validateInventoryConsistency();
    
    // Check for specific issues
    const issues = [];
    
    // Check if all required equipment is allocated
    const requiredButNotAllocated = Object.entries(usage.equipment).filter(([_, details]) => {
      const allocatedCount = deployedEquipment.filter(item => item.typeId === details.typeId).length;
      return details.quantity > allocatedCount;
    });
    
    if (requiredButNotAllocated.length > 0) {
      issues.push(`Missing ${requiredButNotAllocated.length} required equipment types`);
    }
    
    // Check for conflicts
    if (jobConflicts.length > 0) {
      issues.push(`${jobConflicts.length} equipment conflicts detected`);
    }
    
    // Check sync status
    if (!isConsistent) {
      issues.push('Database sync issues detected');
    }
    
    if (isValid && issues.length === 0) {
      toast.success('✅ Equipment allocation is valid and consistent');
    } else if (issues.length > 0) {
      toast.error('Validation failed:', {
        description: issues.join(', ')
      });
    } else {
      toast.warning('Inconsistencies detected - check equipment panel for details');
    }
  };

  const getStatusColor = () => {
    if (!isConsistent) return 'text-foreground';
    if (deployedEquipment.length === 0) return 'text-muted-foreground';
    return 'text-foreground';
  };

  const getStatusIcon = () => {
    if (isProcessing) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (!isConsistent) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (deployedEquipment.length === 0) return <Package className="h-4 w-4 text-muted-foreground" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className="space-y-4 h-full overflow-y-auto">
      <Card className="bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span className="flex items-center gap-2">
              {getStatusIcon()}
              Equipment Status
              <Badge variant="secondary" className="text-xs">
                {deployedEquipment.length} deployed
              </Badge>
            </span>
            <div className="flex items-center gap-2">
              {jobConflicts.length > 0 && (
                <ConflictIndicator 
                  conflicts={jobConflicts} 
                  onResolveConflict={resolveConflict}
                  className="text-xs"
                />
              )}
              {!isConsistent && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Sync Issue
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Status Overview */}
          <div className="bg-card p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-blue-900">Assigned Equipment</span>
              <Badge variant="outline" className="text-xs">
                {nodeEquipment.filter(e => e.equipmentId).length} / {nodeEquipment.length} assigned
              </Badge>
            </div>
            <div className="space-y-2 text-sm text-foreground">
              {/* ShearStream Boxes */}
              {equipmentSummary.shearstreamBoxes.length > 0 && (
                <div>
                  <span className="font-medium">ShearStream Box:</span>
                  <div className="ml-4">
                    {equipmentSummary.shearstreamBoxes.map(id => (
                      <Badge key={id} variant="secondary" className="mr-1 text-xs">
                        {id}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Y-Adapters */}
              {equipmentSummary.yAdapters.length > 0 && (
                <div>
                  <span className="font-medium">Y-Adapters:</span>
                  <div className="ml-4">
                    {equipmentSummary.yAdapters.map(id => (
                      <Badge key={id} variant="secondary" className="mr-1 text-xs">
                        {id}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Computers */}
              {equipmentSummary.computers.length > 0 && (
                <div>
                  <span className="font-medium">Computers:</span>
                  <div className="ml-4">
                    {equipmentSummary.computers.map(id => (
                      <Badge key={id} variant="secondary" className="mr-1 text-xs">
                        {id}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Satellites */}
              {equipmentSummary.satellites.length > 0 && (
                <div>
                  <span className="font-medium">Starlink:</span>
                  <div className="ml-4">
                    {equipmentSummary.satellites.map(id => (
                      <Badge key={id} variant="secondary" className="mr-1 text-xs">
                        {id}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Gauges */}
              {equipmentSummary.gauges.length > 0 && (
                <div>
                  <span className="font-medium">Gauges:</span>
                  <div className="ml-4">
                    {equipmentSummary.gauges.map(id => (
                      <Badge key={id} variant="secondary" className="mr-1 text-xs">
                        {id}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Unassigned nodes */}
              {equipmentSummary.unassigned.length > 0 && (
                <div>
                  <span className="font-medium text-yellow-600">Unassigned:</span>
                  <div className="ml-4 text-xs text-muted-foreground">
                    {equipmentSummary.unassigned.map((desc, idx) => (
                      <div key={idx}>{desc}</div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Show if nothing is assigned */}
              {nodeEquipment.filter(e => e.equipmentId).length === 0 && (
                <div className="text-muted-foreground text-xs">
                  No equipment assigned to nodes
                </div>
              )}
            </div>
          </div>

          {/* Location Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Allocation Source Location</label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {data.storageLocations.map(location => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Availability Status */}
          {selectedLocation && (
            <div className={`p-3 rounded-lg ${availability.available ? 'bg-card' : 'bg-card'}`}>
              <div className="flex items-center gap-2 mb-2">
                {availability.available ? (
                  <CheckCircle className="h-4 w-4 text-foreground" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
                <span className={`font-medium ${availability.available ? 'text-green-900' : 'text-red-900'}`}>
                  {availability.available ? 'Ready to Allocate' : 'Cannot Allocate'}
                </span>
              </div>
              {availability.issues.length > 0 && (
                <div className="text-sm text-destructive space-y-1">
                  {availability.issues.slice(0, 3).map((issue, idx) => (
                    <div key={idx}>• {issue}</div>
                  ))}
                  {availability.issues.length > 3 && (
                    <div>... and {availability.issues.length - 3} more issues</div>
                  )}
                </div>
              )}
              {availability.warnings.length > 0 && (
                <div className="text-sm text-foreground mt-1">
                  <div>⚠️ {availability.warnings.length} warnings</div>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Quick Actions */}
          <div className="space-y-2">
            <Button
              onClick={handleQuickAllocation}
              className="w-full"
              disabled={!selectedLocation || isProcessing || !availability.available}
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Allocating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Quick Allocate All
                </span>
              )}
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={handleValidateAndFix}
                disabled={isProcessing}
                size="sm"
                title="Check equipment allocation for issues"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Check Status
              </Button>
              <Button
                variant="destructive"
                onClick={returnAllJobEquipment}
                disabled={isProcessing || deployedEquipment.length === 0}
                size="sm"
              >
                Return All
              </Button>
            </div>
            
            <Button
              variant="outline"
              onClick={() => cleanupIncorrectDeployments(jobId)}
              disabled={isProcessing}
              size="sm"
              title="Fix incorrect deployments"
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-1" />
              Fix Incorrect Deployments
            </Button>
          </div>

          {/* Currently Deployed Summary with Real-time Status */}
          {deployedEquipment.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Deployed Equipment
                  </h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => syncInventoryStatus()}
                    className="h-6 px-2"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Sync
                  </Button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {deployedEquipment.slice(0, 5).map(item => {
                    const equipmentType = data.equipmentTypes.find(type => type.id === item.equipmentTypeId);
                    const status = getEquipmentStatus(item.id);
                    return (
                      <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-card rounded">
                        <span className="truncate">{equipmentType?.name || 'Unknown'}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">1</Badge>
                          {status === 'deployed' && (
                            <CheckCircle className="h-3 w-3 text-foreground" />
                          )}
                          {status === 'allocated' && (
                            <AlertCircle className="h-3 w-3 text-foreground" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {deployedEquipment.length > 5 && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      ... and {deployedEquipment.length - 5} more items
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompactJobEquipmentPanel;
