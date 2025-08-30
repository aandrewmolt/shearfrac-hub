# Offline-First Architecture for RigUp

## Overview
This approach keeps Supabase for cloud sync while adding robust offline capabilities.

## Technology Stack
- **IndexedDB**: Local database using Dexie.js
- **Service Worker**: For offline caching and background sync
- **Sync Engine**: Custom conflict resolution
- **Queue System**: For pending operations

## Implementation Plan

### 1. Local Database (Dexie.js)
```typescript
// src/lib/offline/database.ts
import Dexie from 'dexie';

export class RigUpDatabase extends Dexie {
  jobs!: Table<LocalJob>;
  equipment!: Table<LocalEquipment>;
  syncQueue!: Table<SyncOperation>;
  
  constructor() {
    super('RigUpOffline');
    this.version(1).stores({
      jobs: '++id, cloudId, name, updatedAt',
      equipment: '++id, cloudId, name, status, locationId',
      syncQueue: '++id, operation, tableName, data, timestamp'
    });
  }
}
```

### 2. Sync Manager
```typescript
// src/lib/offline/syncManager.ts
export class SyncManager {
  async syncToCloud() {
    const pendingOps = await db.syncQueue.toArray();
    for (const op of pendingOps) {
      try {
        await this.executeOperation(op);
        await db.syncQueue.delete(op.id);
      } catch (error) {
        // Retry logic
      }
    }
  }
  
  async syncFromCloud() {
    // Pull latest changes from Supabase
    // Resolve conflicts using last-write-wins or custom logic
  }
}
```

### 3. Offline-First Hooks
```typescript
// src/hooks/offline/useOfflineJob.ts
export function useOfflineJob(jobId: string) {
  const [job, setJob] = useState<Job>();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    if (isOnline) {
      // Fetch from Supabase
      fetchFromSupabase(jobId).then(setJob);
    } else {
      // Fetch from IndexedDB
      db.jobs.where('cloudId').equals(jobId).first().then(setJob);
    }
  }, [jobId, isOnline]);
  
  const updateJob = async (updates: Partial<Job>) => {
    if (isOnline) {
      await updateSupabase(jobId, updates);
    } else {
      await db.jobs.update(job.id, updates);
      await db.syncQueue.add({
        operation: 'update',
        tableName: 'jobs',
        data: { jobId, updates },
        timestamp: Date.now()
      });
    }
  };
  
  return { job, updateJob, isOnline };
}
```

### 4. Service Worker
```javascript
// public/service-worker.js
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncManager.syncToCloud());
  }
});
```

## Benefits
- Works offline completely
- Syncs when online
- No data loss
- Better performance (local-first)
- Keeps Supabase benefits

## Migration Strategy
1. Implement IndexedDB layer
2. Add sync queue
3. Update hooks one by one
4. Add service worker
5. Test offline scenarios