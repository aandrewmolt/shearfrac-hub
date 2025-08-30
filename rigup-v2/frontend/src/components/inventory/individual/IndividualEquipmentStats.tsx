
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { IndividualEquipment } from '@/types/inventory';

interface IndividualEquipmentStatsProps {
  equipment: IndividualEquipment[];
}

const IndividualEquipmentStats: React.FC<IndividualEquipmentStatsProps> = ({ equipment }) => {
  if (equipment.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground mb-2">Existing Items:</div>
        <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
          {equipment.slice(0, 5).map((item, index) => (
            <div key={item.id || item.equipmentId || `stat-${index}`} className="flex justify-between text-xs p-1 bg-muted rounded">
              <span>{item.equipmentId}</span>
              <Badge variant="outline" className="text-xs px-1">
                {item.status}
              </Badge>
            </div>
          ))}
          {equipment.length > 5 && (
            <div className="text-xs text-muted-foreground text-center">
              +{equipment.length - 5} more...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default IndividualEquipmentStats;
