/**
 * Unified Equipment Sync System
 * Single source of truth for ALL equipment synchronization operations
 * Replaces: useEquipmentRealtimeSync, useUnifiedEquipmentSync, useUniversalSync, useExtrasEquipmentSync
 */

import { useUnifiedEvents } from '@/services/unifiedEventSystem';
import { tursoDb } from '@/services/tursoDb';
import { toast } from 'sonner';

interface EquipmentSyncRequest {
  id: string;
  type: 'status_change' | 'allocation' | 'return' | 'validation' | 'node_sync' | 'extras_deploy';
  equipmentId: string;
  jobId?: string;
  nodeId?: string;
  newStatus?: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: number;
  data?: any;
}

interface EquipmentConflict {
  equipmentId: string;
  type: 'status_mismatch' | 'allocation_conflict' | 'availability_conflict';
  currentState: any;
  requestedState: any;
  jobId: string;
  details: string;
}

class UnifiedEquipmentSyncManager {
  private syncQueue: Map<string, EquipmentSyncRequest> = new Map();
  private isProcessing = false;
  private conflicts: Map<string, EquipmentConflict> = new Map();
  private equipmentState: Map<string, any> = new Map();
  
  // Sync strategies
  private readonly BATCH_DELAY = 500; // 500ms batch window
  private readonly CONFLICT_RESOLUTION_DELAY = 2000; // 2s before auto-resolve
  private batchTimeout: NodeJS.Timeout | null = null;
  
  // Event system and dependencies (injected by React hook)
  private eventSystem: any = null;
  private inventoryData: any = null;
  private updateCallbacks: Map<string, Function> = new Map();

  // Initialize with dependencies
  initialize(dependencies: {
    eventSystem: any;
    inventoryData: any;
    onEquipmentChange?: (equipmentId: string, change: any) => void;
    onConflictDetected?: (conflict: EquipmentConflict) => void;
    onSyncComplete?: () => void;
  }) {
    this.eventSystem = dependencies.eventSystem;
    this.inventoryData = dependencies.inventoryData;
    
    // Register callbacks
    if (dependencies.onEquipmentChange) {
      this.updateCallbacks.set('change', dependencies.onEquipmentChange);
    }
    if (dependencies.onConflictDetected) {
      this.updateCallbacks.set('conflict', dependencies.onConflictDetected);
    }
    if (dependencies.onSyncComplete) {
      this.updateCallbacks.set('complete', dependencies.onSyncComplete);
    }

    this.setupEventListeners();
  }

  // Setup unified event listeners
  private setupEventListeners() {
    if (!this.eventSystem) return;

    // Listen for equipment status changes
    this.eventSystem.subscribe('equipment_status_change', (event: any) => {
      this.requestSync({
        type: 'status_change',
        equipmentId: event.data.equipmentId,
        jobId: event.data.jobId,
        newStatus: event.data.newStatus,
        reason: 'status change event',
        priority: 'medium'
      });
    });

    // Listen for equipment allocations
    this.eventSystem.subscribe('equipment_allocation', (event: any) => {
      this.requestSync({
        type: 'allocation',
        equipmentId: event.data.equipmentId,
        jobId: event.data.jobId,
        reason: 'allocation event',
        priority: 'high'
      });
    });

    // Listen for equipment returns
    this.eventSystem.subscribe('equipment_return', (event: any) => {
      this.requestSync({
        type: 'return',
        equipmentId: event.data.equipmentId,
        jobId: event.data.jobId,
        reason: 'return event',
        priority: 'high'
      });
    });
  }

  // Main sync request interface
  requestSync(params: {
    type: EquipmentSyncRequest['type'];
    equipmentId: string;
    jobId?: string;
    nodeId?: string;
    newStatus?: string;
    reason: string;
    priority?: 'low' | 'medium' | 'high';
    data?: any;
  }): void {
    const request: EquipmentSyncRequest = {
      id: `${params.type}-${params.equipmentId}-${Date.now()}`,
      priority: params.priority || 'medium',
      timestamp: Date.now(),
      ...params
    };

    // Use equipment ID as key to deduplicate rapid requests for same equipment
    const queueKey = `${params.equipmentId}-${params.type}`;
    this.syncQueue.set(queueKey, request);

    console.log(`🔄 Equipment sync requested: ${params.reason} (${params.equipmentId})`);

    // High priority processes immediately
    if (request.priority === 'high') {
      this.processQueue();
    } else {
      this.scheduleBatchProcess();
    }
  }

