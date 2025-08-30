
import React from 'react';
import { IndividualEquipment, StorageLocation } from '@/types/inventory';
import EnhancedEquipmentCard from './EnhancedEquipmentCard';

interface EquipmentGridProps {
  equipment: IndividualEquipment[];
  draftEquipment: IndividualEquipment[];
  onEdit: (equipment: IndividualEquipment) => void;
  onDelete: (equipmentId: string) => void;
  onStatusChange: (equipmentId: string, status: string) => void;
  onLocationChange: (equipmentId: string, locationId: string) => void;
  getStatusColor: (status: string) => string;
  getLocationName: (locationId: string) => string;
  storageLocations: StorageLocation[];
}

const EquipmentGrid: React.FC<EquipmentGridProps> = ({
  equipment,
  draftEquipment,
  onEdit,
  onDelete,
  onStatusChange,
  onLocationChange,
  getStatusColor,
  getLocationName,
  storageLocations,
}) => {
  if (equipment.length === 0 && draftEquipment.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No equipment found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {/* Draft equipment first */}
      {draftEquipment.map((item) => (
        <EnhancedEquipmentCard
          key={item.id}
          equipment={item}
          storageLocations={storageLocations}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onLocationChange={onLocationChange}
          getStatusColor={getStatusColor}
          getLocationName={getLocationName}
          isDraft={true}
        />
      ))}
      
      {/* Regular equipment */}
      {equipment.map((item) => (
        <EnhancedEquipmentCard
          key={item.id}
          equipment={item}
          storageLocations={storageLocations}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onLocationChange={onLocationChange}
          getStatusColor={getStatusColor}
          getLocationName={getLocationName}
          isDraft={false}
        />
      ))}
    </div>
  );
};

export default EquipmentGrid;
