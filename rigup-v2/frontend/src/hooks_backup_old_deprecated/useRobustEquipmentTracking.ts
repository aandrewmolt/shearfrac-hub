
import { useState, useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import { useComprehensiveEquipmentTracking } from './equipment/useComprehensiveEquipmentTracking';
import { useEquipmentAllocatorV2 } from './equipment/useEquipmentAllocatorV2';
import { useEquipmentValidatorV2 } from './equipment/useEquipmentValidatorV2';
import { useEquipmentReturnerV2 } from './equipment/useEquipmentReturnerV2';
import { toast } from 'sonner';

export const useRobustEquipmentTracking = (jobId: string, nodes: Node[], edges: Edge[]) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { analyzeEquipmentUsage, generateEquipmentReport } = useComprehensiveEquipmentTracking(nodes, edges);
  const { allocateEquipmentFromUsage } = useEquipmentAllocatorV2(jobId);
  const { validateInventoryConsistency, validateEquipmentAvailability } = useEquipmentValidatorV2(jobId);
  const { returnAllJobEquipment } = useEquipmentReturnerV2(jobId);

  const performComprehensiveAllocation = useCallback(async (locationId: string) => {
    if (!locationId) {
      toast.error('Please select a location before allocating equipment');
      return;
    }

    setIsProcessing(true);
    console.log(`Starting comprehensive equipment allocation for job ${jobId}`);
    
    try {
      const usage = analyzeEquipmentUsage();
      const validation = validateEquipmentAvailability(usage, locationId);
      
      // Show validation issues if any
      if (validation.issues.length > 0) {
        toast.error(`Cannot allocate equipment: ${validation.issues.join(', ')}`);
        setIsProcessing(false);
        return;
      }

      if (validation.warnings.length > 0) {
        toast.warning(`Equipment allocation warnings: ${validation.warnings.join(', ')}`);
      }

      const allocatedItems = await allocateEquipmentFromUsage(usage, locationId);

      // Provide detailed feedback
      if (allocatedItems.length > 0) {
        toast.success(`Equipment allocated: ${allocatedItems.join(', ')}`);
        console.log('Equipment allocation successful:', {
          jobId,
          locationId,
          allocatedItems,
        });
      } else {
        toast.info('No equipment changes needed - allocation up to date');
      }
    } catch (error) {
      console.error('Error during equipment allocation:', error);
      toast.error('Failed to allocate equipment');
    } finally {
      setIsProcessing(false);
    }
  }, [jobId, analyzeEquipmentUsage, validateEquipmentAvailability, allocateEquipmentFromUsage]);

  const validateInventoryConsistencyWrapper = useCallback(() => {
    const usage = analyzeEquipmentUsage();
    return validateInventoryConsistency(usage);
  }, [analyzeEquipmentUsage, validateInventoryConsistency]);

  return {
    performComprehensiveAllocation,
    returnAllJobEquipment,
    validateInventoryConsistency: validateInventoryConsistencyWrapper,
    analyzeEquipmentUsage,
    generateEquipmentReport,
    isProcessing
  };
};
