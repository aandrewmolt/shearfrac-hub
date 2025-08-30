import { offlineDb, SyncOperation } from './offlineDatabase';

export class SyncManager {
  private isSyncing = false;
  
  async performSync() {
    // Sync disabled - using Turso database for all operations
    return;
    
    /* Original sync code - disabled
    if (this.isSyncing || !navigator.onLine) return;
    
    this.isSyncing = true;
    try {
      // 1. Process sync queue first (local changes)
      await this.processSyncQueue();
      
      // 2. Pull remote changes
      await this.pullRemoteChanges();
      
      // 3. Resolve any conflicts
      await this.resolveConflicts();
      
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
    */
  }
  
  private async processSyncQueue() {
    const operations = await offlineDb.syncQueue.toArray();
    
    for (const op of operations) {
      try {
        await this.executeSyncOperation(op);
        await offlineDb.syncQueue.delete(op.id!);
      } catch (error) {
        // Increment retry count
        await offlineDb.syncQueue.update(op.id!, {
          retryCount: op.retryCount + 1
        });
        
        // If too many retries, mark as conflict
        if (op.retryCount >= 3) {
          await this.markAsConflict(op);
        }
      }
    }
  }
  
  private async executeSyncOperation(op: SyncOperation) {
    const { operation, tableName, data } = op;
    
    switch (operation) {
      case 'create': {
        const { data: created, error: createError } = await supabase
          .from(tableName)
          .insert(data)
          .select()
          .single();
          
        if (createError) throw createError;
        
        // Update local record with cloud ID
        const table = (offlineDb as Record<string, unknown>)[tableName];
        if (table && typeof table === 'object' && 'update' in table) {
          const tableWithUpdate = table as { update: (id: unknown, data: unknown) => Promise<void> };
          await tableWithUpdate.update(
            data.localId, 
            { cloudId: created.id, syncStatus: 'synced' }
          );
        }
        break;
      }
        
      case 'update': {
        const { error: updateError } = await supabase
          .from(tableName)
          .update(data.updates)
          .eq('id', data.cloudId);
          
        if (updateError) throw updateError;
        
        await offlineDb[tableName as keyof typeof offlineDb].update(
          data.localId,
          { syncStatus: 'synced' }
        );
        break;
      }
        
      case 'delete': {
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .eq('id', data.cloudId);
          
        if (deleteError) throw deleteError;
        break;
      }
    }
  }
  
  private async pullRemoteChanges() {
    // Get last sync timestamp
    const lastSync = localStorage.getItem('lastSyncTimestamp') || '2020-01-01';
    
    // Pull jobs
    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
      .gte('updated_at', lastSync);
      
    if (jobs) {
      for (const job of jobs) {
        const localJob = await offlineDb.jobs
          .where('cloudId')
          .equals(job.id)
          .first();
          
        if (!localJob) {
          // New job from cloud
          await offlineDb.jobs.add({
            cloudId: job.id,
            name: job.name,
            wellCount: job.well_count,
            hasWellsideGauge: job.has_wellside_gauge,
            nodes: job.nodes,
            edges: job.edges,
            companyComputerNames: job.company_computer_names || {},
            equipmentAssignment: job.equipment_assignment,
            equipmentAllocations: job.equipment_allocations,
            equipmentAllocated: job.equipment_allocated,
            mainBoxName: job.main_box_name,
            satelliteName: job.satellite_name,
            wellsideGaugeName: job.wellside_gauge_name,
            selectedCableType: job.selected_cable_type,
            fracBaudRate: job.frac_baud_rate,
            gaugeBaudRate: job.gauge_baud_rate,
            fracComPort: job.frac_com_port,
            gaugeComPort: job.gauge_com_port,
            enhancedConfig: job.enhanced_config,
            createdAt: job.created_at,
            updatedAt: Date.now(),
            syncStatus: 'synced'
          });
        } else if (localJob.syncStatus === 'synced') {
          // Update local with cloud version
          await offlineDb.jobs.update(localJob.id!, {
            name: job.name,
            wellCount: job.well_count,
            hasWellsideGauge: job.has_wellside_gauge,
            nodes: job.nodes,
            edges: job.edges,
            companyComputerNames: job.company_computer_names || {},
            equipmentAssignment: job.equipment_assignment,
            equipmentAllocations: job.equipment_allocations,
            equipmentAllocated: job.equipment_allocated,
            mainBoxName: job.main_box_name,
            satelliteName: job.satellite_name,
            wellsideGaugeName: job.wellside_gauge_name,
            selectedCableType: job.selected_cable_type,
            fracBaudRate: job.frac_baud_rate,
            gaugeBaudRate: job.gauge_baud_rate,
            fracComPort: job.frac_com_port,
            gaugeComPort: job.gauge_com_port,
            enhancedConfig: job.enhanced_config,
            createdAt: job.created_at,
            updatedAt: Date.now()
          });
        }
        // If status is 'pending' or 'conflict', skip to preserve local changes
      }
    }
    
    // Update last sync timestamp
    localStorage.setItem('lastSyncTimestamp', new Date().toISOString());
  }
  
  private async resolveConflicts() {
    // Get all records marked as conflict
    const conflictedJobs = await offlineDb.jobs
      .where('syncStatus')
      .equals('conflict')
      .toArray();
      
    for (const job of conflictedJobs) {
      // For now, use last-write-wins strategy
      // In production, you might want to show a UI for manual resolution
      await this.forceSync('jobs', job);
    }
  }
  
  private async markAsConflict(op: SyncOperation) {
    const table = offlineDb[op.tableName as keyof typeof offlineDb];
    await table.update(op.data.localId, { syncStatus: 'conflict' });
    
    // Remove from sync queue
    await offlineDb.syncQueue.delete(op.id!);
  }
  
  private async forceSync(tableName: string, record: unknown) {
    // Force push local version to cloud
    const rec = record as Record<string, unknown>;
    const { error } = await supabase
      .from(tableName)
      .upsert({
        id: rec.cloudId,
        ...rec
      });
      
    if (!error) {
      await offlineDb[tableName as keyof typeof offlineDb].update(
        rec.id as number,
        { syncStatus: 'synced' }
      );
    }
  }
}

// Singleton instance getter
let instance: SyncManager | null = null;

function getSyncManager(): SyncManager {
  if (!instance) {
    instance = new SyncManager();
  }
  return instance;
}

// Export for backward compatibility (will be lazy-loaded on first access)
export const syncManager = new Proxy({} as SyncManager, {
  get(target, prop) {
    const manager = getSyncManager();
    return (manager as Record<string, unknown>)[prop as string];
  }
});