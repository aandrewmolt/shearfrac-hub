
import React from 'react';
import { Loader2, Search, Database, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EquipmentType, StorageLocation } from '@/types/inventory';
import { useIndividualEquipmentManager } from '@/hooks/inventory/useIndividualEquipmentManager';
import { useEquipmentMigration } from '@/hooks/inventory/useEquipmentMigration';
import { useInventoryDataCleanup } from '@/hooks/inventory/useInventoryDataCleanup';
import { useUnifiedInventory } from '@/hooks/useUnifiedInventory';
import { toast } from 'sonner';
import IndividualEquipmentForm from './IndividualEquipmentForm';
import EquipmentGrid from './EquipmentGrid';
import IndividualEquipmentHeader from './individual/IndividualEquipmentHeader';
import IndividualEquipmentStats from './individual/IndividualEquipmentStats';
import DraftItemsList from './individual/DraftItemsList';

interface IndividualEquipmentManagerProps {
  equipmentType?: EquipmentType;
  storageLocations: StorageLocation[];
  onDraftCountChange: (count: number) => void;
}

const IndividualEquipmentManager: React.FC<IndividualEquipmentManagerProps> = ({
  equipmentType,
  storageLocations,
  onDraftCountChange,
}) => {
  const { deleteEquipment, isLoading } = useUnifiedInventory();
  const { migrateEquipmentNaming } = useEquipmentMigration();
  const { analyzeDataConsistency } = useInventoryDataCleanup();
  
  const manager = useIndividualEquipmentManager(
    equipmentType!,
    onDraftCountChange
  );

  const handleDeleteAllEquipment = async () => {
    if (!equipmentType) return;
    
    const confirm = window.confirm(
      `Are you sure you want to delete ALL ${equipmentType.name} equipment? This cannot be undone.`
    );
    
    if (!confirm) return;

    try {
      const equipmentToDelete = manager.individualEquipment.filter(eq => 
        eq.status !== 'deployed' // Don't delete deployed equipment
      );

      for (const equipment of equipmentToDelete) {
        await deleteEquipment(equipment.id);
      }

      toast.success(`Deleted ${equipmentToDelete.length} ${equipmentType.name} items`);
      
      if (equipmentToDelete.length < manager.individualEquipment.length) {
        toast.warning(`${manager.individualEquipment.length - equipmentToDelete.length} deployed items were not deleted`);
      }
    } catch (error) {
      console.error('Failed to delete equipment:', error);
      toast.error('Failed to delete equipment');
    }
  };

  // Show loading state while data is being fetched
  if (isLoading || !equipmentType) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading equipment data...</span>
        </div>
      </div>
    );
  }

  if (storageLocations.length === 0) {
    return (
      <div className="space-y-3">
        <IndividualEquipmentHeader
          draftCount={manager.draftEquipment.length}
          onSaveDrafts={manager.saveImmediately}
          onOpenForm={() => manager.setIsFormOpen(true)}
        />
        <Card className="border-border bg-muted">
          <CardContent className="p-3">
            <p className="text-sm text-foreground">
              No storage locations found. Please add storage locations first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-muted text-foreground';
      case 'deployed': return 'bg-muted text-foreground';
      case 'maintenance': return 'bg-muted text-foreground';
      case 'red-tagged': return 'bg-muted text-destructive';
      case 'retired': return 'bg-card text-corporate-light';
      default: return 'bg-card text-corporate-light';
    }
  };

  const getLocationName = (locationId: string) => {
    const location = storageLocations.find(loc => loc.id === locationId);
    return location?.name || 'Unknown Location';
  };


  return (
    <div className="space-y-3">
      <IndividualEquipmentHeader
        draftCount={manager.draftEquipment.length}
        onSaveDrafts={manager.saveImmediately}
        onOpenForm={() => manager.setIsFormOpen(true)}
      />

      {/* Data Management Tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Migration Tool */}
        <Card className="border-border bg-status-info/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground font-medium">Fix Equipment Naming</p>
                <p className="text-xs text-foreground">
                  Update names: SS0001→ShearStream-0001, CC01→Customer Computer 01
                </p>
              </div>
              <Button size="sm" onClick={migrateEquipmentNaming} variant="outline">
                <Search className="h-3 w-3 mr-1" />
                Fix Names
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Analysis Tool */}
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">Analyze Data</p>
                <p className="text-xs text-purple-600">
                  Check for missing equipment and data consistency
                </p>
              </div>
              <Button size="sm" onClick={analyzeDataConsistency} variant="outline">
                <Database className="h-3 w-3 mr-1" />
                Analyze
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Delete All Tool */}
        <Card className="border-red-200 bg-status-danger/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-destructive font-medium">Delete All Equipment</p>
                <p className="text-xs text-destructive">
                  Remove all {equipmentType.name} items (except deployed)
                </p>
              </div>
              <Button 
                size="sm" 
                onClick={handleDeleteAllEquipment} 
                variant="outline"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <IndividualEquipmentStats equipment={manager.individualEquipment} />
      <DraftItemsList draftItems={manager.draftEquipment} />

      <EquipmentGrid
        equipment={manager.allEquipment}
        draftEquipment={manager.draftEquipment}
        onEdit={manager.setEditingEquipment}
        onDelete={manager.handleDelete}
        onStatusChange={manager.handleStatusChange}
        onLocationChange={manager.handleLocationChange}
        getStatusColor={getStatusColor}
        getLocationName={getLocationName}
        storageLocations={storageLocations}
      />

      <IndividualEquipmentForm
        isFormOpen={manager.isFormOpen}
        setIsFormOpen={manager.setIsFormOpen}
        editingEquipment={manager.editingEquipment}
        setEditingEquipment={manager.setEditingEquipment}
        formData={manager.formData}
        setFormData={manager.setFormData}
        equipmentType={equipmentType}
        storageLocations={storageLocations}
        allEquipment={manager.allEquipment}
        onSubmit={manager.handleSubmit}
        onReset={manager.resetForm}
        onPrefixChange={manager.handlePrefixChange}
      />
    </div>
  );
};

export default IndividualEquipmentManager;
