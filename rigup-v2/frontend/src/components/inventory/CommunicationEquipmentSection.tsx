
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Plus, ChevronDown, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { EquipmentType, IndividualEquipment, StorageLocation } from '@/types/inventory';
import { useInventory } from '@/contexts/InventoryContext';
import { toast } from 'sonner';
import IndividualEquipmentForm from './IndividualEquipmentForm';

interface CommunicationEquipmentSectionProps {
  equipmentType: EquipmentType;
  equipment: IndividualEquipment[];
  storageLocations: StorageLocation[];
  onAddEquipment: (equipment: IndividualEquipment) => void;
}

const CommunicationEquipmentSection: React.FC<CommunicationEquipmentSectionProps> = ({
  equipmentType,
  equipment,
  storageLocations,
  onAddEquipment,
}) => {
  const { deleteIndividualEquipment } = useInventory();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    equipmentId: '',
    name: '',
    locationId: '',
    serialNumber: '',
    notes: '',
    selectedPrefix: equipmentType.defaultIdPrefix || ''
  });

  const availableCount = equipment.filter(eq => eq.status === 'available').length;
  const deployedCount = equipment.filter(eq => eq.status === 'deployed').length;
  const redTaggedCount = equipment.filter(eq => eq.status === 'red-tagged').length;

  const generateNextId = () => {
    const prefix = equipmentType.defaultIdPrefix || 'EQ-';
    const existingIds = equipment
      .map(eq => eq.equipmentId)
      .filter(id => id.startsWith(prefix))
      .map(id => {
        const num = id.replace(prefix, '').replace('-', '');
        return parseInt(num) || 0;
      });
    
    const nextNum = Math.max(0, ...existingIds) + 1;
    return `${prefix}${nextNum.toString().padStart(3, '0')}`;
  };

  const handleSubmit = (saveImmediate = false) => {
    const equipmentId = formData.equipmentId || generateNextId();
    const defaultLocation = storageLocations.find(loc => loc.isDefault);
    
    const newItem = {
      equipmentId,
      name: formData.name || `${equipmentType.name} ${equipmentId}`,
      typeId: equipmentType.id,
      locationId: formData.locationId || defaultLocation?.id || storageLocations[0]?.id || '',
      status: 'available' as const,
      serialNumber: formData.serialNumber,
      notes: formData.notes
    };

    onAddEquipment(newItem);
    resetForm();
  };

  const handleDelete = async (item: IndividualEquipment) => {
    if (item.status === 'deployed') {
      toast.error('Cannot delete deployed equipment. Please return equipment first.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.name}" (${item.equipmentId})? This action cannot be undone.`
    );

    if (!confirmed) return;

    // Add to deleting set to show loading state
    setDeletingItems(prev => new Set(prev).add(item.id));

    try {
      // Optimistic update - remove from UI immediately
      const event = new CustomEvent('equipment-deleted', { detail: item.id });
      window.dispatchEvent(event);

      await deleteIndividualEquipment(item.id);
      toast.success(`Deleted ${item.name} successfully`);
    } catch (error) {
      console.error('Failed to delete equipment:', error);
      toast.error('Failed to delete equipment');
      
      // Restore item in UI on error
      const event = new CustomEvent('equipment-delete-failed', { detail: item.id });
      window.dispatchEvent(event);
    } finally {
      // Remove from deleting set
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const resetForm = () => {
    const defaultLocation = storageLocations.find(loc => loc.isDefault);
    setFormData({
      equipmentId: '',
      name: '',
      locationId: defaultLocation?.id || storageLocations[0]?.id || '',
      serialNumber: '',
      notes: '',
      selectedPrefix: equipmentType.defaultIdPrefix || ''
    });
    setIsFormOpen(false);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <CardTitle className="text-lg">{equipmentType.name}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {equipment.length} total
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1 text-xs">
              <Badge className="bg-muted text-foreground">
                {availableCount} available
              </Badge>
              {deployedCount > 0 && (
                <Badge className="bg-muted text-foreground">
                  {deployedCount} deployed
                </Badge>
              )}
              {redTaggedCount > 0 && (
                <Badge className="bg-muted text-destructive">
                  {redTaggedCount} red-tagged
                </Badge>
              )}
            </div>

            <Button size="sm" onClick={() => setIsFormOpen(true)}>
              <Plus className="h-3 w-3 mr-1" />
              Add Equipment
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {equipment.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {equipment.map(item => {
                const isDeleting = deletingItems.has(item.id);
                return (
                  <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-card rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.equipmentId}</span>
                      <span className="text-corporate-silver">{item.name}</span>
                      {item.serialNumber && (
                        <span className="text-xs text-corporate-silver">S/N: {item.serialNumber}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={item.status === 'available' ? 'default' : 'outline'}
                        className={`text-xs ${
                          item.status === 'available' ? 'bg-muted text-foreground' :
                          item.status === 'deployed' ? 'bg-muted text-foreground' :
                          'bg-muted text-destructive'
                        }`}
                      >
                        {item.status}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // This would trigger edit functionality if implemented
                            console.log('Edit clicked for:', item);
                          }}
                          className="h-6 w-6 p-0"
                          title="Edit equipment"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(item)}
                          disabled={item.status === 'deployed' || isDeleting}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          title="Delete equipment"
                        >
                          {isDeleting ? (
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-corporate-silver">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No {equipmentType.name.toLowerCase()} items yet</p>
            </div>
          )}
        </CardContent>
      )}

      <IndividualEquipmentForm
        isFormOpen={isFormOpen}
        setIsFormOpen={setIsFormOpen}
        editingEquipment={null}
        setEditingEquipment={() => {}}
        formData={formData}
        setFormData={setFormData}
        equipmentType={equipmentType}
        storageLocations={storageLocations}
        allEquipment={equipment}
        onSubmit={handleSubmit}
        onReset={resetForm}
        onPrefixChange={(prefix) => setFormData(prev => ({ ...prev, selectedPrefix: prefix }))}
      />
    </Card>
  );
};

export default CommunicationEquipmentSection;
