
import React from 'react';
import { Package } from 'lucide-react';
import ExtraEquipmentItem from './ExtraEquipmentItem';

interface ExtraEquipmentListProps {
  extrasOnLocation: Array<{
    id: string;
    equipmentTypeId: string;
    quantity: number;
    reason: string;
    addedDate: Date;
    notes?: string;
    individualEquipmentId?: string;
  }>;
  onRemoveExtra: (extraId: string) => void;
}

const ExtraEquipmentList: React.FC<ExtraEquipmentListProps> = ({
  extrasOnLocation,
  onRemoveExtra,
}) => {
  if (extrasOnLocation.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
        <p className="text-sm">No extra equipment on location</p>
        <p className="text-xs text-muted-foreground mt-1">
          Track additional equipment beyond diagram requirements
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">Extra Equipment:</h4>
      {extrasOnLocation.map(extra => (
        <ExtraEquipmentItem
          key={extra.id}
          extra={extra}
          onRemove={onRemoveExtra}
        />
      ))}
    </div>
  );
};

export default ExtraEquipmentList;
