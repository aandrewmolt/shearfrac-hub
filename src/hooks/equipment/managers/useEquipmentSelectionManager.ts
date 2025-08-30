import { useCallback } from 'react';
import { Node } from '@xyflow/react';
import { useInventory } from '@/contexts/InventoryContext';
import { toast } from 'sonner';
import edgeSync from '@/services/edgeFunctionSync';

interface Job {
  id: string;
  name: string;
  wellCount: number;
  hasWellsideGauge: boolean;
  createdAt: Date;
}

/**
 * Focused manager for equipment selection and assignment
 * Extracted from useEquipmentSelection monolith (328 lines)
 */
export const useEquipmentSelectionManager = (job: Job) => {
  const { data } = useInventory();

  // Handle equipment selection with validation
  const handleEquipmentSelect = useCallback(async (
    equipmentId: string,
    equipmentType: 'shearstream-box' | 'starlink' | 'customer-computer' | 'shearstream' | 'well-gauge' | 'y-adapter' | 'pressure-gauge-1502' | 'pressure-gauge-abra' | 'pressure-gauge-pencil',
    onValidationSuccess?: (equipmentId: string) => void,
    onValidationFailure?: (error: string) => void,
    validateEquipmentAvailability?: (equipmentId: string, jobId: string) => Promise<boolean>,
    allocateEquipment?: (equipmentId: string, allocation: any) => Promise<void>
  ) => {
    console.log(`validateEquipmentSelection called with: ${equipmentId}, job: ${job.id}`);
    
    try {
      // Handle equipment type selection - find available equipment of that type
      const equipmentTypeIds = ['shearstream-box', 'starlink', 'customer-computer', 'y-adapter', 'well-gauge', 'pressure-gauge-1502', 'pressure-gauge-abra', 'pressure-gauge-pencil'];
      if (equipmentTypeIds.includes(equipmentId.toLowerCase())) {
        console.log(`Handling equipment type selection for: ${equipmentId}`);
        
        // Find available equipment of this type
        const availableEquipment = data?.individualEquipment?.filter(
          eq => eq.equipmentTypeId === equipmentId && eq.status === 'available'
        ) || [];
        
        if (availableEquipment.length === 0) {
          const errorMsg = `No available ${equipmentId} equipment found`;
          console.error(errorMsg);
          toast.error(errorMsg);
          if (onValidationFailure) onValidationFailure(errorMsg);
          return false;
        }
        
        // Auto-select the first available equipment
        const selectedEquipment = availableEquipment[0];
        console.log(`Auto-selected equipment: ${selectedEquipment.equipmentId} for type ${equipmentId}`);
        
        if (onValidationSuccess) {
          onValidationSuccess(selectedEquipment.equipmentId || selectedEquipment.id);
        }
        return true;
      }

      // Find equipment in inventory
      const equipment = (data?.individualEquipment || []).find(
        eq => eq.equipmentId === equipmentId || eq.id === equipmentId
      );

      if (!equipment) {
        const errorMsg = `Equipment ${equipmentId} not found in inventory`;
        console.error(errorMsg);
        toast.error(errorMsg);
        if (onValidationFailure) onValidationFailure(errorMsg);
        return false;
      }

      // Check equipment status
      if (equipment.status === 'red-tagged') {
        const errorMsg = `${equipment.name} is red-tagged and cannot be used`;
        toast.error(errorMsg);
        if (onValidationFailure) onValidationFailure(errorMsg);
        return false;
      }

      if (equipment.status === 'maintenance') {
        const errorMsg = `${equipment.name} is currently in maintenance`;
        toast.error(errorMsg);
        if (onValidationFailure) onValidationFailure(errorMsg);
        return false;
      }

      if (equipment.status === 'retired') {
        const errorMsg = `${equipment.name} is retired and cannot be used`;
        toast.error(errorMsg);
        if (onValidationFailure) onValidationFailure(errorMsg);
        return false;
      }

      // Check availability if validator provided
      if (validateEquipmentAvailability) {
        const isAvailable = await validateEquipmentAvailability(equipmentId, job.id);
        if (!isAvailable) {
          const errorMsg = `${equipment.name} is not available for allocation`;
          toast.error(errorMsg);
          if (onValidationFailure) onValidationFailure(errorMsg);
          return false;
        }
      }

      // Allocate if allocator provided
      if (allocateEquipment) {
        await allocateEquipment(equipmentId, {
          jobId: job.id,
          jobName: job.name,
          equipmentType,
          timestamp: new Date().toISOString()
        });
      }

      // Sync to edge functions if enabled
      if (edgeSync.isEnabled()) {
        try {
          await edgeSync.equipment.allocate(equipmentId, job.id);
          console.log(`Equipment ${equipmentId} allocated to job ${job.id} via edge sync`);
        } catch (syncError) {
          console.error('Edge sync failed, adding to queue:', syncError);
          edgeSync.queue.add({
            type: 'equipment',
            action: 'update',
            data: { id: equipmentId, status: 'deployed', jobId: job.id }
          });
        }
      }

      // Success
      toast.success(`${equipment.name} selected successfully`);
      if (onValidationSuccess) onValidationSuccess(equipmentId);
      return true;

    } catch (error) {
      const errorMsg = `Failed to select equipment: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('Equipment selection error:', error);
      toast.error(errorMsg);
      if (onValidationFailure) onValidationFailure(errorMsg);
      return false;
    }
  }, [data, job]);

  // Handle bulk equipment assignment
  const handleEquipmentAssignment = useCallback((assignments: {
    shearstreamBoxes?: string[];
    starlink?: string;
    customerComputers?: string[];
  }) => {
    const results: Array<{ equipmentId: string; success: boolean; error?: string }> = [];
    
    // Validate all assignments
    Object.entries(assignments).forEach(([type, equipmentIds]) => {
      const ids = Array.isArray(equipmentIds) ? equipmentIds : [equipmentIds];
      
      ids.forEach(equipmentId => {
        if (!equipmentId) return;
        
        const equipment = data.individualEquipment.find(
          eq => eq.equipmentId === equipmentId || eq.id === equipmentId
        );

        if (!equipment) {
          results.push({
            equipmentId,
            success: false,
            error: 'Equipment not found in inventory'
          });
          return;
        }

        if (['red-tagged', 'maintenance', 'retired'].includes(equipment.status)) {
          results.push({
            equipmentId,
            success: false,
            error: `Equipment is ${equipment.status}`
          });
          return;
        }

        results.push({
          equipmentId,
          success: true
        });
      });
    });

    // Report results
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    if (failed > 0) {
      const failedEquipment = results.filter(r => !r.success);
      toast.error(`${failed} equipment assignment(s) failed`, {
        description: failedEquipment.map(f => `${f.equipmentId}: ${f.error}`).join(', ')
      });
    }

    if (successful > 0) {
      toast.success(`${successful} equipment assigned successfully`);
    }

    return {
      successful,
      failed,
      results
    };
  }, [data]);

  // Get available equipment by type
  const getAvailableEquipmentByType = useCallback((equipmentTypeId: string) => {
    return data.individualEquipment.filter(equipment => {
      const type = data.equipmentTypes.find(t => t.id === equipment.typeId);
      return type && 
             type.id === equipmentTypeId &&
             ['available', 'allocated'].includes(equipment.status);
    });
  }, [data]);

  // Get equipment by category
  const getEquipmentByCategory = useCallback((category: string) => {
    return data.individualEquipment.filter(equipment => {
      const type = data.equipmentTypes.find(t => t.id === equipment.typeId);
      return type && 
             type.category === category &&
             ['available', 'allocated'].includes(equipment.status);
    });
  }, [data]);

  // Get equipment summary for job requirements
  const getJobEquipmentSummary = useCallback(() => {
    const shearstreamBoxes = getEquipmentByCategory('shearstream-box');
    const starlinks = getEquipmentByCategory('communication');
    const computers = getEquipmentByCategory('computer');

    return {
      shearstreamBoxes: {
        available: shearstreamBoxes.length,
        required: job.wellCount,
        sufficient: shearstreamBoxes.length >= job.wellCount,
        equipment: shearstreamBoxes
      },
      starlinks: {
        available: starlinks.length,
        required: 1,
        sufficient: starlinks.length >= 1,
        equipment: starlinks
      },
      customerComputers: {
        available: computers.length,
        required: 1,
        sufficient: computers.length >= 1,
        equipment: computers
      },
      gauges: job.hasWellsideGauge ? {
        available: getEquipmentByCategory('gauge').length,
        required: job.wellCount,
        sufficient: getEquipmentByCategory('gauge').length >= job.wellCount,
        equipment: getEquipmentByCategory('gauge')
      } : null
    };
  }, [job, getEquipmentByCategory]);

  return {
    // Core selection logic
    handleEquipmentSelect,
    handleEquipmentAssignment,
    
    // Query functions
    getAvailableEquipmentByType,
    getEquipmentByCategory,
    getJobEquipmentSummary
  };
};