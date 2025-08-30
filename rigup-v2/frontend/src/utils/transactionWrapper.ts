import { tursoDb } from '@/services/tursoDb';
import { toast } from 'sonner';

export interface TransactionOperation {
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data?: Record<string, unknown>;
  conditions?: { column: string; value: unknown }[];
  id?: string;
}

export interface TransactionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  rollbackData?: string[];
}

export class TransactionManager {
  /**
   * Execute multiple database operations
   * Note: Turso web client doesn't support true transactions,
   * so this is a best-effort implementation
   */
  async executeTransaction<T = unknown>(
    operations: TransactionOperation[]
  ): Promise<TransactionResult<T>> {
    const results: unknown[] = [];

    try {
      for (const operation of operations) {
        const result = await this.executeOperation(operation);
        results.push(result);
      }

      return {
        success: true,
        data: results as T
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown transaction error',
        data: null as T
      };
    }
  }

  private async executeOperation(operation: TransactionOperation): Promise<unknown> {
    const { op, table, data, id, conditions } = operation;
    
    switch (op) {
      case 'insert':
        if (!data) throw new Error('Insert operation requires data');
        return await this.executeInsert(table, data);
      
      case 'update':
        if (!data) throw new Error('Update operation requires data');
        if (!id && !conditions) {
          throw new Error('Update operation requires either id or conditions');
        }
        return await this.executeUpdate(table, data, id, conditions);
      
      case 'delete':
        if (!id && !conditions) {
          throw new Error('Delete operation requires either id or conditions');
        }
        return await this.executeDelete(table, id, conditions);
      
      default:
        throw new Error(`Unknown operation: ${op}`);
    }
  }

  private async executeInsert(table: string, data: Record<string, unknown>): Promise<unknown> {
    // Map table names to tursoDb methods
    switch (table) {
      case 'jobs':
        return await tursoDb.createJob(data);
      case 'equipment_items':
        return await tursoDb.createEquipmentItem(data);
      case 'individual_equipment':
        return await tursoDb.createIndividualEquipment(data);
      case 'equipment_types':
        return await tursoDb.createEquipmentType(data);
      case 'storage_locations':
        return await tursoDb.createStorageLocation(data);
      case 'bulk_equipment_deployments':
        return await tursoDb.createBulkDeployment(data);
      default:
        throw new Error(`Unsupported table for insert: ${table}`);
    }
  }

  private async executeUpdate(
    table: string, 
    data: Record<string, unknown>, 
    id?: string,
    conditions?: { column: string; value: unknown }[]
  ): Promise<unknown> {
    if (!id) {
      throw new Error('Update operations require an ID');
    }

    switch (table) {
      case 'jobs':
        return await tursoDb.updateJob(id, data);
      case 'equipment_items':
        return await tursoDb.updateEquipmentItem(id, data);
      case 'individual_equipment':
        return await tursoDb.updateIndividualEquipment(id, data);
      case 'equipment_types':
        return await tursoDb.updateEquipmentType(id, data);
      case 'storage_locations':
        return await tursoDb.updateStorageLocation(id, data);
      case 'bulk_equipment_deployments':
        return await tursoDb.updateBulkDeployment(id, data);
      default:
        throw new Error(`Unsupported table for update: ${table}`);
    }
  }

  private async executeDelete(
    table: string,
    id?: string,
    conditions?: { column: string; value: unknown }[]
  ): Promise<void> {
    if (!id) {
      throw new Error('Delete operations require an ID');
    }

    switch (table) {
      case 'jobs':
        return await tursoDb.deleteJob(id);
      case 'equipment_items':
        return await tursoDb.deleteEquipmentItem(id);
      case 'individual_equipment':
        return await tursoDb.deleteIndividualEquipment(id);
      case 'equipment_types':
        return await tursoDb.deleteEquipmentType(id);
      case 'storage_locations':
        return await tursoDb.deleteStorageLocation(id);
      case 'bulk_equipment_deployments':
        return await tursoDb.deleteBulkDeployment(id);
      default:
        throw new Error(`Unsupported table for delete: ${table}`);
    }
  }

  /**
   * Helper method to batch multiple insert operations
   */
  async batchInsert<T extends Record<string, unknown>>(
    table: string,
    items: T[]
  ): Promise<TransactionResult<T[]>> {
    const operations: TransactionOperation[] = items.map(item => ({
      table,
      operation: 'insert',
      data: item
    }));

    return this.executeTransaction<T[]>(operations);
  }

  /**
   * Helper method to batch multiple update operations
   */
  async batchUpdate<T extends Record<string, unknown>>(
    table: string,
    updates: Array<{ id: string; data: T }>
  ): Promise<TransactionResult<T[]>> {
    const operations: TransactionOperation[] = updates.map(({ id, data }) => ({
      table,
      operation: 'update',
      id,
      data
    }));

    return this.executeTransaction<T[]>(operations);
  }

  /**
   * Helper method to batch multiple delete operations
   */
  async batchDelete(
    table: string,
    ids: string[]
  ): Promise<TransactionResult<void[]>> {
    const operations: TransactionOperation[] = ids.map(id => ({
      table,
      operation: 'delete',
      id
    }));

    return this.executeTransaction<void[]>(operations);
  }
}

// Lazy singleton instance
let instance: TransactionManager | null = null;

function getTransactionManager(): TransactionManager {
  if (!instance) {
    instance = new TransactionManager();
  }
  return instance;
}

// Export convenience methods with lazy initialization
export const executeTransaction = <T = unknown>(operations: TransactionOperation[]) => 
  getTransactionManager().executeTransaction<T>(operations);

export const batchInsert = (table: string, records: Record<string, unknown>[]) =>
  getTransactionManager().batchInsert(table, records);

export const batchUpdate = (table: string, updates: Array<{ id: string; data: Record<string, unknown> }>) =>
  getTransactionManager().batchUpdate(table, updates);

export const batchDelete = (table: string, ids: string[]) =>
  getTransactionManager().batchDelete(table, ids);

// Export the getter for direct access if needed
export { getTransactionManager as transactionManager };