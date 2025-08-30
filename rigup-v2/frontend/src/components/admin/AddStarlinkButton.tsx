import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Satellite, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/services/api.client';
import { useInventory } from '@/contexts/InventoryContext';

export function AddStarlinkButton() {
  const [isAdding, setIsAdding] = useState(false);
  const { refreshData } = useInventory();
  
  const handleAddStarlink = async () => {
    setIsAdding(true);
    
    try {
      console.log('🛰️ Adding Starlink equipment to inventory...');
      
      // Get or create Starlink equipment type
      const { equipmentTypes, storageLocations } = await refreshData();
      
      let starlinkType = equipmentTypes.find((type: any) => 
        type.name === 'Starlink' || type.name === 'starlink'
      );
      
      // Create equipment type if it doesn't exist
      if (!starlinkType) {
        console.log('Creating Starlink equipment type...');
        starlinkType = {
          id: `starlink-${Date.now()}`,
          name: 'Starlink',
          category: 'communications',
          description: 'Satellite internet system',
          manufacturer: 'SpaceX',
          model: 'Starlink V2'
        };
        
        // Add through inventory context
        await apiClient.createEquipment(starlinkType);
        await refreshData();
      }
      
      // Get default storage location
      let mainStorage = storageLocations.find((loc: any) => 
        loc.isDefault || loc.name === 'Main Storage' || loc.name === 'Warehouse'
      );
      
      if (!mainStorage && storageLocations.length > 0) {
        mainStorage = storageLocations[0];
      }
      
      if (!mainStorage) {
        toast.error('No storage location available. Please create one first.');
        return;
      }
      
      // Add 5 Starlink units
      console.log('Adding 5 Starlink units to inventory...');
      const units = [];
      
      for (let i = 1; i <= 5; i++) {
        const unit = {
          id: `starlink-unit-${Date.now()}-${i}`,
          equipment_type_id: starlinkType.id,
          serial_number: `SL-2024-${String(i).padStart(3, '0')}`,
          status: 'available',
          storage_location_id: mainStorage.id,
          location_type: 'storage' as const,
          purchase_date: new Date().toISOString(),
          purchase_price: 2500,
          notes: `Starlink unit ${i} of 5`,
          quantity: 1
        };
        
        await apiClient.createEquipment(unit);
        units.push(unit);
        console.log(`✅ Added Starlink unit ${i}: ${unit.serial_number}`);
      }
      
      // Refresh inventory data
      await refreshData();
      
      toast.success('Successfully added 5 Starlink units to inventory!');
      console.log('🎉 Successfully added 5 Starlink units to inventory!');
      
    } catch (error) {
      console.error('❌ Error adding Starlink equipment:', error);
      toast.error('Failed to add Starlink equipment');
    } finally {
      setIsAdding(false);
    }
  };
  
  return (
    <Button
      onClick={handleAddStarlink}
      disabled={isAdding}
      variant="outline"
      className="gap-2"
    >
      {isAdding ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Adding Starlink...
        </>
      ) : (
        <>
          <Satellite className="h-4 w-4" />
          Add 5 Starlink Units
        </>
      )}
    </Button>
  );
}