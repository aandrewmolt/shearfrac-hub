import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useUnifiedInventory } from '@/hooks/useUnifiedInventory';
import IndividualEquipmentManager from './IndividualEquipmentManager';
import { Plus, Package } from 'lucide-react';
import { toast } from 'sonner';

const IndividualEquipmentManagerWrapper: React.FC = () => {
  const { data, addIndividualEquipment, addEquipmentType } = useUnifiedInventory();
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [draftCount, setDraftCount] = useState(0);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkAddData, setBulkAddData] = useState({
    prefix: '',
    startNumber: 1,
    count: 1,
    locationId: '',
  });
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeData, setNewTypeData] = useState({
    name: '',
    category: 'gauges' as const,
    defaultIdPrefix: '',
    description: '',
  });

  const selectedType = useMemo(() => 
    data.equipmentTypes.find(type => type.id === selectedTypeId),
    [data.equipmentTypes, selectedTypeId]
  );

  // Set default location if not set
  React.useEffect(() => {
    if (!bulkAddData.locationId && data.storageLocations.length > 0) {
      const defaultLocation = data.storageLocations.find(loc => loc.isDefault) || data.storageLocations[0];
      setBulkAddData(prev => ({ ...prev, locationId: defaultLocation.id }));
    }
  }, [data.storageLocations, bulkAddData.locationId]);

  // Set default type if not selected
  React.useEffect(() => {
    if (!selectedTypeId && data.equipmentTypes.length > 0) {
      setSelectedTypeId(data.equipmentTypes[0].id);
    }
  }, [data.equipmentTypes, selectedTypeId]);

  const handleBulkAdd = async () => {
    if (!selectedType || !bulkAddData.prefix || bulkAddData.count < 1) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const newItems = [];
      for (let i = 0; i < bulkAddData.count; i++) {
        const number = bulkAddData.startNumber + i;
        const paddedNumber = String(number).padStart(2, '0');
        const equipmentId = `${bulkAddData.prefix}${paddedNumber}`;
        const name = `${selectedType.name} ${equipmentId}`;

        newItems.push({
          equipmentId,
          name,
          typeId: selectedType.id,
          locationId: bulkAddData.locationId,
          status: 'available' as const,
        });
      }

      // Add all items
      for (const item of newItems) {
        await addIndividualEquipment(item);
      }

      toast.success(`Added ${newItems.length} ${selectedType.name} items`);
      setShowBulkAdd(false);
      setBulkAddData(prev => ({ ...prev, count: 1, startNumber: 1 }));
    } catch (error) {
      console.error('Failed to bulk add equipment:', error);
      toast.error('Failed to add equipment');
    }
  };

  const handleAddEquipmentType = async () => {
    if (!newTypeData.name || !newTypeData.defaultIdPrefix) {
      toast.error('Please provide a name and default ID prefix');
      return;
    }

    try {
      const newType = await addEquipmentType({
        name: newTypeData.name,
        category: newTypeData.category,
        defaultIdPrefix: newTypeData.defaultIdPrefix,
        description: newTypeData.description,
      });
      
      if (newType && typeof newType === 'object' && 'id' in newType) {
        setSelectedTypeId(newType.id);
      }
      
      toast.success(`Added equipment type: ${newTypeData.name}`);
      setShowAddType(false);
      setNewTypeData({
        name: '',
        category: 'gauges',
        defaultIdPrefix: '',
        description: '',
      });
    } catch (error) {
      console.error('Failed to add equipment type:', error);
      toast.error('Failed to add equipment type');
    }
  };

  if (data.equipmentTypes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Equipment Types</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-corporate-silver mb-4">
            No equipment types found. Add your first equipment type to get started.
          </p>
          <Button onClick={() => setShowAddType(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Equipment Type
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Individual Equipment Management
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={() => setShowAddType(true)} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Type
              </Button>
              <Button onClick={() => setShowBulkAdd(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Bulk Add
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Select Equipment Type</Label>
            <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select equipment type..." />
              </SelectTrigger>
              <SelectContent>
                {data.equipmentTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} {type.defaultIdPrefix && `(${type.defaultIdPrefix})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedType && (
              <p className="text-sm text-corporate-silver">
                Managing {data.individualEquipment.filter(eq => eq.typeId === selectedType.id).length} {selectedType.name} items
                {draftCount > 0 && ` (${draftCount} drafts)`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedType && (
        <IndividualEquipmentManager
          equipmentType={selectedType}
          storageLocations={data.storageLocations}
          onDraftCountChange={setDraftCount}
        />
      )}

      {/* Bulk Add Dialog */}
      <Dialog open={showBulkAdd} onOpenChange={setShowBulkAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Add {selectedType?.name}</DialogTitle>
            <DialogDescription>
              Add multiple equipment items with sequential IDs
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ID Prefix</Label>
              <Input
                value={bulkAddData.prefix}
                onChange={(e) => setBulkAddData(prev => ({ ...prev, prefix: e.target.value.toUpperCase() }))}
                placeholder={selectedType?.defaultIdPrefix || "AG-"}
              />
              <p className="text-xs text-corporate-silver mt-1">
                Example: AG- will create AG-01, AG-02, etc.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Number</Label>
                <Input
                  type="number"
                  min="1"
                  value={bulkAddData.startNumber}
                  onChange={(e) => setBulkAddData(prev => ({ ...prev, startNumber: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <Label>Count</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={bulkAddData.count}
                  onChange={(e) => setBulkAddData(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
            <div>
              <Label>Storage Location</Label>
              <Select 
                value={bulkAddData.locationId} 
                onValueChange={(value) => setBulkAddData(prev => ({ ...prev, locationId: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.storageLocations.map(loc => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-card p-3 rounded-md">
              <p className="text-sm font-medium">Preview:</p>
              <p className="text-sm text-corporate-silver">
                Will create {bulkAddData.count} items: {bulkAddData.prefix}{String(bulkAddData.startNumber).padStart(2, '0')} to {bulkAddData.prefix}{String(bulkAddData.startNumber + bulkAddData.count - 1).padStart(2, '0')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkAdd(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAdd}>
              Add {bulkAddData.count} Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Equipment Type Dialog */}
      <Dialog open={showAddType} onOpenChange={setShowAddType}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Equipment Type</DialogTitle>
            <DialogDescription>
              Create a new equipment type for tracking
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Equipment Name</Label>
              <Input
                value={newTypeData.name}
                onChange={(e) => setNewTypeData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Abra Gauge"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select 
                value={newTypeData.category} 
                onValueChange={(value: unknown) => setNewTypeData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cables">Cables</SelectItem>
                  <SelectItem value="gauges">Gauges</SelectItem>
                  <SelectItem value="adapters">Adapters</SelectItem>
                  <SelectItem value="communication">Communication</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Default ID Prefix</Label>
              <Input
                value={newTypeData.defaultIdPrefix}
                onChange={(e) => setNewTypeData(prev => ({ ...prev, defaultIdPrefix: e.target.value.toUpperCase() }))}
                placeholder="e.g., AG-"
              />
              <p className="text-xs text-corporate-silver mt-1">
                This will be used to generate IDs like {newTypeData.defaultIdPrefix || 'AG-'}01, {newTypeData.defaultIdPrefix || 'AG-'}02, etc.
              </p>
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Input
                value={newTypeData.description}
                onChange={(e) => setNewTypeData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Wireless pressure gauge"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddType(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEquipmentType}>
              Add Equipment Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IndividualEquipmentManagerWrapper;