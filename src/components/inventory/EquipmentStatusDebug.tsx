import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Bug, Loader2, CheckCircle } from 'lucide-react';
import { useAwsInventory as useInventory } from '@/hooks/useAwsInventory';
import { useAutoFixEquipmentStatus } from '@/hooks/equipment/useAutoFixEquipmentStatus';

const EquipmentStatusDebug: React.FC = () => {
  const { data } = useInventory();
  const { autoFixEquipmentStatus, isFixing, fixedCount } = useAutoFixEquipmentStatus();

  // Group equipment by status
  const statusCounts = data.individualEquipment.reduce((acc, eq) => {
    const status = eq.status || 'NO_STATUS';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Find problematic equipment
  const problematicEquipment = data?.individualEquipment?.filter(eq => 
    !eq.status || eq.status === '' || eq.status === null
  );

  // Equipment that should be available but isn't
  const shouldBeAvailable = data?.individualEquipment?.filter(eq => 
    !eq.jobId && eq.status !== 'available' && eq.status !== 'maintenance' && eq.status !== 'red-tagged' && eq.status !== 'retired'
  );

  return (
    <Card className="bg-card shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bug className="h-5 w-5" />
          Equipment Status Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div>
          <h4 className="text-sm font-medium text-corporate-silver mb-2">Status Distribution</h4>
          <div className="space-y-1 text-sm">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <span>{status}</span>
                <Badge 
                  variant={status === 'available' ? 'default' : status === 'NO_STATUS' ? 'destructive' : 'secondary'}
                >
                  {count}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Problematic Equipment */}
        {problematicEquipment.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-destructive mb-2 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Equipment Without Status ({problematicEquipment.length})
            </h4>
            <div className="space-y-1 text-xs max-h-32 overflow-auto">
              {problematicEquipment.map(eq => (
                <div key={eq.id} className="flex justify-between bg-status-danger/20 p-1 rounded">
                  <span>{eq.equipmentId} - {eq.name}</span>
                  <span className="text-destructive">Status: {String(eq.status) || 'null/empty'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Should Be Available */}
        {shouldBeAvailable.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">
              Equipment That Should Be Available ({shouldBeAvailable.length})
            </h4>
            <div className="space-y-1 text-xs max-h-32 overflow-auto">
              {shouldBeAvailable.map(eq => (
                <div key={eq.id} className="flex justify-between bg-status-warning/20 p-1 rounded">
                  <span>{eq.equipmentId} - {eq.name}</span>
                  <span className="text-foreground">Status: {eq.status || 'none'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Fix Button */}
        {(problematicEquipment.length > 0 || shouldBeAvailable.length > 0) && (
          <div className="pt-2 border-t">
            <p className="text-sm text-destructive mb-2">
              Found {problematicEquipment.length + shouldBeAvailable.length} equipment items with incorrect status!
            </p>
            <Button
              onClick={autoFixEquipmentStatus}
              disabled={isFixing}
              variant="destructive"
              size="sm"
              className="w-full"
            >
              {isFixing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fixing Status...
                </>
              ) : fixedCount > 0 ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Fixed {fixedCount} Items
                </>
              ) : (
                'Auto-Fix Equipment Status'
              )}
            </Button>
            <p className="text-xs text-corporate-silver mt-2">
              This will update all equipment without proper status to 'available'.
            </p>
          </div>
        )}

        {/* All Good */}
        {problematicEquipment.length === 0 && shouldBeAvailable.length === 0 && (
          <div className="text-center py-4 text-foreground">
            ✓ All equipment has proper status values
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EquipmentStatusDebug;