import { useCallback } from 'react';
import { executeTransaction, TransactionOperation } from '@/utils/transactionWrapper';
import { tursoDb } from '@/services/tursoDb';
import { toast } from 'sonner';
import { Job, JobEdge } from '@/types/types';
import { IndividualEquipment } from '@/types/inventory';

interface UseTransactionalSaveProps {
  jobId: string;
  equipmentAssignment?: {
    shearstreamBoxIds?: string[];
    starlinkId?: string;
    customerComputerIds?: string[];
  };
  extrasOnLocation?: IndividualEquipment[];
}

export const useTransactionalSave = ({ jobId, equipmentAssignment, extrasOnLocation }: UseTransactionalSaveProps) => {
  
  /**
   * Save job diagram with all related equipment in a transaction
   */
  const saveJobWithTransaction = useCallback(async (jobData: Job) => {
    const operations: TransactionOperation[] = [];

    // 1. Main job save operation
    operations.push({
      table: 'jobs',
      operation: 'update',
      data: {
        name: jobData.name,
        well_count: jobData.wellCount,
        has_wellside_gauge: jobData.hasWellsideGauge,
        nodes: jobData.nodes,
        edges: jobData.edges,
        company_computer_names: jobData.companyComputerNames,
        equipment_assignment: jobData.equipmentAssignment,
        equipment_allocated: jobData.equipmentAllocated,
        main_box_name: jobData.mainBoxName,
        satellite_name: jobData.satelliteName,
        wellside_gauge_name: jobData.wellsideGaugeName,
        selected_cable_type: jobData.selectedCableType,
        frac_baud_rate: jobData.fracBaudRate,
        gauge_baud_rate: jobData.gaugeBaudRate,
        frac_com_port: jobData.fracComPort,
        gauge_com_port: jobData.gaugeComPort,
        enhanced_config: jobData.enhancedConfig,
      },
      id: jobId
    });

    // 2. Update equipment status to 'deployed' for assigned equipment
    if (equipmentAssignment) {
      const deployedEquipmentIds: string[] = [];
      
      // Shearstream boxes
      if (equipmentAssignment.shearstreamBoxIds?.length > 0) {
        deployedEquipmentIds.push(...equipmentAssignment.shearstreamBoxIds);
      }
      
      // Starlink
      if (equipmentAssignment.starlinkId) {
        deployedEquipmentIds.push(equipmentAssignment.starlinkId);
      }
      
      // Customer computers
      if (equipmentAssignment.customerComputerIds?.length > 0) {
        deployedEquipmentIds.push(...equipmentAssignment.customerComputerIds);
      }

      // Add operations to update equipment status
      for (const equipmentId of deployedEquipmentIds) {
        operations.push({
          table: 'individual_equipment',
          operation: 'update',
          data: {
            status: 'deployed',
            job_id: jobId
          },
          id: equipmentId
        });
      }
    }

    // 3. Update extras equipment if provided
    if (extrasOnLocation && extrasOnLocation.length > 0) {
      for (const extra of extrasOnLocation) {
        if (extra.id) {
          operations.push({
            table: 'individual_equipment',
            operation: 'update',
            data: {
              status: 'deployed',
              job_id: jobId,
              name: extra.name || '' // Sync name if changed
            },
            id: extra.id
          });
        }
      }
    }

    // Execute all operations in a transaction
    const result = await executeTransaction(operations, {
      showToast: false // We'll handle toasts ourselves
    });

    if (result.success) {
      console.log('Job saved successfully with transaction');
      // Only show toast for manual saves, not auto-saves
      return true;
    } else {
      console.error('Failed to save job:', result.error);
      toast.error(`Failed to save job: ${result.error}`);
      return false;
    }
  }, [jobId, equipmentAssignment, extrasOnLocation]);

  /**
   * Remove equipment from job (set status back to 'available')
   */
  const removeEquipmentFromJob = useCallback(async (equipmentIds: string[]) => {
    const operations: TransactionOperation[] = equipmentIds.map(id => ({
      table: 'individual_equipment',
      operation: 'update',
      data: {
        status: 'available',
        job_id: null
      },
      id
    }));

    const result = await executeTransaction(operations, {
      onSuccess: () => toast.success('Equipment removed from job'),
      onError: (error) => toast.error(`Failed to remove equipment: ${error}`)
    });

    return result.success;
  }, []);

  /**
   * Bulk update edge cable types in a transaction
   */
  const updateEdgeCableTypes = useCallback(async (edges: Array<{ id: string; cableTypeId: string }>) => {
    // First get the current job data
    const currentJob = await tursoDb.getJobById(jobId);

    if (!currentJob) {
      toast.error('Failed to fetch current job data');
      return false;
    }

    // Update the edges with new cable types
    const updatedEdges = currentJob.edges.map((edge: JobEdge) => {
      const update = edges.find(e => e.id === edge.id);
      if (update) {
        return {
          ...edge,
          data: {
            ...edge.data,
            cableTypeId: update.cableTypeId
          }
        };
      }
      return edge;
    });

    // Save the updated edges
    const operations: TransactionOperation[] = [{
      table: 'jobs',
      operation: 'update',
      data: { edges: updatedEdges },
      id: jobId
    }];

    const result = await executeTransaction(operations, {
      onSuccess: () => toast.success('Cable types updated'),
      onError: (error) => toast.error(`Failed to update cable types: ${error}`)
    });

    return result.success;
  }, [jobId]);

  return {
    saveJobWithTransaction,
    removeEquipmentFromJob,
    updateEdgeCableTypes
  };
};