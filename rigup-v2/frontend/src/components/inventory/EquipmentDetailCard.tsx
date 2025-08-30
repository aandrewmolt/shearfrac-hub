
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, MapPin, AlertTriangle, Briefcase } from 'lucide-react';
import { EquipmentType } from '@/types/inventory';
import { useUnifiedEquipmentSync } from '@/hooks/useUnifiedEquipmentSync';

interface EquipmentDetailCardProps {
  equipmentType: EquipmentType;
  items: EquipmentItem[];
  onMoveEquipment?: (itemId: string, newLocationId: string) => void;
  onRedTag?: (itemId: string) => void;
}

const EquipmentDetailCard: React.FC<EquipmentDetailCardProps> = ({
  equipmentType,
  items,
  onMoveEquipment,
  onRedTag,
}) => {
  const { getEquipmentStatus, allocations } = useUnifiedEquipmentSync();
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const availableQuantity = items
    .filter(item => item.status === 'available')
    .reduce((sum, item) => sum + item.quantity, 0);
  const deployedQuantity = items
    .filter(item => item.status === 'deployed')
    .reduce((sum, item) => sum + item.quantity, 0);
  const redTaggedQuantity = items
    .filter(item => item.status === 'red-tagged')
    .reduce((sum, item) => sum + item.quantity, 0);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cables': return 'bg-muted text-foreground';
      case 'gauges': return 'bg-muted text-foreground';
      case 'adapters': return 'bg-muted text-purple-800';
      case 'communication': return 'bg-muted text-foreground';
      default: return 'bg-muted text-foreground';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{equipmentType.name}</CardTitle>
          <Badge className={getCategoryColor(equipmentType.category)}>
            {equipmentType.category}
          </Badge>
        </div>
        {equipmentType.description && (
          <p className="text-sm text-muted-foreground">{equipmentType.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-foreground" />
            <span>Total: {totalQuantity}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-muted0"></div>
            <span>Available: {availableQuantity}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-muted0"></div>
            <span>Deployed: {deployedQuantity}</span>
          </div>
          {redTaggedQuantity > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span>Red Tagged: {redTaggedQuantity}</span>
            </div>
          )}
        </div>
        
        {items.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Items by Location:</h4>
            {items.map((item) => {
              const allocation = allocations.get(item.id);
              const syncStatus = getEquipmentStatus(item.id);
              
              return (
                <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span>{item.quantity}x</span>
                    <Badge 
                      variant={syncStatus === 'available' ? 'default' : 
                             syncStatus === 'deployed' || syncStatus === 'allocated' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {syncStatus}
                    </Badge>
                    {allocation && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Briefcase className="h-3 w-3" />
                        <span>{allocation.jobName}</span>
                      </div>
                    )}
                  </div>
                  {syncStatus === 'available' && onRedTag && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRedTag(item.id)}
                      className="h-6 px-2 text-xs"
                    >
                      Red Tag
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EquipmentDetailCard;