  // Schedule batch processing
  private scheduleBatchProcess(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processQueue();
    }, this.BATCH_DELAY);
  }

  // Process sync queue
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.syncQueue.size === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`⚙️ Processing ${this.syncQueue.size} equipment sync request(s)`);

    try {
      const requests = Array.from(this.syncQueue.values())
        .sort((a, b) => {
          // Sort by priority, then timestamp
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }
          return b.timestamp - a.timestamp;
        });

      // Clear queue before processing
      this.syncQueue.clear();

      // Process each request
      for (const request of requests) {
        await this.processSyncRequest(request);
      }

      // Notify completion
      const onComplete = this.updateCallbacks.get('complete');
      if (onComplete) onComplete();

    } catch (error) {
      console.error('❌ Equipment sync failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Process individual sync request
  private async processSyncRequest(request: EquipmentSyncRequest): Promise<void> {
    try {
      console.log(`⚙️ Processing: ${request.type} for ${request.equipmentId}`);

      switch (request.type) {
        case 'status_change':
          await this.handleStatusChange(request);
          break;
        case 'allocation':
          await this.handleAllocation(request);
          break;
        case 'return':
          await this.handleReturn(request);
          break;
        case 'node_sync':
          await this.handleNodeSync(request);
          break;
        case 'extras_deploy':
          await this.handleExtrasDeploy(request);
          break;
        case 'validation':
          await this.handleValidation(request);
          break;
      }

    } catch (error) {
      console.error(`❌ Failed to process ${request.type} for ${request.equipmentId}:`, error);
      this.handleSyncError(request, error);
    }
  }

  // Handle equipment status changes
  private async handleStatusChange(request: EquipmentSyncRequest): Promise<void> {
    const { equipmentId, newStatus, jobId } = request;
    
    // Validate status change
    if (!this.isValidStatusTransition(equipmentId, newStatus)) {
      this.createConflict(equipmentId, 'status_mismatch', request);
      return;
    }

    // Update database
    await tursoDb.updateEquipmentStatus(equipmentId, newStatus, jobId);
    
    // Update local state
    this.equipmentState.set(equipmentId, { status: newStatus, jobId });
    
    // Notify subscribers
    const onChange = this.updateCallbacks.get('change');
    if (onChange) onChange(equipmentId, { status: newStatus, jobId });

    console.log(`✅ Status changed: ${equipmentId} -> ${newStatus}`);
  }

  // Handle equipment allocation
  private async handleAllocation(request: EquipmentSyncRequest): Promise<void> {
    const { equipmentId, jobId } = request;
    
    // Check availability
    if (!await this.validateEquipmentAvailability(equipmentId, jobId)) {
      this.createConflict(equipmentId, 'allocation_conflict', request);
      return;
    }

    // Allocate equipment
    await tursoDb.allocateEquipment(equipmentId, jobId);
    
    // Update state
    this.equipmentState.set(equipmentId, { status: 'deployed', jobId });
    
    console.log(`✅ Allocated: ${equipmentId} -> Job ${jobId}`);
  }

  // Handle equipment return
  private async handleReturn(request: EquipmentSyncRequest): Promise<void> {
    const { equipmentId, jobId } = request;
    
    // Return equipment to available status
    await tursoDb.returnEquipment(equipmentId, jobId);
    
    // Update state
    this.equipmentState.set(equipmentId, { status: 'available', jobId: null });
    
    console.log(`✅ Returned: ${equipmentId} from Job ${jobId}`);
  }

  // Handle node synchronization
  private async handleNodeSync(request: EquipmentSyncRequest): Promise<void> {
    const { equipmentId, nodeId, data } = request;
    
    // Sync node data with equipment state
    const equipment = this.inventoryData?.individualEquipment?.find((eq: any) => 
      eq.id === equipmentId || eq.equipmentId === equipmentId
    );

    if (equipment && data?.setNodes) {
      data.setNodes((nodes: any[]) => 
        nodes.map(node => 
          node.id === nodeId 
            ? { ...node, data: { ...node.data, equipmentId: equipment.equipmentId, label: equipment.equipmentId } }
            : node
        )
      );
      console.log(`✅ Node synced: ${nodeId} -> ${equipment.equipmentId}`);
    }
  }

  // Handle extras deployment
  private async handleExtrasDeploy(request: EquipmentSyncRequest): Promise<void> {
    const { equipmentId, jobId, data } = request;
    const extra = data?.extra;

    if (!extra) return;

    if (extra.individualEquipmentId) {
      // Handle individual equipment
      await this.handleAllocation({ ...request, type: 'allocation' });
    } else {
      // Handle bulk equipment deployment
      await this.deployBulkEquipment(extra, jobId);
    }

    console.log(`✅ Extra equipment deployed: ${equipmentId}`);
  }

  // Handle validation requests
  private async handleValidation(request: EquipmentSyncRequest): Promise<void> {
    const { equipmentId, jobId } = request;
    const isAvailable = await this.validateEquipmentAvailability(equipmentId, jobId);
    
    if (!isAvailable) {
      this.createConflict(equipmentId, 'availability_conflict', request);
    }
  }

  // Utility methods
  private async validateEquipmentAvailability(equipmentId: string, jobId?: string): Promise<boolean> {
    try {
      const equipment = await tursoDb.getEquipmentById(equipmentId);
      return equipment && (equipment.status === 'available' || equipment.jobId === jobId);
    } catch {
      return false;
    }
  }

  private isValidStatusTransition(equipmentId: string, newStatus?: string): boolean {
    if (!newStatus) return false;
    const validStatuses = ['available', 'deployed', 'maintenance', 'red-tagged', 'retired'];
    return validStatuses.includes(newStatus);
  }

  private async deployBulkEquipment(extra: any, jobId?: string): Promise<void> {
    // Implementation for bulk equipment deployment
    console.log(`Deploying bulk equipment: ${extra.equipmentTypeId}, quantity: ${extra.quantity}`);
  }

  private createConflict(equipmentId: string, type: EquipmentConflict['type'], request: EquipmentSyncRequest): void {
    const conflict: EquipmentConflict = {
      equipmentId,
      type,
      currentState: this.equipmentState.get(equipmentId),
      requestedState: { status: request.newStatus, jobId: request.jobId },
      jobId: request.jobId || '',
      details: `Conflict in ${request.type}: ${request.reason}`
    };

    this.conflicts.set(equipmentId, conflict);
    
    const onConflict = this.updateCallbacks.get('conflict');
    if (onConflict) onConflict(conflict);
    
    console.warn(`⚠️ Conflict detected for ${equipmentId}:`, conflict);
  }

  private handleSyncError(request: EquipmentSyncRequest, error: any): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Sync error for ${request.equipmentId}:`, errorMessage);
    toast.error(`Equipment sync failed: ${errorMessage}`);
  }

  // Public API
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      queueSize: this.syncQueue.size,
      conflictsCount: this.conflicts.size,
      equipmentStateCount: this.equipmentState.size
    };
  }

  getConflicts(): EquipmentConflict[] {
    return Array.from(this.conflicts.values());
  }

  resolveConflict(equipmentId: string, resolution: 'accept_current' | 'accept_requested' | 'manual'): void {
    const conflict = this.conflicts.get(equipmentId);
    if (conflict) {
      this.conflicts.delete(equipmentId);
      console.log(`✅ Conflict resolved for ${equipmentId}: ${resolution}`);
    }
  }

  clearQueue(): void {
    this.syncQueue.clear();
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    console.log('🧹 Equipment sync queue cleared');
  }
}

// Singleton instance
export const unifiedEquipmentSync = new UnifiedEquipmentSyncManager();