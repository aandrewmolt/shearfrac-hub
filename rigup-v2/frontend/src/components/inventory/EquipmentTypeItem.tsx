
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, AlertTriangle, Info } from 'lucide-react';

interface EquipmentTypeItemProps {
  type: { id: string; name: string; category: string; description?: string; };
  equipmentCounts: {
    equipmentItems: number;
    individualEquipment: number;
    totalQuantity: number;
  };
  canDelete: boolean;
  deleteDetails?: string[];
  onEdit: (type: { id: string; name: string; category: string; description?: string; }) => void;
  onDelete: (typeId: string, typeName: string) => void;
  getCategoryColor: (category: string) => string;
}

const EquipmentTypeItem: React.FC<EquipmentTypeItemProps> = ({
  type,
  equipmentCounts,
  canDelete,
  deleteDetails,
  onEdit,
  onDelete,
  getCategoryColor,
}) => {
  const totalItems = equipmentCounts.equipmentItems + equipmentCounts.individualEquipment;
  
  const getDeleteTooltip = () => {
    if (canDelete) return "Delete equipment type";
    
    let tooltip = "Cannot delete - has linked equipment:\n";
    if (deleteDetails && deleteDetails.length > 0) {
      tooltip += deleteDetails.map(detail => `• ${detail}`).join('\n');
      tooltip += "\n\nGo to the Inventory tab to remove or reassign equipment first.";
    }
    return tooltip;
  };

  return (
    <Card key={type.id} className="border border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-sm">{type.name}</h3>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(type)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(type.id, type.name)}
              disabled={!canDelete}
              className={canDelete ? "hover:text-destructive" : "opacity-50 cursor-not-allowed"}
              title={getDeleteTooltip()}
            >
              {!canDelete && <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />}
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <Badge className={getCategoryColor(type.category)}>
            {type.category}
          </Badge>
          
          {!canDelete && deleteDetails && deleteDetails.length > 0 && (
            <div className="text-xs bg-muted border border-amber-200 rounded p-2">
              <div className="flex items-center gap-1 text-amber-700 font-medium mb-1">
                <Info className="h-3 w-3" />
                Cannot delete - has linked equipment:
              </div>
              <ul className="text-amber-600 space-y-1">
                {deleteDetails.map((detail, index) => (
                  <li key={index} className="ml-2">• {detail}</li>
                ))}
              </ul>
              <div className="text-amber-600 mt-1 text-xs">
                Remove equipment from the Inventory tab first.
              </div>
            </div>
          )}
          
          {totalItems > 0 && (
            <div className="text-xs text-foreground font-medium">
              {equipmentCounts.equipmentItems > 0 && (
                <div>{equipmentCounts.equipmentItems} item records ({equipmentCounts.totalQuantity} total)</div>
              )}
              {equipmentCounts.individualEquipment > 0 && (
                <div>{equipmentCounts.individualEquipment} individual items</div>
              )}
            </div>
          )}
          
          {type.description && (
            <p className="text-xs text-muted-foreground">{type.description}</p>
          )}
          
          {type.defaultIdPrefix && (
            <div className="text-xs text-muted-foreground">
              Prefix: {type.defaultIdPrefix}
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            Individual Tracking: Yes
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EquipmentTypeItem;
