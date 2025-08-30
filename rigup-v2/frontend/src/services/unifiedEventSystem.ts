/**
 * Unified Event System for Cross-System Data Synchronization
 * Coordinates equipment, job, and contact changes across all components
 */

import { tursoDb } from './tursoDb';
import { toast } from 'sonner';

export interface SystemEvent {
  type: 'equipment_status_change' | 'equipment_allocation' | 'job_update' | 'contact_assignment' | 'equipment_return';
  source: string;
  data: Record<string, unknown>;
  timestamp: number;
  transactionId?: string;
}

export interface EquipmentStatusChangeEvent {
  equipmentId: string;
  oldStatus: string;
  newStatus: string;
  jobId?: string;
  locationId?: string;
  userId?: string;
}

export interface EquipmentAllocationEvent {
  equipmentId: string;
  jobId: string;
  nodeId?: string;
  allocationType: 'diagram' | 'bulk' | 'manual';
  quantity?: number;
}

export interface ContactAssignmentEvent {
  contactId: string;
  jobId: string;
  role?: string;
  action: 'assign' | 'unassign';
}

class UnifiedEventSystem {
  private listeners: Map<string, Set<(event: SystemEvent) => void>> = new Map();
  private eventQueue: SystemEvent[] = [];
  private processing = false;

  constructor() {
    // Process event queue every 100ms to batch operations
    setInterval(() => this.processEventQueue(), 100);
  }

