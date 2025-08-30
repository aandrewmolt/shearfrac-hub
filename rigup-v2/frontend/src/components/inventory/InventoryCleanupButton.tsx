
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wrench, CheckCircle, AlertTriangle } from 'lucide-react';
import { useInventory } from '@/contexts/InventoryContext';
import { useInventoryCleanup } from '@/hooks/inventory/useInventoryCleanup';
import { toast } from 'sonner';

const InventoryCleanupButton: React.FC = () => {
  const { data, updateSingleEquipmentItem, addEquipmentItem } = useInventory();
  const { mergeAndCleanupInventory, ensureRequiredItemsExist } = useInventoryCleanup();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cleanupResults, setCleanupResults] = useState<{
    duplicatesFound: number;
    itemsAdded: number;
    totalCleaned: number;
  } | null>(null);

  const runInventoryCleanup = async () => {
    setIsProcessing(true);
    try {
      const originalCount = data.equipmentItems.length;
      
      // Step 1: Merge duplicates
      const mergedItems = mergeAndCleanupInventory(data.equipmentItems);
      const duplicatesFound = originalCount - mergedItems.length;
      
      // Step 2: Ensure required items exist
      const finalItems = ensureRequiredItemsExist(mergedItems);
      
      // Step 3: Separate existing items from new items to create
      const existingItemIds = new Set(data.equipmentItems.map(item => item.id));
      const existingItems = finalItems.filter(item => 
        existingItemIds.has(item.id) && !item.id.startsWith('new-')
      );
      const newItems = finalItems.filter(item => 
        !existingItemIds.has(item.id) || item.id.startsWith('new-')
      );
      
      const itemsAdded = newItems.length;
      
      // Step 4: Update existing items
      const updatePromises = existingItems.map(item => 
        updateSingleEquipmentItem(item.id, {
          quantity: item.quantity,
          notes: item.notes,
          lastUpdated: item.lastUpdated
        })
      );
      
      // Step 5: Create only truly new items
      const createPromises = newItems.map(item => {
        return addEquipmentItem({
          typeId: item.typeId,
          locationId: item.locationId,
          quantity: item.quantity,
          status: item.status,
          notes: item.notes,
        });
      });
      
      await Promise.all([...updatePromises, ...createPromises]);
      
      const results = {
        duplicatesFound,
        itemsAdded,
        totalCleaned: duplicatesFound + itemsAdded
      };
      
      setCleanupResults(results);
      
      if (results.totalCleaned > 0) {
        toast.success(`Inventory cleanup complete! Merged ${duplicatesFound} duplicates and added ${itemsAdded} missing items.`);
      } else {
        toast.success('Inventory is already clean - no duplicates found!');
      }
      
    } catch (error) {
      console.error('Cleanup error:', error);
      toast.error('Failed to cleanup inventory');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Inventory Cleanup & Duplicate Merger
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-corporate-silver">
          This tool will merge duplicate equipment items at the same location and ensure all required cable types exist in your inventory. No duplicates will be created.
        </div>
        
        <Button
          onClick={runInventoryCleanup}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Wrench className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Wrench className="mr-2 h-4 w-4" />
              Run Inventory Cleanup
            </>
          )}
        </Button>

        {cleanupResults && (
          <Alert className={cleanupResults.totalCleaned > 0 ? "border-border bg-status-success/20" : "border-border bg-status-info/20"}>
            {cleanupResults.totalCleaned > 0 ? (
              <CheckCircle className="h-4 w-4 text-foreground" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-foreground" />
            )}
            <AlertDescription className={cleanupResults.totalCleaned > 0 ? "text-foreground" : "text-foreground"}>
              <div className="font-medium mb-1">Cleanup Results:</div>
              <ul className="text-sm space-y-1">
                <li>• Duplicates merged: {cleanupResults.duplicatesFound}</li>
                <li>• Missing items added: {cleanupResults.itemsAdded}</li>
                <li>• Total changes: {cleanupResults.totalCleaned}</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default InventoryCleanupButton;
