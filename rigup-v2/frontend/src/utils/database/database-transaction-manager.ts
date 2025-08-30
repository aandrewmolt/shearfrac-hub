import { tursoDb } from '@/services/tursoDb';
import { toast } from 'sonner';

// Types for database operations
export interface DatabaseOperation<T = unknown> {
  id: string;
  type: 'create' | 'update' | 'delete' | 'query';
  table: string;
  operation: () => Promise<T>;
  rollback?: () => Promise<void>;
  retryable?: boolean;
  critical?: boolean;
}

export interface TransactionOptions {
  isolationLevel?: 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable';
  timeout?: number;
  retries?: number;
  onProgress?: (completed: number, total: number) => void;
  onError?: (error: Error, operation: DatabaseOperation) => void;
}

export interface TransactionResult<T = unknown> {
  success: boolean;
  results?: T[];
  errors?: Array<{ operation: string; error: Error }>;
  rollbackSuccessful?: boolean;
  duration?: number;
}

export interface SavePoint {
  id: string;
  operations: DatabaseOperation[];
  timestamp: Date;
}

/**
 * Enhanced transaction manager with proper error handling and rollback support
 */
export class DatabaseTransactionManager {
  private savePoints: Map<string, SavePoint> = new Map();
  private activeTransactions: Set<string> = new Set();
  private operationQueue: DatabaseOperation[] = [];
  private isProcessing = false;

  /**
   * Execute a transaction with multiple operations
   */
  async executeTransaction<T = unknown>(
    operations: DatabaseOperation<T>[],
    options: TransactionOptions = {}
  ): Promise<TransactionResult<T>> {
    const transactionId = this.generateTransactionId();
    const startTime = Date.now();
    const results: T[] = [];
    const errors: Array<{ operation: string; error: Error }> = [];
    const completedOperations: DatabaseOperation<T>[] = [];

    // Check for active transaction
    if (this.activeTransactions.has(transactionId)) {
      return {
        success: false,
        errors: [{ 
          operation: 'transaction_start', 
          error: new Error('Transaction already in progress') 
        }],
      };
    }

    this.activeTransactions.add(transactionId);

    try {
      // Create savepoint
      await this.createSavePoint(transactionId, operations);

      // Execute operations
      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];
        
        try {
          // Handle timeout
          const result = await this.executeWithTimeout(
            operation.operation(),
            options.timeout || 30000
          );
          
          results.push(result);
          completedOperations.push(operation);

          // Report progress
          if (options.onProgress) {
            options.onProgress(i + 1, operations.length);
          }
        } catch (error) {
          const err = error as Error;
          errors.push({ operation: operation.id, error: err });

          // Handle critical operations
          if (operation.critical) {
            // Attempt rollback for critical operation failure
            const rollbackResult = await this.rollbackOperations(
              completedOperations,
              transactionId
            );
            
            return {
              success: false,
              results: results.slice(0, completedOperations.length),
              errors,
              rollbackSuccessful: rollbackResult,
              duration: Date.now() - startTime,
            };
          }

          // Handle retryable operations
          if (operation.retryable && options.retries) {
            const retryResult = await this.retryOperation(
              operation,
              options.retries
            );
            
            if (retryResult.success) {
              results.push(retryResult.result!);
              completedOperations.push(operation);
            } else {
              // Call error handler
              if (options.onError) {
                options.onError(err, operation);
              }
            }
          }
        }
      }

      // Commit transaction
      await this.commitTransaction(transactionId);