  // Subscribe to specific event types
  subscribe(eventType: string, callback: (event: SystemEvent) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  // Emit events to all subscribers
  private emit(event: SystemEvent) {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`Error in event callback for ${event.type}:`, error);
        }
      });
    }

    // Also emit to 'all' listeners
    const allCallbacks = this.listeners.get('all');
    if (allCallbacks) {
      allCallbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in universal event callback:', error);
        }
      });
    }
  }

  // Add event to queue for processing
  private queueEvent(event: SystemEvent) {
    this.eventQueue.push(event);
  }

  // Process all queued events
  private async processEventQueue() {
    if (this.processing || this.eventQueue.length === 0) return;
    
    this.processing = true;
    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Group events by transaction ID for atomic processing
      const transactionGroups = new Map<string, SystemEvent[]>();
      const singleEvents: SystemEvent[] = [];

      events.forEach(event => {
        if (event.transactionId) {
          if (!transactionGroups.has(event.transactionId)) {
            transactionGroups.set(event.transactionId, []);
          }
          transactionGroups.get(event.transactionId)!.push(event);
        } else {
          singleEvents.push(event);
        }
      });

      // Process transaction groups atomically
      for (const [transactionId, groupEvents] of transactionGroups) {
        await this.processTransactionGroup(transactionId, groupEvents);
      }

      // Process single events
      for (const event of singleEvents) {
        await this.processSingleEvent(event);
      }
    } catch (error) {
      console.error('Error processing event queue:', error);
    } finally {
      this.processing = false;
    }
  }

  // Process a group of related events atomically
  private async processTransactionGroup(transactionId: string, events: SystemEvent[]) {
    console.log(`Processing transaction ${transactionId} with ${events.length} events`);
    
    try {
      // Process events sequentially (no transaction support available)
      for (const event of events) {
        await this.handleEvent(event);
      }

      // Emit events after successful database updates
      events.forEach(event => this.emit(event));
      
    } catch (error) {
      console.error(`Transaction ${transactionId} failed:`, error);
      toast.error('Failed to sync data changes');
    }
  }

  // Process single event
  private async processSingleEvent(event: SystemEvent) {
    try {
      await this.handleEvent(event);
      this.emit(event);
    } catch (error) {
      console.error(`Event ${event.type} failed:`, error);
    }
  }

  // Handle specific event types
  private async handleEvent(event: SystemEvent) {
    switch (event.type) {
      case 'equipment_status_change':
        await this.handleEquipmentStatusChange(event.data as EquipmentStatusChangeEvent);
        break;
      case 'equipment_allocation':
        await this.handleEquipmentAllocation(event.data as EquipmentAllocationEvent);
        break;
      case 'equipment_return':
        await this.handleEquipmentReturn(event.data);
        break;
      case 'job_update':
        await this.handleJobUpdate(event.data);
        break;
      case 'contact_assignment':
        await this.handleContactAssignment(event.data as ContactAssignmentEvent);
        break;
    }
  }

  // Equipment status change handler
  private async handleEquipmentStatusChange(data: EquipmentStatusChangeEvent) {
    const allEquipment = await tursoDb.getIndividualEquipment();
    const equipment = allEquipment.filter(item => item.equipmentId === data.equipmentId);
    if (!equipment.length) {
      console.warn(`Equipment ${data.equipmentId} not found for status change`);
      return;
    }

    for (const item of equipment) {
      await tursoDb.updateIndividualEquipment(item.id, {
        status: data.newStatus as any,
        jobId: data.jobId || null,
        locationId: data.locationId || item.locationId,
        updatedAt: new Date().toISOString()
      });
    }

    console.log(`Updated equipment ${data.equipmentId} status: ${data.oldStatus} -> ${data.newStatus}`);
  }

  // Equipment allocation handler
  private async handleEquipmentAllocation(data: EquipmentAllocationEvent) {
    const allEquipment = await tursoDb.getIndividualEquipment();
    const equipment = allEquipment.filter(item => item.equipmentId === data.equipmentId);
    if (!equipment.length) {
      console.warn(`Equipment ${data.equipmentId} not found for allocation`);
      return;
    }

    // Find available equipment
    const availableItems = equipment.filter(item => item.status === 'available');
    if (availableItems.length === 0) {
      throw new Error(`No available equipment found for ${data.equipmentId}`);
    }

    const item = availableItems[0];
    await tursoDb.updateIndividualEquipment(item.id, {
      status: 'deployed',
      jobId: data.jobId,
      updatedAt: new Date().toISOString()
    });

    console.log(`Allocated equipment ${data.equipmentId} to job ${data.jobId}`);
  }

  // Equipment return handler
  private async handleEquipmentReturn(data: Record<string, unknown>) {
    const { equipmentId, jobId, returnToLocation } = data;
    
    const allEquipment = await tursoDb.getIndividualEquipment();
    const equipment = allEquipment.filter(item => item.equipmentId === equipmentId as string);
    const deployedItems = equipment.filter(item => 
      item.status === 'deployed' && item.jobId === jobId
    );

    for (const item of deployedItems) {
      await tursoDb.updateIndividualEquipment(item.id, {
        status: 'available',
        jobId: null,
        locationId: returnToLocation || item.locationId,
        updatedAt: new Date().toISOString()
      });
    }

    console.log(`Returned equipment ${equipmentId} from job ${jobId}`);
  }

  // Job update handler
  private async handleJobUpdate(data: Record<string, unknown>) {
    // Handle job-related changes that affect equipment and contacts
    if (data.status === 'completed' || data.status === 'cancelled') {
      // Auto-return all equipment from completed/cancelled jobs
      const equipment = await tursoDb.getIndividualEquipment();
      const jobEquipment = equipment.filter(item => item.jobId === data.jobId);
      
      for (const item of jobEquipment) {
        await tursoDb.updateIndividualEquipment(item.id, {
          status: 'available',
          jobId: null,
          updatedAt: new Date().toISOString()
        });
      }
    }
  }

  // Contact assignment handler
  private async handleContactAssignment(data: ContactAssignmentEvent) {
    // Update contact-job relationships
    console.log(`Contact assignment: ${data.contactId} ${data.action} ${data.jobId}`);
    // This would integrate with contact management system
  }

  // Public API methods
  async equipmentStatusChanged(equipmentId: string, oldStatus: string, newStatus: string, jobId?: string, locationId?: string) {
    this.queueEvent({
      type: 'equipment_status_change',
      source: 'manual',
      data: { equipmentId, oldStatus, newStatus, jobId, locationId } as EquipmentStatusChangeEvent,
      timestamp: Date.now()
    });
  }

  async equipmentAllocated(equipmentId: string, jobId: string, allocationType: 'diagram' | 'bulk' | 'manual' = 'manual', nodeId?: string) {
    this.queueEvent({
      type: 'equipment_allocation',
      source: allocationType,
      data: { equipmentId, jobId, allocationType, nodeId } as EquipmentAllocationEvent,
      timestamp: Date.now()
    });
  }

  async equipmentReturned(equipmentId: string, jobId: string, returnToLocation?: string) {
    this.queueEvent({
      type: 'equipment_return',
      source: 'manual',
      data: { equipmentId, jobId, returnToLocation },
      timestamp: Date.now()
    });
  }

  async jobUpdated(jobId: string, changes: Record<string, unknown>) {
    this.queueEvent({
      type: 'job_update',
      source: 'manual',
      data: { jobId, ...changes },
      timestamp: Date.now()
    });
  }

  async contactAssigned(contactId: string, jobId: string, role?: string) {
    this.queueEvent({
      type: 'contact_assignment',
      source: 'manual',
      data: { contactId, jobId, role, action: 'assign' } as ContactAssignmentEvent,
      timestamp: Date.now()
    });
  }

  async contactUnassigned(contactId: string, jobId: string) {
    this.queueEvent({
      type: 'contact_assignment',
      source: 'manual',
      data: { contactId, jobId, action: 'unassign' } as ContactAssignmentEvent,
      timestamp: Date.now()
    });
  }

  // Start a transaction for related events
  startTransaction(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Add event to specific transaction
  addToTransaction(transactionId: string, type: SystemEvent['type'], source: string, data: Record<string, unknown>) {
    this.queueEvent({
      type,
      source,
      data,
      timestamp: Date.now(),
      transactionId
    });
  }
}

// Global instance
export const unifiedEventSystem = new UnifiedEventSystem();

// React hook for easy usage
export function useUnifiedEvents() {
  return {
    equipmentStatusChanged: unifiedEventSystem.equipmentStatusChanged.bind(unifiedEventSystem),
    equipmentAllocated: unifiedEventSystem.equipmentAllocated.bind(unifiedEventSystem),
    equipmentReturned: unifiedEventSystem.equipmentReturned.bind(unifiedEventSystem),
    jobUpdated: unifiedEventSystem.jobUpdated.bind(unifiedEventSystem),
    contactAssigned: unifiedEventSystem.contactAssigned.bind(unifiedEventSystem),
    contactUnassigned: unifiedEventSystem.contactUnassigned.bind(unifiedEventSystem),
    subscribe: unifiedEventSystem.subscribe.bind(unifiedEventSystem),
    startTransaction: unifiedEventSystem.startTransaction.bind(unifiedEventSystem),
    addToTransaction: unifiedEventSystem.addToTransaction.bind(unifiedEventSystem)
  };
}