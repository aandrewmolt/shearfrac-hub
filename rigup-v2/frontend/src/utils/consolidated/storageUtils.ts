import { offlineDb } from '@/lib/offline/offlineDatabase';

// =============================================================================
// OFFLINE DATA MANAGEMENT
// =============================================================================

export async function clearOfflineData() {
  try {
    await offlineDb.equipment.clear();
    await offlineDb.equipment_types.clear();
    await offlineDb.storage_locations.clear();
    await offlineDb.syncQueue.clear();
    
    // Clear last sync timestamp
    localStorage.removeItem('lastSyncTimestamp');
    
    console.log('Offline data cleared successfully');
    return { success: true };
  } catch (error) {
    console.error('Error clearing offline data:', error);
    return { success: false, error };
  }
}

export async function clearOfflineDataComplete() {
  try {
    // Clear all tables
    await offlineDb.jobs.clear();
    await offlineDb.equipment.clear();
    await offlineDb.equipment_types.clear();
    await offlineDb.storage_locations.clear();
    await offlineDb.syncQueue.clear();
    
    // Clear last sync timestamp
    localStorage.removeItem('lastSyncTimestamp');
    
    console.log('Offline data cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing offline data:', error);
    return false;
  }
}

export async function resetOfflineDatabase() {
  try {
    // Delete the entire database
    await offlineDb.delete();
    
    // Recreate it by opening it again
    await offlineDb.open();
    
    // Clear last sync timestamp
    localStorage.removeItem('lastSyncTimestamp');
    
    console.log('Offline database reset successfully');
    return true;
  } catch (error) {
    console.error('Error resetting offline database:', error);
    return false;
  }
}