
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

interface EquipmentFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingItem: { id: string; equipmentId: string; name: string; } | null;
  formData: {
    typeId: string;
    locationId: string;
    equipmentId: string;
    name: string;
    status: 'available' | 'deployed' | 'red-tagged';
    notes: string;
  };
  setFormData: (data: unknown) => void;
  data: {
    equipmentTypes: unknown[];
    storageLocations: unknown[];
  };
  onSubmit: () => void;
  onCancel: () => void;
  getCategoryColor: (category: string) => string;
}

const EquipmentFormDialog: React.FC<EquipmentFormDialogProps> = ({
  isOpen,
  onOpenChange,
  editingItem,
  formData,
  setFormData,
  data,
  onSubmit,
  onCancel,
  getCategoryColor,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Equipment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'Edit Equipment' : 'Add Equipment'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="typeId">Equipment Type</Label>
            <Select value={formData.typeId} onValueChange={(value) => setFormData(prev => ({ ...prev, typeId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select equipment type" />
              </SelectTrigger>
              <SelectContent>
                {data.equipmentTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    <div className="flex items-center gap-2">
                      <Badge className={getCategoryColor(type.category)}>
                        {type.category}
                      </Badge>
                      {type.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="locationId">Location</Label>
            <Select value={formData.locationId} onValueChange={(value) => setFormData(prev => ({ ...prev, locationId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {data.storageLocations.map(location => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="equipmentId">Equipment ID</Label>
            <Input
              value={formData.equipmentId}
              onChange={(e) => setFormData(prev => ({ ...prev, equipmentId: e.target.value }))}
              placeholder="Enter unique equipment ID"
            />
          </div>

          <div>
            <Label htmlFor="name">Equipment Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter equipment name"
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="deployed">Deployed</SelectItem>
                <SelectItem value="red-tagged">Red Tagged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={onSubmit}>
              {editingItem ? 'Update' : 'Add'} Equipment
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentFormDialog;
