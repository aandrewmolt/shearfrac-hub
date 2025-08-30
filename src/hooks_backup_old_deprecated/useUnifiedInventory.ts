import { useMemo } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { useInventoryMapperContext } from '@/contexts/InventoryMapperContext';
import { InventoryData, IndividualEquipment, EquipmentType, StorageLocation } from '@/types/inventory';
import { getEquipmentDisplayLocation } from '@/utils/equipmentLocation';

/**
 * UNIFIED INVENTORY HOOK - Single source of truth for all equipment data
 * 
 * This hook consolidates:
 * - Database inventory (InventoryContext) 
 * - Job allocation state (InventoryMapperContext)
 * - Equipment location logic
 * 
 * USE THIS INSTEAD OF:
 * - useInventoryData() (deprecated localStorage approach)
 * - Direct context access
 * - Separate allocation hooks
 */
export const useUnifiedInventory = () => {
  const inventoryContext = useInventory();
  const mapperContext = useInventoryMapperContext();

  // Unified data with allocation state merged
  const unifiedData: InventoryData = useMemo(() => {
    const baseData = inventoryContext.data;
    
    // Enhance individual equipment with allocation state
    const enhancedIndividualEquipment = baseData.individualEquipment.map(equipment => {
      const allocationState = mapperContext.sharedEquipmentState.get(equipment.id);
      const allocation = mapperContext.allocations.get(equipment.id);
      
      return {
        ...equipment,
        // Merge allocation information
        allocationState: allocationState?.status || 'available',
        allocatedToJob: allocation?.jobId,
        allocatedToNode: allocation?.nodeId,
        lastAllocationUpdate: allocationState?.lastUpdated,
        // Use centralized location logic
        displayLocation: getEquipmentDisplayLocation(equipment),
        // Include conflict information
        hasConflict: mapperContext.conflicts.some(c => c.equipmentId === equipment.id),
      };
    });

    return {
      ...baseData,
      individualEquipment: enhancedIndividualEquipment,
      // Remove legacy equipmentItems - force migration to individual equipment only
      equipmentItems: [],
    };
  }, [inventoryContext.data, mapperContext.sharedEquipmentState, mapperContext.allocations, mapperContext.conflicts]);

  // Unified operations that coordinate both contexts
  const operations = useMemo(() => ({
    // Equipment queries with allocation awareness
    getEquipmentById: (id: string) => {
      return unifiedData.individualEquipment.find(eq => eq.id === id);
    },

    getEquipmentByType: (typeId: string) => {
      return unifiedData.individualEquipment.filter(eq => eq.equipmentTypeId === typeId);
    },

    getEquipmentByLocation: (locationId: string, locationType: 'storage' | 'job' = 'storage') => {
      return unifiedData.individualEquipment.filter(eq => {
        if (locationType === 'job') {
          return eq.allocatedToJob === locationId;
        }
        return eq.storageLocationId === locationId && !eq.allocatedToJob;
      });
    },

    getAvailableEquipment: (typeId?: string) => {
      let available = unifiedData.individualEquipment.filter(eq => 
        eq.status === 'available' && 
        !eq.allocatedToJob &&
        !eq.hasConflict
      );
      
      if (typeId) {
        available = available.filter(eq => eq.equipmentTypeId === typeId);
      }
      
      return available;
    },

    getDeployedEquipment: (jobId?: string) => {
      let deployed = unifiedData.individualEquipment.filter(eq => 
        eq.status === 'deployed' || eq.allocatedToJob
      );
      
      if (jobId) {
        deployed = deployed.filter(eq => eq.allocatedToJob === jobId);
      }
      
      return deployed;
    },

    // Unified allocation operations
    allocateEquipment: async (equipmentId: string, jobId: string, nodeId?: string) => {
      // Update both contexts atomically
      const equipment = unifiedData.individualEquipment.find(eq => eq.id === equipmentId);
      if (!equipment) throw new Error('Equipment not found');

      // Update inventory status
      await inventoryContext.updateIndividualEquipment(equipmentId, {
        status: 'deployed'
      });

      // Update allocation state
      mapperContext.setAllocation(equipmentId, {
        equipmentId,
        jobId,
        nodeId,
        allocatedAt: new Date(),
        status: 'allocated'
      });

      mapperContext.updateSharedEquipment(equipmentId, {
        status: 'deployed',
        currentJobId: jobId,
        lastUpdated: new Date()
      });
    },

    deallocateEquipment: async (equipmentId: string) => {
      const equipment = unifiedData.individualEquipment.find(eq => eq.id === equipmentId);
      if (!equipment) throw new Error('Equipment not found');

      // Update inventory status
      await inventoryContext.updateIndividualEquipment(equipmentId, {
        status: 'available'
      });

      // Clear allocation state
      mapperContext.removeAllocation(equipmentId);
      mapperContext.updateSharedEquipment(equipmentId, {
        status: 'available',
        currentJobId: undefined,
        lastUpdated: new Date()
      });

      // Remove any conflicts
      mapperContext.removeConflict(equipmentId);
    },

    // Equipment mutations with coordination
    updateEquipment: async (equipmentId: string, updates: Partial<IndividualEquipment>) => {
      await inventoryContext.updateIndividualEquipment(equipmentId, updates);
      
      // Update shared state if status changed
      if (updates.status) {
        mapperContext.updateSharedEquipment(equipmentId, {
          status: updates.status,
          lastUpdated: new Date()
        });
      }
    },

    deleteEquipment: async (equipmentId: string) => {
      // Remove from all contexts
      await inventoryContext.deleteIndividualEquipment(equipmentId);
      mapperContext.removeAllocation(equipmentId);
      mapperContext.removeConflict(equipmentId);
    },

    // Batch operations
    batchAllocateEquipment: async (allocations: Array<{equipmentId: string, jobId: string, nodeId?: string}>) => {
      const updates = allocations.map(alloc => ({
        equipmentId: alloc.equipmentId,
        state: { status: 'deployed' as const, currentJobId: alloc.jobId, lastUpdated: new Date() }
      }));
      
      mapperContext.batchUpdateEquipment(updates);
      
      // Update database status for all equipment
      for (const alloc of allocations) {
        await inventoryContext.updateIndividualEquipment(alloc.equipmentId, { status: 'deployed' });
        mapperContext.setAllocation(alloc.equipmentId, {
          equipmentId: alloc.equipmentId,
          jobId: alloc.jobId,
          nodeId: alloc.nodeId,
          allocatedAt: new Date(),
          status: 'allocated'
        });
      }
    },

    // Statistics and summaries
    getInventorySummary: () => {
      const total = unifiedData.individualEquipment.length;
      const available = unifiedData.individualEquipment.filter(eq => eq.status === 'available' && !eq.allocatedToJob).length;
      const deployed = unifiedData.individualEquipment.filter(eq => eq.status === 'deployed' || eq.allocatedToJob).length;
      const maintenance = unifiedData.individualEquipment.filter(eq => eq.status === 'maintenance').length;
      const redTagged = unifiedData.individualEquipment.filter(eq => eq.status === 'red-tagged').length;
      const conflicts = mapperContext.conflicts.length;

      return {
        total,
        available,
        deployed,
        maintenance,
        redTagged,
        conflicts,
        utilizationRate: total > 0 ? (deployed / total) * 100 : 0
      };
    },

    // Data refresh
    refreshData: async () => {
      await inventoryContext.refreshData();
      // Clear expired allocations
      mapperContext.clearConflicts();
    }
  }), [unifiedData, inventoryContext, mapperContext]);

  return {
    // Unified data
    data: unifiedData,
    
    // Loading states
    isLoading: inventoryContext.isLoading,
    syncStatus: mapperContext.syncStatus,
    lastSyncTime: mapperContext.lastSyncTime,
    
    // Operations
    ...operations,
    
    // Direct context access (for migration period)
    _inventoryContext: inventoryContext,
    _mapperContext: mapperContext,
  };
};