      return {
        success: errors.length === 0,
        results,
        errors: errors.length > 0 ? errors : undefined,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      // Attempt rollback on transaction failure
      const rollbackResult = await this.rollbackOperations(
        completedOperations,
        transactionId
      );
      
      return {
        success: false,
        errors: [{ 
          operation: 'transaction', 
          error: error as Error 
        }],
        rollbackSuccessful: rollbackResult,
        duration: Date.now() - startTime,
      };
    } finally {
      // Cleanup
      this.activeTransactions.delete(transactionId);
      this.savePoints.delete(transactionId);
    }
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), timeout)
      ),
    ]);
  }

  /**
   * Retry a failed operation
   */
  private async retryOperation<T>(
    operation: DatabaseOperation<T>,
    maxRetries: number
  ): Promise<{ success: boolean; result?: T }> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
        const result = await operation.operation();
        return { success: true, result };
      } catch (error) {
        lastError = error as Error;
      }
    }
    
    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Rollback completed operations
   */
  private async rollbackOperations<T>(
    operations: DatabaseOperation<T>[],
    transactionId: string
  ): Promise<boolean> {
    try {
      // Rollback in reverse order
      for (let i = operations.length - 1; i >= 0; i--) {
        const operation = operations[i];
        
        if (operation.rollback) {
          try {
            await operation.rollback();
          } catch (rollbackError) {
            console.error(`Rollback failed for operation ${operation.id}:`, rollbackError);
            return false;
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Rollback process failed:', error);
      return false;
    }
  }

  /**
   * Create a savepoint for the transaction
   */
  private async createSavePoint(
    transactionId: string,
    operations: DatabaseOperation[]
  ): Promise<void> {
    this.savePoints.set(transactionId, {
      id: transactionId,
      operations: [...operations],
      timestamp: new Date(),
    });
  }

  /**
   * Commit the transaction
   */
  private async commitTransaction(transactionId: string): Promise<void> {
    // In a real database, this would commit the transaction
    // For now, just clean up the savepoint
    this.savePoints.delete(transactionId);
  }

  /**
   * Queue operations for batch processing
   */
  async queueOperation<T>(operation: DatabaseOperation<T>): Promise<void> {
    this.operationQueue.push(operation);
    
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  /**
   * Process queued operations
   */
  private async processQueue(): Promise<void> {
    if (this.operationQueue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      const batch = this.operationQueue.splice(0, 10); // Process 10 at a time
      await this.executeTransaction(batch);
      
      // Continue processing if more operations
      if (this.operationQueue.length > 0) {
        await this.processQueue();
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay helper for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Helper methods for common operations
   */

  async createWithRollback<T>(
    table: string,
    data: Record<string, unknown>,
    createFn: () => Promise<T>,
    deleteFn: (id: string) => Promise<void>
  ): Promise<DatabaseOperation<T>> {
    return {
      id: `create_${table}_${Date.now()}`,
      type: 'create',
      table,
      operation: createFn,
      rollback: async () => {
        const result = await createFn();
        if (result && typeof result === 'object' && 'id' in result) {
          await deleteFn((result as { id: string }).id);
        }
      },
      retryable: true,
    };
  }

  async updateWithRollback<T>(
    table: string,
    id: string,
    updates: Record<string, unknown>,
    updateFn: () => Promise<T>,
    originalData: Record<string, unknown>
  ): Promise<DatabaseOperation<T>> {
    return {
      id: `update_${table}_${id}`,
      type: 'update',
      table,
      operation: updateFn,
      rollback: async () => {
        // Restore original data
        switch (table) {
          case 'jobs':
            await tursoDb.updateJob(id, originalData);
            break;
          case 'individual_equipment':
            await tursoDb.updateIndividualEquipment(id, originalData);
            break;
          case 'equipment_types':
            await tursoDb.updateEquipmentType(id, originalData);
            break;
          case 'storage_locations':
            await tursoDb.updateStorageLocation(id, originalData);
            break;
        }
      },
      retryable: true,
    };
  }

  async deleteWithRollback<T>(
    table: string,
    id: string,
    deleteFn: () => Promise<void>,
    data: Record<string, unknown>
  ): Promise<DatabaseOperation<void>> {
    return {
      id: `delete_${table}_${id}`,
      type: 'delete',
      table,
      operation: deleteFn,
      rollback: async () => {
        // Re-create the deleted item
        switch (table) {
          case 'jobs':
            await tursoDb.createJob(data);
            break;
          case 'individual_equipment':
            await tursoDb.createIndividualEquipment(data);
            break;
          case 'equipment_types':
            await tursoDb.createEquipmentType(data);
            break;
          case 'storage_locations':
            await tursoDb.createStorageLocation(data);
            break;
        }
      },
      retryable: false, // Deletes should not be retried
      critical: true,
    };
  }
}

// Singleton instance
let transactionManager: DatabaseTransactionManager | null = null;

export function getTransactionManager(): DatabaseTransactionManager {
  if (!transactionManager) {
    transactionManager = new DatabaseTransactionManager();
  }
  return transactionManager;
}

// Convenience exports
export const executeTransaction = <T = unknown>(
  operations: DatabaseOperation<T>[],
  options?: TransactionOptions
) => getTransactionManager().executeTransaction(operations, options);

export const queueOperation = <T = unknown>(
  operation: DatabaseOperation<T>
) => getTransactionManager().queueOperation(operation);

// Example usage functions
export async function transferEquipmentBatch(
  equipmentIds: string[],
  fromLocationId: string,
  toLocationId: string
): Promise<TransactionResult> {
  const operations: DatabaseOperation[] = equipmentIds.map(id => ({
    id: `transfer_${id}`,
    type: 'update',
    table: 'individual_equipment',
    operation: async () => {
      return tursoDb.updateIndividualEquipment(id, {
        location_id: toLocationId,
        location_type: 'storage',
      });
    },
    rollback: async () => {
      await tursoDb.updateIndividualEquipment(id, {
        location_id: fromLocationId,
        location_type: 'storage',
      });
    },
    retryable: true,
  }));

  return executeTransaction(operations, {
    timeout: 60000,
    retries: 3,
    onProgress: (completed, total) => {
      const percentage = Math.round((completed / total) * 100);
      console.log(`Transfer progress: ${percentage}%`);
    },
  });
}

export async function deployEquipmentToJob(
  jobId: string,
  equipmentAssignments: Array<{ equipmentId: string; nodeId: string }>
): Promise<TransactionResult> {
  const operations: DatabaseOperation[] = [];

  // Update each equipment item
  for (const assignment of equipmentAssignments) {
    operations.push({
      id: `deploy_${assignment.equipmentId}`,
      type: 'update',
      table: 'individual_equipment',
      operation: async () => {
        return tursoDb.updateIndividualEquipment(assignment.equipmentId, {
          job_id: jobId,
          status: 'deployed',
          location_type: 'job',
        });
      },
      rollback: async () => {
        await tursoDb.updateIndividualEquipment(assignment.equipmentId, {
          job_id: null,
          status: 'available',
          location_type: 'storage',
        });
      },
      retryable: true,
      critical: true,
    });
  }

  // Update job with equipment assignment
  operations.push({
    id: `update_job_${jobId}`,
    type: 'update',
    table: 'jobs',
    operation: async () => {
      const job = await tursoDb.getJobById(jobId);
      if (!job) throw new Error('Job not found');

      const equipmentMap = equipmentAssignments.reduce((acc, curr) => {
        acc[curr.nodeId] = curr.equipmentId;
        return acc;
      }, {} as Record<string, string>);

      return tursoDb.updateJob(jobId, {
        ...job,
        equipment_assignment: equipmentMap,
        equipment_allocated: true,
      });
    },
    rollback: async () => {
      const job = await tursoDb.getJobById(jobId);
      if (job) {
        await tursoDb.updateJob(jobId, {
          ...job,
          equipment_assignment: {},
          equipment_allocated: false,
        });
      }
    },
    retryable: true,
    critical: true,
  });

  return executeTransaction(operations, {
    timeout: 120000,
    retries: 2,
    onProgress: (completed, total) => {
      const percentage = Math.round((completed / total) * 100);
      toast.info(`Deploying equipment: ${percentage}%`);
    },
  });
}
