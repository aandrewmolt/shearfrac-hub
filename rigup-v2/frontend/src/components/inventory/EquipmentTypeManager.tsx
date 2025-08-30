
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { useInventory } from '@/contexts/InventoryContext';
import { useEquipmentDeletion } from '@/hooks/inventory/useEquipmentDeletion';
import { toast } from 'sonner';
import EquipmentTypeManagerHeader from './EquipmentTypeManagerHeader';
import EquipmentTypeTable from './EquipmentTypeTable';
import { EquipmentType, CreateEquipmentTypeInput } from '@/types/types';

const EquipmentTypeManager = () => {
  const { data, addEquipmentType, updateEquipmentType, deleteEquipmentType } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<EquipmentType | null>(null);

  const { handleDeleteEquipmentType, canDeleteEquipmentType } = useEquipmentDeletion({
    equipmentItems: data.equipmentItems,
    individualEquipment: data.individualEquipment,
    deleteEquipmentItem: () => Promise.resolve(),
    deleteEquipmentType,
    deleteIndividualEquipment: undefined
  });

  const filteredTypes = data.equipmentTypes.filter(type =>
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
    const equipmentItems = data.equipmentItems.filter(item => item.typeId === typeId);
    const individualEquipment = data.individualEquipment.filter(eq => eq.typeId === typeId);
    return {
      equipmentItems: equipmentItems.length,
      individualEquipment: individualEquipment.length,
      totalQuantity: equipmentItems.reduce((sum, item) => sum + item.quantity, 0)
    };
  };

  const handleEdit = (type: EquipmentType) => {
    setEditingType(type);
    setIsDialogOpen(true);
  };

  const handleDelete = async (typeId: string, typeName: string) => {
    await handleDeleteEquipmentType(typeId, typeName);
  };

  const handleSubmit = async (formData: CreateEquipmentTypeInput) => {
    try {
      if (editingType) {
        await updateEquipmentType(editingType.id, formData);
        toast.success('Equipment type updated successfully');
      } else {
        await addEquipmentType(formData);
        toast.success('Equipment type created successfully');
      }
      setIsDialogOpen(false);
      setEditingType(null);
    } catch (error) {
      toast.error('Failed to save equipment type');
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
        data={data}
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
