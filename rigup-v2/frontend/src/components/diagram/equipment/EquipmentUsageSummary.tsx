
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, RefreshCw } from 'lucide-react';

interface DetailedEquipmentUsage {
  cables: {
    [typeId: string]: {
      typeName: string;
      quantity: number;
      category: string;
    };
  };
  gauges: number;
  gauges1502: number;
  pencilGauges: number;
  adapters: number;
  computers: number;
  satellite: number;
  directConnections: number;
  totalConnections: number;
}

interface EquipmentUsageSummaryProps {
  equipmentUsage?: DetailedEquipmentUsage;
  isAutoSyncEnabled: boolean;
  onAutoAllocate?: (locationId: string) => void;
  selectedLocation: string;
}

const EquipmentUsageSummary: React.FC<EquipmentUsageSummaryProps> = ({
  equipmentUsage,
  isAutoSyncEnabled,
  onAutoAllocate,
  selectedLocation
}) => {
  if (!equipmentUsage) return null;

  return (
    <div>
      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
        <Activity className="h-4 w-4" />
        Equipment Required from Diagram
      </h4>
      <div className="space-y-2 p-3 bg-muted rounded-lg">
        {Object.entries(equipmentUsage.cables).map(([typeId, details]) => (
          <div key={typeId} className="flex justify-between text-sm">
            <span className="truncate">{details.typeName}:</span>
            <Badge variant="secondary">{details.quantity}</Badge>
          </div>
        ))}
        {equipmentUsage.gauges1502 > 0 && (
          <div className="flex justify-between text-sm">
            <span>1502 Pressure Gauge:</span>
            <Badge variant="secondary">{equipmentUsage.gauges1502}</Badge>
          </div>
        )}
        {equipmentUsage.pencilGauges > 0 && (
          <div className="flex justify-between text-sm">
            <span>Pencil Gauge:</span>
            <Badge variant="secondary">{equipmentUsage.pencilGauges}</Badge>
          </div>
        )}
        {equipmentUsage.adapters > 0 && (
          <div className="flex justify-between text-sm">
            <span>Y Adapters:</span>
            <Badge variant="secondary">{equipmentUsage.adapters}</Badge>
          </div>
        )}
        {equipmentUsage.computers > 0 && (
          <div className="flex justify-between text-sm">
            <span>Customer Computer:</span>
            <Badge variant="secondary">{equipmentUsage.computers}</Badge>
          </div>
        )}
        {equipmentUsage.satellite > 0 && (
          <div className="flex justify-between text-sm">
            <span>Starlink:</span>
            <Badge variant="secondary">{equipmentUsage.satellite}</Badge>
          </div>
        )}
        {equipmentUsage.directConnections > 0 && (
          <div className="flex justify-between text-sm">
            <span>Direct Connections:</span>
            <Badge variant="outline">{equipmentUsage.directConnections}</Badge>
          </div>
        )}
        
        <div className="pt-2 border-t">
          <div className="flex justify-between text-sm font-medium">
            <span>Total Connections:</span>
            <Badge>{equipmentUsage.totalConnections}</Badge>
          </div>
        </div>

        {!isAutoSyncEnabled && onAutoAllocate && selectedLocation && (
          <Button
            onClick={() => onAutoAllocate(selectedLocation)}
            size="sm"
            className="w-full mt-2"
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Manually Sync Equipment
          </Button>
        )}
      </div>
    </div>
  );
};

export default EquipmentUsageSummary;
