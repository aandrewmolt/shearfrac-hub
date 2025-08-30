
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';
import { useInventory } from '@/contexts/InventoryContext';
import { toast } from 'sonner';

interface ExtraEquipmentFormProps {
  onAddExtra: (equipmentTypeId: string, quantity: number, reason: string, notes?: string, individualEquipmentId?: string) => void;
  onClose: () => void;
}

const ExtraEquipmentForm: React.FC<ExtraEquipmentFormProps> = ({
  onAddExtra,
  onClose,
}) => {
  const { data } = useInventory();
  const [selectedEquipmentType, setSelectedEquipmentType] = useState('');
  const [selectedIndividualEquipment, setSelectedIndividualEquipment] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const selectedType = data.equipmentTypes.find(type => type.id === selectedEquipmentType);
  // All equipment is now individually tracked
  const requiresIndividualTracking = true;

  // Get available individual equipment for the selected type
  const availableIndividualEquipment = data.individualEquipment.filter(
    eq => eq.typeId === selectedEquipmentType && eq.status === 'available'
  );

  const handleAddExtra = () => {
    if (!selectedEquipmentType || !reason.trim()) {
      toast.error('Please select equipment type and provide a reason');
      return;
    }

    if (requiresIndividualTracking) {
      if (!selectedIndividualEquipment) {
        toast.error('Please select a specific equipment item for individually tracked equipment');
        return;
      }
      // For individually tracked equipment, quantity is always 1
      onAddExtra(selectedEquipmentType, 1, reason.trim(), notes.trim() || undefined, selectedIndividualEquipment);
    } else {
      if (quantity <= 0) {
        toast.error('Please enter a valid quantity');
        return;
      }
      onAddExtra(selectedEquipmentType, quantity, reason.trim(), notes.trim() || undefined);
    }
    
    // Reset form
    setSelectedEquipmentType('');
    setSelectedIndividualEquipment('');
    setQuantity(1);
    setReason('');
    setNotes('');
    onClose();
  };

  const handleEquipmentTypeChange = (typeId: string) => {
    setSelectedEquipmentType(typeId);
    setSelectedIndividualEquipment(''); // Reset individual selection when type changes
    setQuantity(1); // Reset quantity
  };

  const commonReasons = [
    'Backup/Spare',
    'Customer Request',
    'Emergency Replacement',
    'Testing Equipment',
    'Future Phase',
    'Maintenance Reserve',
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Equipment Type</label>
        <Select value={selectedEquipmentType} onValueChange={handleEquipmentTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select equipment type" />
          </SelectTrigger>
          <SelectContent className="bg-card">
            {data.equipmentTypes.map(type => (
              <SelectItem key={type.id} value={type.id}>
                <div className="flex items-center gap-2">
                  {type.name}
                  {type.requiresIndividualTracking && (
                    <Badge variant="outline" className="text-xs">Individual</Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {requiresIndividualTracking ? (
        <div>
          <label className="block text-sm font-medium mb-1">
            Select Specific Equipment
            <AlertTriangle className="inline h-4 w-4 ml-1 text-orange-500" />
          </label>
          {availableIndividualEquipment.length > 0 ? (
            <Select value={selectedIndividualEquipment} onValueChange={setSelectedIndividualEquipment}>
              <SelectTrigger>
                <SelectValue placeholder="Select specific equipment" />
              </SelectTrigger>
              <SelectContent className="bg-card">
                {availableIndividualEquipment.map(equipment => (
                  <SelectItem key={equipment.id} value={equipment.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{equipment.equipmentId}</span>
                      <span className="text-sm text-muted-foreground">{equipment.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="p-3 bg-muted border border-border rounded">
              <p className="text-sm text-foreground">
                No available equipment of this type found. Please ensure equipment is available in inventory.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Reason</label>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger>
            <SelectValue placeholder="Select reason or type custom" />
          </SelectTrigger>
          <SelectContent className="bg-card">
            {commonReasons.map(reasonOption => (
              <SelectItem key={reasonOption} value={reasonOption}>
                {reasonOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!commonReasons.includes(reason) && (
          <Input
            className="mt-2"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter custom reason..."
          />
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional details about this extra equipment..."
          rows={3}
        />
      </div>

      <Button 
        onClick={handleAddExtra} 
        className="w-full"
        disabled={!selectedEquipmentType || !reason.trim() || (requiresIndividualTracking && !selectedIndividualEquipment)}
      >
        Add Extra Equipment
      </Button>
    </div>
  );
};

export default ExtraEquipmentForm;
