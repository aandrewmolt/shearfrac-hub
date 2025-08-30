
import React from 'react';
import { AlertTriangle, CheckCircle, Info, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useUnifiedInventory } from '@/hooks/useUnifiedInventory';
import { useRealTimeInventory } from '@/hooks/useRealTimeInventory';
import { useAuditTrail } from '@/hooks/useAuditTrail';

interface JobValidationHelperProps {
  jobId: string;
  equipmentUsage: {
    cables: { [key: string]: number };
    gauges: number;
    adapters: number;
    computers: number;
    satellite: number;
  };
  selectedLocationId: string;
}

const JobValidationHelper: React.FC<JobValidationHelperProps> = ({
  jobId,
  equipmentUsage,
  selectedLocationId
}) => {
  const { data } = useUnifiedInventory();
  const { alerts, getInventorySnapshot } = useRealTimeInventory();
  const { getEquipmentMovementHistory, formatAuditEntry } = useAuditTrail();

  const validateJobEquipment = () => {
    const issues: string[] = [];
    const warnings: string[] = [];
    const successes: string[] = [];
    const suggestions: string[] = [];

    // Define type mapping for cable types to equipment type IDs
    const typeMapping: { [key: string]: string } = {
      '100ft': '100ft-cable',
      '200ft': '200ft-cable',
      '300ft': '300ft-cable-new',
    };

    // Check deployed equipment consistency
    const deployedItems = data.equipmentItems.filter(
      item => item.status === 'deployed' && item.jobId === jobId
    );

    if (deployedItems.length === 0) {
      warnings.push('No equipment is currently deployed to this job');
    } else {
      successes.push(`${deployedItems.length} equipment items actively deployed`);
      
      // Check if deployed equipment matches current diagram requirements
      const deployedSummary = deployedItems.reduce((acc, item) => {
        const typeName = data?.equipmentTypes?.find(t => t.id === item.typeId)?.name || 'Unknown';
        acc[typeName] = (acc[typeName] || 0) + item.quantity;
        return acc;
      }, {} as { [key: string]: number });

      // Compare with current requirements
      let totalRequired = 0;
      let totalDeployed = 0;

      Object.entries(equipmentUsage.cables).forEach(([cableType, needed]) => {
        totalRequired += needed;
        const typeId = typeMapping[cableType];
        if (typeId) {
          const typeName = data?.equipmentTypes?.find(t => t.id === typeId)?.name || '';
          const deployed = deployedSummary[typeName] || 0;
          totalDeployed += deployed;
          
          if (deployed !== needed) {
            if (deployed > needed) {
              suggestions.push(`${cableType} cables: ${deployed} deployed vs ${needed} needed (${deployed - needed} excess)`);
            } else {
              issues.push(`${cableType} cables: ${deployed} deployed vs ${needed} needed (${needed - deployed} shortage)`);
            }
          }
        }
      });

      if (totalDeployed === totalRequired && totalRequired > 0) {
        successes.push(`Equipment deployment matches diagram requirements perfectly`);
      }
    }

    // Enhanced inventory availability check
    Object.entries(equipmentUsage.cables).forEach(([cableType, needed]) => {
      const typeId = typeMapping[cableType];
      if (typeId) {
        // Check bulk equipment
        const availableBulk = data.equipmentItems
          .filter(item => item.typeId === typeId && item.locationId === selectedLocationId && item.status === 'available')
          .reduce((sum, item) => sum + item.quantity, 0);
        
        // Check individual equipment
        const availableIndividual = data.individualEquipment
          .filter(item => item.typeId === typeId && item.locationId === selectedLocationId && item.status === 'available')
          .length;
        
        const available = availableBulk + availableIndividual;
        
        const deployed = data.equipmentItems
          .filter(item => item.typeId === typeId && item.jobId === jobId && item.status === 'deployed')
          .reduce((sum, item) => sum + item.quantity, 0);
        
        if (available + deployed < needed) {
          issues.push(`${cableType} cables: need ${needed}, have ${available} available + ${deployed} deployed = ${available + deployed} total`);
        } else if (available < needed && deployed >= needed) {
          warnings.push(`${cableType} cables: sufficient deployed (${deployed}/${needed}) but only ${available} available at location`);
        } else if (available === needed) {
          warnings.push(`${cableType} cables: exact match (no spares available)`);
        } else {
          successes.push(`${cableType} cables: sufficient (${available + deployed}/${needed} total)`);
        }

        // Check recent movement history
        const history = getEquipmentMovementHistory(typeId);
        const recentMovements = history.filter(entry => 
          Date.now() - entry.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
        );
        
        if (recentMovements.length > 3) {
          suggestions.push(`${cableType} cables: High activity (${recentMovements.length} movements in 24h)`);
        }
      }
    });

    // Check other equipment with enhanced validation
    const otherEquipment = [
      { typeId: 'pressure-gauge-1502', needed: equipmentUsage.gauges, name: '1502 Pressure Gauge' },
      { typeId: 'y-adapter', needed: equipmentUsage.adapters, name: 'Y Adapter' },
      { typeId: 'customer-computer', needed: equipmentUsage.computers, name: 'Customer Computer' },
      { typeId: 'starlink', needed: equipmentUsage.satellite, name: 'Starlink' },
    ];

    otherEquipment.forEach(({ typeId, needed, name }) => {
      if (needed > 0) {
        // Check bulk equipment
        const availableBulk = data.equipmentItems
          .filter(item => item.typeId === typeId && item.locationId === selectedLocationId && item.status === 'available')
          .reduce((sum, item) => sum + item.quantity, 0);
        
        // Check individual equipment
        const availableIndividual = data.individualEquipment
          .filter(item => item.typeId === typeId && item.locationId === selectedLocationId && item.status === 'available')
          .length;
        
        const available = availableBulk + availableIndividual;
        
        const deployed = data.equipmentItems
          .filter(item => item.typeId === typeId && item.jobId === jobId && item.status === 'deployed')
          .reduce((sum, item) => sum + item.quantity, 0);
        
        if (available + deployed < needed) {
          issues.push(`${name}: need ${needed}, have ${available} available + ${deployed} deployed = ${available + deployed} total`);
        } else if (deployed >= needed) {
          successes.push(`${name}: fully deployed (${deployed}/${needed})`);
        } else {
          successes.push(`${name}: sufficient (${available + deployed}/${needed} total)`);
        }
      }
    });

    // Include relevant alerts from real-time monitoring
    const relevantAlerts = alerts.filter(alert => 
      alert.equipmentTypeId && 
      (alert.locationId === selectedLocationId || !alert.locationId)
    );

    return { issues, warnings, successes, suggestions, relevantAlerts };
  };

  const { issues, warnings, successes, suggestions, relevantAlerts } = validateJobEquipment();
  const snapshot = getInventorySnapshot();

  if (issues.length === 0 && warnings.length === 0 && successes.length === 0 && relevantAlerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Real-time system status */}
      {snapshot.criticalAlerts > 0 && (
        <Alert className="border-red-200 bg-muted">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            <div className="font-medium mb-1">System Alerts:</div>
            <div className="text-sm">{snapshot.criticalAlerts} critical inventory issues detected</div>
          </AlertDescription>
        </Alert>
      )}

      {/* Equipment Issues */}
      {issues.length > 0 && (
        <Alert className="border-red-200 bg-muted">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            <div className="flex items-center gap-2 font-medium mb-1">
              Equipment Issues
              <Badge variant="destructive" className="text-xs">{issues.length}</Badge>
            </div>
            <ul className="text-sm space-y-1">
              {issues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert className="border-border bg-muted">
          <Info className="h-4 w-4 text-foreground" />
          <AlertDescription className="text-foreground">
            <div className="flex items-center gap-2 font-medium mb-1">
              Warnings
              <Badge variant="outline" className="text-xs border-border">{warnings.length}</Badge>
            </div>
            <ul className="text-sm space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>• {warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Alert className="border-border bg-muted">
          <Info className="h-4 w-4 text-foreground" />
          <AlertDescription className="text-foreground">
            <div className="flex items-center gap-2 font-medium mb-1">
              Optimization Suggestions
              <Badge variant="outline" className="text-xs border-border">{suggestions.length}</Badge>
            </div>
            <ul className="text-sm space-y-1">
              {suggestions.map((suggestion, index) => (
                <li key={index}>• {suggestion}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Status */}
      {successes.length > 0 && issues.length === 0 && (
        <Alert className="border-border bg-muted">
          <CheckCircle className="h-4 w-4 text-foreground" />
          <AlertDescription className="text-foreground">
            <div className="flex items-center gap-2 font-medium mb-1">
              Equipment Status: Optimal
              <Badge className="text-xs bg-muted text-foreground border-border">
                <Clock className="h-3 w-3 mr-1" />
                Live
              </Badge>
            </div>
            <ul className="text-sm space-y-1">
              {successes.slice(0, 3).map((success, index) => (
                <li key={index}>• {success}</li>
              ))}
              {successes.length > 3 && <li>• ...and {successes.length - 3} more items verified</li>}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Relevant system alerts */}
      {relevantAlerts.length > 0 && (
        <Alert className="border-accent bg-accent/10">
          <Info className="h-4 w-4 text-accent" />
          <AlertDescription className="text-accent">
            <div className="font-medium mb-1">System Monitoring:</div>
            <ul className="text-sm space-y-1">
              {relevantAlerts.slice(0, 2).map((alert, index) => (
                <li key={index}>• {alert.message}</li>
              ))}
              {relevantAlerts.length > 2 && <li>• ...and {relevantAlerts.length - 2} more alerts</li>}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default JobValidationHelper;
