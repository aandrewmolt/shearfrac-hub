
import React from 'react';
import { CardContent } from '@/components/ui/card';
import EquipmentTypeItem from './EquipmentTypeItem';

interface EquipmentTypeGridProps {
  filteredTypes: unknown[];
  data: {
    equipmentTypes: Array<{ id: string; name: string; category: string; }>;
  };
  canDeleteEquipmentType: (typeId: string) => { canDelete: boolean; reason?: string; details?: string[] };
  getEquipmentCountForType: (typeId: string) => {
    equipmentItems: number;
    individualEquipment: number;
    totalQuantity: number;
  };
  getCategoryColor: (category: string) => string;
  onEdit: (type: { id: string; name: string; category: string; }) => void;
  onDelete: (typeId: string, typeName: string) => void;
}

const EquipmentTypeGrid: React.FC<EquipmentTypeGridProps> = ({
  filteredTypes,
  data,
  canDeleteEquipmentType,
  getEquipmentCountForType,
  getCategoryColor,
  onEdit,
  onDelete,
}) => {
  return (
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTypes.map((type) => {
          const equipmentCounts = getEquipmentCountForType(type.id);
          const { canDelete, details } = canDeleteEquipmentType(type.id);
          
          return (
            <EquipmentTypeItem
              key={type.id}
              type={type}
              equipmentCounts={equipmentCounts}
              canDelete={canDelete}
              deleteDetails={details}
              onEdit={onEdit}
              onDelete={onDelete}
              getCategoryColor={getCategoryColor}
            />
          );
        })}
      </div>
      
      {filteredTypes.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No equipment types found.</p>
        </div>
      )}
    </CardContent>
  );
};

export default EquipmentTypeGrid;
