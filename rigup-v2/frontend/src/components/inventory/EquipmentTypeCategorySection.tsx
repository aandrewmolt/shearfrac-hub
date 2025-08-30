
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EquipmentType, IndividualEquipment, StorageLocation } from '@/types/inventory';
import EquipmentTypeCard from './EquipmentTypeCard';

interface EquipmentTypeCategorySectionProps {
  category: string;
  types: EquipmentType[];
  individualEquipment: IndividualEquipment[];
  storageLocations: StorageLocation[];
  draftCounts: { [typeId: string]: number };
  selectedTypeForDetails: EquipmentType | null;
  onEdit: (type: EquipmentType) => void;
  onDelete: (typeId: string) => void;
  onToggleDetails: (type: EquipmentType | null) => void;
  onDraftCountChange: (typeId: string, count: number) => void;
  getCategoryColor: (category: string) => string;
}

const EquipmentTypeCategorySection: React.FC<EquipmentTypeCategorySectionProps> = ({
  category,
  types,
  individualEquipment,
  storageLocations,
  draftCounts,
  selectedTypeForDetails,
  onEdit,
  onDelete,
  onToggleDetails,
  onDraftCountChange,
  getCategoryColor,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="capitalize flex items-center">
          {category}
          <Badge className={`ml-2 ${getCategoryColor(category)}`}>
            {types.length} types
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6">
          {types.map(type => {
            const individualItems = individualEquipment.filter(eq => eq.typeId === type.id);
            const draftCount = draftCounts[type.id] || 0;

            return (
              <EquipmentTypeCard
                key={type.id}
                type={type}
                individualItems={individualItems}
                draftCount={draftCount}
                storageLocations={storageLocations}
                selectedTypeForDetails={selectedTypeForDetails}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleDetails={onToggleDetails}
                onDraftCountChange={onDraftCountChange}
                getCategoryColor={getCategoryColor}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default EquipmentTypeCategorySection;
