
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useAwsEquipmentTypes } from '@/hooks/useAwsEquipmentTypes';
import { toast } from 'sonner';
import EquipmentTypeManagerHeader from './EquipmentTypeManagerHeader';
import EquipmentTypeTable from './EquipmentTypeTable';
import { EquipmentType, CreateEquipmentTypeInput } from '@/types/types';

const EquipmentTypeManager = () => {
  const { equipmentTypes, loading, createEquipmentType, deleteEquipmentType } = useAwsEquipmentTypes();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<EquipmentType | null>(null);

  const filteredTypes = equipmentTypes.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'control-units': return 'bg-primary/20 text-primary';
      case 'it-equipment': return 'bg-info/20 text-info';
      case 'cables': return 'bg-warning/20 text-warning';
      case 'gauges': return 'bg-success/20 text-success';
      case 'adapters': return 'bg-accent/20 text-accent';
      case 'communication': return 'bg-info/20 text-info';
      case 'power': return 'bg-destructive/20 text-destructive';
      case 'safety': return 'bg-warning/20 text-warning';
      case 'tools': return 'bg-accent/20 text-accent';
      default: return 'bg-muted text-foreground';
    }
  };

  const getEquipmentCountForType = (typeId: string) => {
    // For AWS, we'll need to get this data from the equipment list
    // For now, return placeholder data
    return {
      equipmentItems: 0,
      individualEquipment: 0,
      totalQuantity: 0
    };
  };

  const canDeleteEquipmentType = (typeId: string) => {
    // Check if equipment type can be deleted
    const counts = getEquipmentCountForType(typeId);
    const totalCount = counts.equipmentItems + counts.individualEquipment;
    
    if (totalCount > 0) {
      return {
        canDelete: false,
        reason: 'Equipment type is in use',
        details: [
          `${counts.individualEquipment} individual equipment items`,
          `${counts.equipmentItems} bulk equipment items`
        ].filter(detail => !detail.startsWith('0'))
      };
    }
    
    return { canDelete: true };
  };

  const handleEdit = (type: EquipmentType) => {
    setEditingType(type);
    setIsDialogOpen(true);
  };

  const handleDelete = async (typeId: string, typeName: string) => {
    try {
      await deleteEquipmentType(typeId);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleSubmit = async (formData: CreateEquipmentTypeInput) => {
    try {
      if (editingType) {
        // AWS doesn't support editing equipment types directly
        toast.info('Equipment type editing not supported in AWS mode');
      } else {
        await createEquipmentType({
          name: formData.name,
          category: formData.category
        });
        toast.success('Equipment type created successfully');
      }
      setIsDialogOpen(false);
      setEditingType(null);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setEditingType(null);
  };

  return (
    <Card className="bg-card shadow-lg">
      <EquipmentTypeManagerHeader
        filteredTypesCount={filteredTypes.length}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isDialogOpen={isDialogOpen}
        onDialogOpenChange={setIsDialogOpen}
        editingType={editingType}
        onEditingTypeChange={setEditingType}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
      
      <EquipmentTypeTable
        filteredTypes={filteredTypes}
        data={{ equipmentTypes: equipmentTypes || [] }}
        canDeleteEquipmentType={canDeleteEquipmentType}
        getEquipmentCountForType={getEquipmentCountForType}
        getCategoryColor={getCategoryColor}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </Card>
  );
};

export default EquipmentTypeManager;
