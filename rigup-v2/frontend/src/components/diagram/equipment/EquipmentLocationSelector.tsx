
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';
import { useUnifiedInventory } from '@/hooks/useUnifiedInventory';

interface EquipmentLocationSelectorProps {
  selectedLocation: string;
  setSelectedLocation: (locationId: string) => void;
}

const EquipmentLocationSelector: React.FC<EquipmentLocationSelectorProps> = ({
  selectedLocation,
  setSelectedLocation,
}) => {
  const { data } = useUnifiedInventory();

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        Equipment Source Location
      </Label>
      <Select value={selectedLocation} onValueChange={setSelectedLocation}>
        <SelectTrigger>
          <SelectValue placeholder="Select storage location" />
        </SelectTrigger>
        <SelectContent>
          {data.storageLocations.map(location => (
            <SelectItem key={location.id} value={location.id}>
              {location.name}
              {location.isDefault && (
                <span className="ml-2 text-xs text-foreground">(Default)</span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedLocation && (
        <p className="text-xs text-muted-foreground">
          Equipment will be allocated from this location
        </p>
      )}
    </div>
  );
};

export default EquipmentLocationSelector;
