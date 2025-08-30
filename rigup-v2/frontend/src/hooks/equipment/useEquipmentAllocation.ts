
import { useInventory } from '@/contexts/InventoryContext';
import { useComprehensiveEquipmentTracking } from './useComprehensiveEquipmentTracking';
import { toast } from 'sonner';
import { JobNode, JobEdge } from '@/types/types';

export const useEquipmentAllocation = (jobId: string, nodes: JobNode[] = [], edges: JobEdge[] = []) => {
  const { data, updateIndividualEquipment } = useInventory();
  const { analyzeEquipmentUsage, validateEquipmentAvailability, generateEquipmentReport } = useComprehensiveEquipmentTracking(nodes, edges);

  const allocateEquipmentType = async (
    typeId: string, 
    quantity: number, 
    locationId: string, 
    jobId: string,
    jobName: string = 'Current Job'
  ): Promise<string[]> => {
    // Find available individual equipment at location
    const availableEquipment = data.individualEquipment.filter(
      item => 
        item.typeId === typeId && 
        item.locationId === locationId && 
        item.status === 'available'
    );
    
    if (availableEquipment.length < quantity) {
      const equipmentType = data.equipmentTypes.find(type => type.id === typeId);
      toast.error(`Insufficient ${equipmentType?.name || 'equipment'} at selected location`);
      return [];
    }

    const allocatedIds: string[] = [];
    
    // Allocate individual items
    for (let i = 0; i < quantity; i++) {
      const equipment = availableEquipment[i];
      try {
        await updateIndividualEquipment(equipment.id, {
          status: 'deployed',
          jobId: jobId,
          locationId: jobId,
          notes: `Manually allocated from diagram analysis`
        });
        allocatedIds.push(equipment.equipmentId);
      } catch (error) {
        console.error('Failed to allocate equipment:', error);
        toast.error(`Failed to allocate ${equipment.equipmentId}`);
      }
    }

    return allocatedIds;
  };

  const performComprehensiveAllocation = async (locationId: string, nodes: JobNode[], edges: JobEdge[], jobName: string = 'Current Job') => {
    if (!locationId) {
      toast.error('Please select a location before allocating equipment');
      return;
    }

    console.log(`Starting comprehensive equipment allocation for job ${jobId}`);
    
    const usage = analyzeEquipmentUsage();
    const report = generateEquipmentReport(usage);
    const validation = validateEquipmentAvailability(usage, locationId);

    // Show validation issues if any
    if (validation.issues.length > 0) {
      toast.error(`Cannot allocate equipment: ${validation.issues.join(', ')}`);
      return;
    }

    if (validation.warnings.length > 0) {
      toast.warning(`Equipment allocation warnings: ${validation.warnings.join(', ')}`);
    }

    const allocatedItems: string[] = [];

    // Allocate cables as individual items
    for (const [typeId, details] of Object.entries(usage.cables)) {
      if (details.quantity > 0) {
        const allocatedIds = await allocateEquipmentType(typeId, details.quantity, locationId, jobId, jobName);
        if (allocatedIds.length > 0) {
          allocatedItems.push(`${allocatedIds.length}x ${details.typeName}`);
        }
      }
    }

    // Allocate other equipment as individual items
    const equipmentAllocations = [
      { typeId: 'pressure-gauge-1502', quantity: usage.gauges1502 || 0, name: '1502 Pressure Gauge' },
      { typeId: 'pressure-gauge-pencil', quantity: usage.pencilGauges || 0, name: 'Pencil Gauge' },
      { typeId: 'y-adapter', quantity: usage.adapters || 0, name: 'Y Adapter' },
      { typeId: 'shearstream-box', quantity: usage.shearstreamBoxes || 0, name: 'ShearStream Box' },
      { typeId: 'customer-computer', quantity: usage.computers || 0, name: 'Customer Computer' },
      { typeId: 'customer-tablet', quantity: 0, name: 'Customer Tablet' }, // Handled with computers
      { typeId: 'starlink', quantity: usage.satellite || 0, name: 'Starlink' },
    ];

    for (const { typeId, quantity, name } of equipmentAllocations) {
      if (quantity > 0) {
        const allocatedIds = await allocateEquipmentType(typeId, quantity, locationId, jobId, jobName);
        if (allocatedIds.length > 0) {
          allocatedItems.push(`${allocatedIds.length}x ${name}`);
        }
      }
    }

    // Provide detailed feedback
    if (allocatedItems.length > 0) {
      toast.success(`Equipment allocated: ${allocatedItems.join(', ')}`);
      console.log('Equipment allocation successful:', {
        jobId,
        locationId,
        allocatedItems,
        report,
      });
    } else {
      toast.info('No equipment changes needed - allocation up to date');
    }
  };

  return {
    performComprehensiveAllocation,
    allocateEquipmentType,
  };
};
