import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { useUnifiedEquipmentSync } from '@/hooks/useUnifiedEquipmentSync';
import { Progress } from '@/components/ui/progress';

const EquipmentSyncStatus: React.FC = () => {
  const { 
    isValidating, 
    conflicts, 
    allocations, 
    syncInventoryStatus,
    resolveConflict 
  } = useUnifiedEquipmentSync();

  const totalAllocations = allocations?.size || 0;
  const activeConflicts = conflicts?.length || 0;
  const allocatedCount = allocations ? Array.from(allocations.values()).filter(a => a.status === 'allocated').length : 0;
  const deployedCount = allocations ? Array.from(allocations.values()).filter(a => a.status === 'deployed').length : 0;

  useEffect(() => {
    // Auto-sync on mount
    syncInventoryStatus();
  }, [syncInventoryStatus]);

  const handleResolveAllConflicts = async () => {
    // Resolve all conflicts in favor of the most recent request
    for (const conflict of conflicts) {
      await resolveConflict(conflict, 'requested');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Equipment Sync Status
            {isValidating && <RefreshCw className="h-4 w-4 animate-spin" />}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={syncInventoryStatus}
            disabled={isValidating}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Now
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sync Status Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{totalAllocations}</div>
            <div className="text-sm text-corporate-silver">Total Allocations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{deployedCount}</div>
            <div className="text-sm text-corporate-silver">Deployed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{allocatedCount}</div>
            <div className="text-sm text-corporate-silver">Allocated</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Deployment Progress</span>
            <span>{deployedCount} / {totalAllocations}</span>
          </div>
          <Progress 
            value={totalAllocations > 0 ? (deployedCount / totalAllocations) * 100 : 0} 
            className="h-2"
          />
        </div>

        {/* Conflicts Alert */}
        {activeConflicts > 0 && (
          <div className="p-3 bg-status-danger/20 border border-border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div>
                  <div className="font-medium text-red-900">
                    {activeConflicts} Equipment Conflict{activeConflicts > 1 ? 's' : ''}
                  </div>
                  <div className="text-sm text-destructive">
                    Equipment is double-booked across jobs
                  </div>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleResolveAllConflicts}
              >
                Resolve All
              </Button>
            </div>
          </div>
        )}

        {/* Status Indicators */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {activeConflicts === 0 ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">No conflicts detected</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Conflicts need resolution</span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isValidating ? (
              <>
                <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                <span className="text-sm">Validating equipment status...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Sync complete</span>
              </>
            )}
          </div>
        </div>

        {/* Recent Allocations */}
        {totalAllocations > 0 && (
          <div className="pt-2 border-t">
            <h4 className="text-sm font-medium mb-2">Recent Allocations</h4>
            <div className="space-y-1">
              {allocations && Array.from(allocations.entries()).slice(0, 3).map(([id, allocation]) => (
                <div key={id} className="flex items-center justify-between text-sm">
                  <span className="text-corporate-silver">{allocation.jobName}</span>
                  <Badge variant="outline" className="text-xs">
                    {allocation.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EquipmentSyncStatus;