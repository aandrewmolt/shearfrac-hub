
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EquipmentType, IndividualEquipment, StorageLocation } from '@/types/inventory';
import JobAwareLocationSelector from './JobAwareLocationSelector';

interface IndividualEquipmentFormProps {
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
  editingEquipment: IndividualEquipment | null;
  setEditingEquipment: (equipment: IndividualEquipment | null) => void;
  formData: Partial<IndividualEquipment>;
  setFormData: (data: Partial<IndividualEquipment>) => void;
  equipmentType: EquipmentType;
  storageLocations: StorageLocation[];
  allEquipment: IndividualEquipment[];
  onSubmit: (saveImmediate?: boolean) => void;
  onReset: () => void;
  onPrefixChange: (prefix: string) => void;
}

const IndividualEquipmentForm: React.FC<IndividualEquipmentFormProps> = ({
  isFormOpen,
  setIsFormOpen,
  editingEquipment,
  setEditingEquipment,
  formData,
  setFormData,
  equipmentType,
  storageLocations,
  allEquipment,
  onSubmit,
  onReset,
  onPrefixChange,
}) => {

  const handleSubmit = () => {
    onSubmit(true);
  };

  return (
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingEquipment ? 'Edit' : 'Add'} {equipmentType.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Equipment ID */}
          <div>
            <Label htmlFor="equipmentId">Equipment ID</Label>
            <div className="flex gap-2">
              <Input
                id="equipmentId"
                value={formData.equipmentId}
                onChange={(e) => setFormData(prev => ({ ...prev, equipmentId: e.target.value }))}
                placeholder={formData.equipmentId || 'Enter equipment ID'}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => onPrefixChange(formData.selectedPrefix || equipmentType.defaultIdPrefix || '')}
              >
                Suggest
              </Button>
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name">Name (Optional)</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={formData.name || `${equipmentType.name}`}
            />
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Location</Label>
            <JobAwareLocationSelector
              value={formData.locationId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, locationId: value }))}
              placeholder="Select location"
            />
          </div>

          {/* Serial Number */}
          <div>
            <Label htmlFor="serialNumber">Serial Number (Optional)</Label>
            <Input
              id="serialNumber"
              value={formData.serialNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
              placeholder="Enter serial number"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onReset}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit}>
              {editingEquipment ? 'Update' : 'Add'} Equipment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IndividualEquipmentForm;
