import React from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { safeForEach, safeFind } from '@/utils/safeDataAccess';

export function DebugEquipmentInfo() {
  const { data } = useInventory();
  
  // Group equipment by type
  const equipmentByType: Record<string, { bulk: number, individual: number }> = {};
  
  // Count bulk equipment
  safeForEach(data.equipmentItems, item => {
    if (!equipmentByType[item.typeId]) {
      equipmentByType[item.typeId] = { bulk: 0, individual: 0 };
    }
    if (item.status === 'available') {
      equipmentByType[item.typeId].bulk += item.quantity;
    }
  });
  
  // Count individual equipment
  safeForEach(data.individualEquipment, item => {
    if (!equipmentByType[item.typeId]) {
      equipmentByType[item.typeId] = { bulk: 0, individual: 0 };
    }
    if (item.status === 'available') {
      equipmentByType[item.typeId].individual += 1;
    }
  });
  
  // Get equipment types
  const getTypeName = (typeId: string) => {
    const type = safeFind(data.equipmentTypes, t => t.id === typeId);
    return type?.name || 'Unknown';
  };
  
  const criticalTypes = [
    'pressure-gauge-1502',
    'customer-computer',
    'starlink',
    'y-adapter',
    '100ft-cable',
    '200ft-cable',
    '300ft-cable-new',
    'shearstream-box'
  ];
  
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">Debug: Equipment Availability by Type ID</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground mb-3">
            Showing available equipment counts by type ID:
          </div>
          {criticalTypes.map(typeId => {
            const counts = equipmentByType[typeId] || { bulk: 0, individual: 0 };
            const total = counts.bulk + counts.individual;
            const typeName = getTypeName(typeId);
            
            return (
              <div key={typeId} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs font-mono">{typeId}</Badge>
                  <span className="text-sm font-medium">{typeName}</span>
                </div>
                <div className="flex items-center gap-2">
                  {counts.bulk > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Bulk: {counts.bulk}
                    </Badge>
                  )}
                  {counts.individual > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Individual: {counts.individual}
                    </Badge>
                  )}
                  <Badge variant={total > 0 ? 'default' : 'destructive'} className="text-xs">
                    Total: {total}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
        <Alert className="mt-4 bg-muted border-border">
          <AlertDescription className="text-xs">
            <strong>Note:</strong> Equipment must have status "available" and be in the selected location to be allocatable.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}