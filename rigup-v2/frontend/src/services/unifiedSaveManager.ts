// Unified Save Manager - Single source of truth for all save operations
import { Job } from '@/types/types';
import { connectionStatus } from '@/utils/connectionStatus';
import { saveLock } from '@/utils/saveLock';

interface SaveRequest {
  id: string;
  jobData: Job;
  priority: 'low' | 'medium' | 'high';
  reason: string;
  timestamp: number;
}

class UnifiedSaveManager {
  private saveQueue: Map<string, SaveRequest> = new Map();
  private isProcessing = false;
  private lastSaveTime = 0;
  private readonly BATCH_DELAY = 1000; // 1 second batch window
  private readonly MIN_SAVE_INTERVAL = 2000; // Minimum 2 seconds between actual saves
  private batchTimeout: NodeJS.Timeout | null = null;

  // Dependencies injected from React hooks
  private saveJob: ((jobData: Partial<Job>) => void) | null = null;
  private syncJobEquipmentNames: ((assignments: unknown, names: unknown) => void) | null = null;
  private deployExtraEquipment: ((extra: any, reason: string) => void) | null = null;

  // Initialize with hook dependencies
  initialize(dependencies: {
    saveJob: (jobData: Partial<Job>) => void;
    syncJobEquipmentNames: (assignments: unknown, names: unknown) => void;
    deployExtraEquipment: (extra: any, reason: string) => void;
  }) {
    this.saveJob = dependencies.saveJob;
    this.syncJobEquipmentNames = dependencies.syncJobEquipmentNames;
    this.deployExtraEquipment = dependencies.deployExtraEquipment;
  }

  // Queue a save request (replaces multiple immediate save calls)
  requestSave(
    jobData: Job, 
    reason: string, 
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): void {
    const request: SaveRequest = {
      id: jobData.id,
      jobData: { ...jobData },
      priority,
      reason,
      timestamp: Date.now()
    };

    // Always replace existing request for same job (latest wins)
    this.saveQueue.set(jobData.id, request);

    console.log(`🔄 Save requested: ${reason} (Priority: ${priority})`);

    // For high priority, process immediately
    if (priority === 'high') {
      this.processQueue();
    } else {
      // Batch other saves
      this.scheduleBatchProcess();
    }
  }

  // Schedule batch processing with debouncing
  private scheduleBatchProcess(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processQueue();
    }, this.BATCH_DELAY);
  }

  // Process the save queue
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.saveQueue.size === 0 || !this.saveJob) {
      return;
    }

    // Check if we're saving too frequently
    const timeSinceLastSave = Date.now() - this.lastSaveTime;
    if (timeSinceLastSave < this.MIN_SAVE_INTERVAL) {
      console.log(`⏳ Throttling save - ${timeSinceLastSave}ms since last save`);
      // Reschedule for later
      setTimeout(() => this.processQueue(), this.MIN_SAVE_INTERVAL - timeSinceLastSave);
      return;
    }

    this.isProcessing = true;
    console.log(`💾 Processing ${this.saveQueue.size} save request(s)`);

    try {
      // Get the latest request (highest priority or most recent)
      const requests = Array.from(this.saveQueue.values());
      const request = requests
        .sort((a, b) => {
          // Sort by priority first, then by timestamp
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }
          return b.timestamp - a.timestamp;
        })[0];

      if (!request) return;

      // Clear the queue since we're processing the latest state
      this.saveQueue.clear();
      
      // Check connection quality
      const latency = connectionStatus.getLatency();
      if (latency > 10000) {
        console.warn(`🐌 High latency (${latency}ms) - save may be slow`);
      }

      // Perform the actual save
      console.log(`💾 Saving job: ${request.reason}`);
      
      await this.performSave(request.jobData);
      
      this.lastSaveTime = Date.now();
      console.log(`✅ Save completed: ${request.reason}`);

    } catch (error) {
      console.error('❌ Save failed:', error);
    } finally {
      this.isProcessing = false;
      
      // Process any new requests that came in during save
      if (this.saveQueue.size > 0) {
        setTimeout(() => this.processQueue(), 500);
      }
    }
  }

  // Perform the actual save with all sync operations
  private async performSave(jobData: Job): Promise<void> {
    if (!this.saveJob) return;

    // Use save lock to prevent conflicts
    const lockId = jobData.id;
    
    try {
      await saveLock.withLock(lockId, async () => {
        // Main job save
        this.saveJob!(jobData);

        // Sync equipment names if available
        if (jobData.equipmentAssignment && this.syncJobEquipmentNames) {
          this.syncJobEquipmentNames(
            {
              shearstreamBoxIds: jobData.equipmentAssignment.shearstreamBoxIds || [],
              starlinkId: jobData.equipmentAssignment.starlinkId,
              customerComputerIds: jobData.equipmentAssignment.customerComputerIds || []
            },
            {
              mainBoxName: jobData.mainBoxName,
              satelliteName: jobData.satelliteName,
              customerComputerNames: jobData.companyComputerNames
            }
          );
        }

        // Sync extras equipment if available and not empty
        if (
          jobData.extrasOnLocation && 
          jobData.extrasOnLocation.length > 0 && 
          this.deployExtraEquipment
        ) {
          try {
            // Deploy each extra using the unified system
            for (const extra of jobData.extrasOnLocation) {
              this.deployExtraEquipment(extra, 'Save extras sync');
            }
          } catch (error) {
            console.error('Failed to sync extras equipment:', error);
            // Don't fail the entire save for extras sync issues
          }
        }
      });
    } catch (error) {
      console.error('Failed to acquire save lock:', error);
      throw error;
    }
  }

  // Get current save status
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      queueSize: this.saveQueue.size,
      lastSaveTime: this.lastSaveTime,
      timeSinceLastSave: Date.now() - this.lastSaveTime
    };
  }

  // Clear the queue (emergency stop)
  clearQueue(): void {
    this.saveQueue.clear();
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    console.log('🧹 Save queue cleared');
  }
}

// Singleton instance
export const unifiedSaveManager = new UnifiedSaveManager();