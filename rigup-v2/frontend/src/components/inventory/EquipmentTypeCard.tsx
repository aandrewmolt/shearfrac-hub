
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Package } from 'lucide-react';
import { EquipmentType, IndividualEquipment, StorageLocation } from '@/types/inventory';
import IndividualEquipmentManager from './IndividualEquipmentManager';

interface EquipmentTypeCardProps {
  type: EquipmentType;
  individualItems: IndividualEquipment[];
  draftCount: number;
  storageLocations: StorageLocation[];
  selectedTypeForDetails: EquipmentType | null;
  onEdit: (type: EquipmentType) => void;
  onDelete: (typeId: string) => void;
  onToggleDetails: (type: EquipmentType | null) => void;
  onDraftCountChange: (typeId: string, count: number) => void;
  getCategoryColor: (category: string) => string;
}

const EquipmentTypeCard: React.FC<EquipmentTypeCardProps> = ({
  type,
  individualItems,
  draftCount,
  storageLocations,
  selectedTypeForDetails,
  onEdit,
  onDelete,
  onToggleDetails,
  onDraftCountChange,
  getCategoryColor,
}) => {
  const totalIndividualCount = individualItems.length + draftCount;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-lg flex items-center gap-2">
            {type.name}
            <Badge variant="outline" className="text-xs">
              <Package className="h-3 w-3 mr-1" />
              Individual Items
            </Badge>
          </h3>
          {type.description && (
            <p className="text-sm text-muted-foreground">{type.description}</p>
          )}
        </div>
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(type)}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(type.id)}
            disabled={totalIndividualCount > 0}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <Badge className={getCategoryColor(type.category)}>
          {type.category}
        </Badge>
        <div className="text-sm font-medium text-muted-foreground">
          <span>
            {individualItems.length} saved
            {draftCount > 0 && (
              <span className="text-foreground"> + {draftCount} draft</span>
            )}
            {' = '}
            <span className="font-bold">{totalIndividualCount} total items</span>
          </span>
        </div>
      </div>

      <div className="mt-4 border-t pt-4">
        <IndividualEquipmentManager 
          equipmentType={type}
          storageLocations={storageLocations}
          onDraftCountChange={(count) => onDraftCountChange(type.id, count)}
        />
      </div>
    </div>
  );
};

export default EquipmentTypeCard;
