
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EquipmentType } from '@/types/inventory';

interface EquipmentTypeFormProps {
  editingType: EquipmentType | null;
  onSubmit: (formData: {
    name: string;
    category: EquipmentType['category'];
    description: string;
    defaultIdPrefix: string;
  }) => void;
  onCancel: () => void;
}

const EquipmentTypeForm: React.FC<EquipmentTypeFormProps> = ({
  editingType,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'other' as EquipmentType['category'],
    description: '',
    defaultIdPrefix: '',
  });

  useEffect(() => {
    if (editingType) {
      setFormData({
        name: editingType.name,
        category: editingType.category,
        description: editingType.description || '',
        defaultIdPrefix: editingType.defaultIdPrefix || '',
      });
    } else {
      setFormData({
        name: '',
        category: 'other',
        description: '',
        defaultIdPrefix: '',
      });
    }
  }, [editingType]);

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    onSubmit(formData);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Equipment Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter equipment name..."
        />
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Select value={formData.category} onValueChange={(value: unknown) => setFormData({ ...formData, category: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="control-units">Control Units</SelectItem>
            <SelectItem value="it-equipment">IT Equipment</SelectItem>
            <SelectItem value="cables">Cables</SelectItem>
            <SelectItem value="gauges">Gauges</SelectItem>
            <SelectItem value="adapters">Adapters</SelectItem>
            <SelectItem value="communication">Communication</SelectItem>
            <SelectItem value="power">Power</SelectItem>
            <SelectItem value="safety">Safety</SelectItem>
            <SelectItem value="tools">Tools</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter description..."
        />
      </div>
      <div>
        <Label htmlFor="prefix">Default ID Prefix (Optional)</Label>
        <Input
          id="prefix"
          value={formData.defaultIdPrefix}
          onChange={(e) => setFormData({ ...formData, defaultIdPrefix: e.target.value })}
          placeholder="e.g., SS-, SL-, CC-"
        />
        <p className="text-xs text-muted-foreground mt-1">
          This will be used to auto-generate IDs like {formData.defaultIdPrefix}001
        </p>
      </div>
      <div className="flex space-x-2">
        <Button onClick={handleSubmit} className="flex-1">
          {editingType ? 'Update' : 'Add'}
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default EquipmentTypeForm;
