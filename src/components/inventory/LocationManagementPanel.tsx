
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Plus, Edit2, Trash2, Building } from 'lucide-react';
import { useAwsInventory as useInventory } from '@/hooks/useAwsInventory';
import { toast } from 'sonner';
import { StorageLocation } from '@/types/types';

const LocationManagementPanel = () => {
  const { data, createStorageLocation, updateStorageLocations } = useInventory();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const handleCreateLocation = async () => {
    if (!newLocationName.trim()) {
      toast.error('Location name is required');
      return;
    }

    try {
      await createStorageLocation({
        name: newLocationName.trim(),
        address: newLocationAddress.trim() || undefined,
        isDefault: isDefault,
      });
      setIsCreateDialogOpen(false);
      setNewLocationName('');
      setNewLocationAddress('');
      setIsDefault(false);
      toast.success('Storage location created successfully');
    } catch (error) {
      console.error('Error creating location:', error);
      toast.error('Failed to create storage location');
    }
  };

  const handleEditLocation = (location: StorageLocation) => {
    setEditingLocation(location);
    setNewLocationName(location.name);
    setNewLocationAddress(location.address || '');
    setIsDefault(location.isDefault);
    setIsEditDialogOpen(true);
  };

  const handleUpdateLocation = async () => {
    if (!newLocationName.trim()) {
      toast.error('Location name is required');
      return;
    }

    if (!editingLocation) return;

    try {
      await updateStorageLocations(editingLocation.id, {
        name: newLocationName.trim(),
        address: newLocationAddress.trim() || undefined,
        isDefault: isDefault,
      });
      setIsEditDialogOpen(false);
      setEditingLocation(null);
      setNewLocationName('');
      setNewLocationAddress('');
      setIsDefault(false);
      toast.success('Storage location updated successfully');
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Failed to update storage location');
    }
  };

  return (
    <Card className="bg-card shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building className="h-5 w-5" />
            Storage Locations
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Storage Location</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="locationName">Location Name *</Label>
                  <Input
                    id="locationName"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    placeholder="e.g., Main Warehouse, Field Office A"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="locationAddress">Address (Optional)</Label>
                  <Input
                    id="locationAddress"
                    value={newLocationAddress}
                    onChange={(e) => setNewLocationAddress(e.target.value)}
                    placeholder="Street address, city, state"
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDefault"
                    checked={isDefault}
                    onCheckedChange={(checked) => setIsDefault(checked as boolean)}
                  />
                  <Label htmlFor="isDefault">Set as default location</Label>
                </div>
                <Button onClick={handleCreateLocation} className="w-full">
                  Create Location
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.storageLocations.map(location => (
            <div key={location.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-corporate-silver" />
                  <span className="font-medium">{location.name}</span>
                  {location.isDefault && (
                    <Badge variant="outline" className="text-xs">Default</Badge>
                  )}
                </div>
                {location.address && (
                  <p className="text-sm text-corporate-silver mt-1">{location.address}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleEditLocation(location)}
                  variant="ghost"
                  size="sm"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {data.storageLocations.length === 0 && (
          <div className="text-center py-8">
            <p className="text-corporate-silver">No storage locations found.</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first storage location to get started.</p>
          </div>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Storage Location</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editLocationName">Location Name *</Label>
                <Input
                  id="editLocationName"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="e.g., Main Warehouse, Field Office A"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="editLocationAddress">Address (Optional)</Label>
                <Input
                  id="editLocationAddress"
                  value={newLocationAddress}
                  onChange={(e) => setNewLocationAddress(e.target.value)}
                  placeholder="Street address, city, state"
                  className="mt-1"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="editIsDefault"
                  checked={isDefault}
                  onCheckedChange={(checked) => setIsDefault(checked as boolean)}
                />
                <Label htmlFor="editIsDefault">Set as default location</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateLocation} className="flex-1">
                  Update Location
                </Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default LocationManagementPanel;
