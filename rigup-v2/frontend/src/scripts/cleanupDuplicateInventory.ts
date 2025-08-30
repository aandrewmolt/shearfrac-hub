import { tursoDb } from '@/services/tursoDb';
import { DatabaseEquipmentItem } from '@/types/types';

async function cleanupDuplicateInventory() {
  console.log('🧹 Starting duplicate inventory cleanup...');
  
  try {
    // Get all equipment items
    const allItems = await tursoDb.getEquipmentItems();
    console.log(`📦 Found ${allItems.length} total equipment items`);
    
    // Group items by type_id and location_id (ignoring notes to catch duplicates)
    const itemGroups = new Map<string, DatabaseEquipmentItem[]>();
    
    allItems.forEach(item => {
      const key = `${item.type_id}-${item.location_id}-${item.status}`;
      if (!itemGroups.has(key)) {
        itemGroups.set(key, []);
      }
      itemGroups.get(key)!.push(item);
    });
    
    // Find and handle duplicates
    let duplicatesFound = 0;
    let itemsDeleted = 0;
    
    for (const [key, items] of itemGroups.entries()) {
      if (items.length > 1) {
        const [typeId, locationId, status] = key.split('-');
        const typeName = (await tursoDb.getEquipmentTypes()).find(t => t.id === typeId)?.name || typeId;
        console.log(`\n🔍 Found ${items.length} duplicates for: ${typeName} at ${locationId} (${status})`);
        
        // Show details of each duplicate
        items.forEach((item, index) => {
          console.log(`  ${index + 1}. Quantity: ${item.quantity}, Notes: "${item.notes || 'none'}"`);
        });
        
        // Sort by created_at or last_updated to keep the oldest
        items.sort((a, b) => {
          const dateA = new Date(a.created_at || a.last_updated || 0).getTime();
          const dateB = new Date(b.created_at || b.last_updated || 0).getTime();
          return dateA - dateB;
        });
        
        // Keep the first (oldest) item, merge quantities
        const keepItem = items[0];
        let totalQuantity = 0;
        
        items.forEach(item => {
          totalQuantity += item.quantity || 0;
        });
        
        console.log(`  📊 Merging quantities: ${items.map(i => i.quantity).join(' + ')} = ${totalQuantity}`);
        
        // Update the kept item with total quantity
        if (keepItem.id) {
          await tursoDb.updateEquipmentItem(keepItem.id, {
            quantity: totalQuantity
          });
          console.log(`  ✅ Updated ${keepItem.type_id} to quantity: ${totalQuantity}`);
        }
        
        // Delete the duplicates
        for (let i = 1; i < items.length; i++) {
          if (items[i].id) {
            await tursoDb.deleteEquipmentItem(items[i].id);
            itemsDeleted++;
            console.log(`  🗑️ Deleted duplicate with ID: ${items[i].id}`);
          }
        }
        
        duplicatesFound++;
      }
    }
    
    console.log(`\n✨ Cleanup complete!`);
    console.log(`  - Duplicate groups found: ${duplicatesFound}`);
    console.log(`  - Items deleted: ${itemsDeleted}`);
    
    // Show final inventory summary
    const finalItems = await tursoDb.getEquipmentItems();
    const summary = new Map<string, number>();
    
    finalItems.forEach(item => {
      const key = `${item.type_id} (${item.location_id})`;
      summary.set(key, (summary.get(key) || 0) + item.quantity);
    });
    
    console.log('\n📋 Final inventory summary:');
    for (const [key, quantity] of summary.entries()) {
      // Skip Direct connection from summary
      if (!key.includes('direct-connection')) {
        console.log(`  - ${key}: ${quantity}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Export for use in other files
export { cleanupDuplicateInventory };

// Only run if executed directly
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  cleanupDuplicateInventory()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}