import { tursoDb } from '@/services/tursoDb';

async function fixPressureGaugeId() {
  console.log('🔧 Fixing incorrect pressure gauge IDs...');
  
  try {
    // Get all equipment items
    const allItems = await tursoDb.getEquipmentItems();
    
    // Find items with incorrect ID
    const incorrectItems = allItems.filter(item => item.type_id === 'pressure-gauge');
    
    if (incorrectItems.length === 0) {
      console.log('✅ No incorrect pressure gauge IDs found');
      return;
    }
    
    console.log(`🔍 Found ${incorrectItems.length} items with incorrect pressure gauge ID`);
    
    for (const item of incorrectItems) {
      console.log(`📝 Updating item ${item.id} from 'pressure-gauge' to 'pressure-gauge-1502'`);
      
      if (item.id) {
        await tursoDb.updateEquipmentItem(item.id, {
          type_id: 'pressure-gauge-1502'
        });
        console.log(`✅ Updated item ${item.id}`);
      }
    }
    
    // Now run the duplicate cleanup
    console.log('\n🧹 Now checking for duplicates to merge...');
    
    const updatedItems = await tursoDb.getEquipmentItems();
    const gauge1502Items = updatedItems.filter(
      item => item.type_id === 'pressure-gauge-1502' && 
              item.location_id === 'midland-office' &&
              item.status === 'available'
    );
    
    if (gauge1502Items.length > 1) {
      console.log(`🔍 Found ${gauge1502Items.length} 1502 pressure gauge entries to merge`);
      
      // Sort by created date to keep oldest
      gauge1502Items.sort((a, b) => {
        const dateA = new Date(a.created_at || a.last_updated || 0).getTime();
        const dateB = new Date(b.created_at || b.last_updated || 0).getTime();
        return dateA - dateB;
      });
      
      // Calculate total quantity
      const totalQuantity = gauge1502Items.reduce((sum, item) => sum + (item.quantity || 0), 0);
      console.log(`📊 Total quantity: ${totalQuantity}`);
      
      // Keep first item, update with total
      const keepItem = gauge1502Items[0];
      if (keepItem.id) {
        await tursoDb.updateEquipmentItem(keepItem.id, {
          quantity: totalQuantity,
          notes: 'Merged duplicate entries'
        });
        console.log(`✅ Updated main entry to quantity: ${totalQuantity}`);
        
        // Delete the rest
        for (let i = 1; i < gauge1502Items.length; i++) {
          if (gauge1502Items[i].id) {
            await tursoDb.deleteEquipmentItem(gauge1502Items[i].id);
            console.log(`🗑️ Deleted duplicate: ${gauge1502Items[i].id}`);
          }
        }
      }
    }
    
    console.log('\n✨ Pressure gauge ID fix complete!');
    
  } catch (error) {
    console.error('❌ Error fixing pressure gauge IDs:', error);
  }
}

// Export for use in other files
export { fixPressureGaugeId };

// Only run if executed directly
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  fixPressureGaugeId()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}