import React, { useState, useEffect } from 'react';
import { useUnifiedEquipmentSync } from '@/hooks/useUnifiedEquipmentSync';
import { useInventory } from '@/contexts/InventoryContext';
import { Package, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EquipmentAllocationManagerProps {
  jobId: string;
  jobName: string;
}

export const EquipmentAllocationManager: React.FC<EquipmentAllocationManagerProps> = ({
  jobId,
  jobName
}) => {
  const {
    validateEquipmentAvailability,
    allocateEquipment,
    releaseEquipment,
    getEquipmentStatus,
    getJobEquipment,
    isValidating
  } = useUnifiedEquipmentSync({ jobId });
  
  const { data: inventoryData } = useInventory();
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>('');
  const [jobEquipment, setJobEquipment] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load equipment assigned to this job
    const equipment = getJobEquipment(jobId);
    setJobEquipment(equipment);
  }, [jobId, getJobEquipment]);

  const handleAllocate = async () => {
    if (!selectedEquipmentId) return;

    setIsLoading(true);
    try {
      await allocateEquipment(selectedEquipmentId, jobId, jobName);
      setSelectedEquipmentId('');
      
      // Refresh job equipment list
      const equipment = getJobEquipment(jobId);
      setJobEquipment(equipment);
    } catch (error) {
      console.error('Failed to allocate equipment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRelease = async (equipmentId: string) => {
    setIsLoading(true);
    try {
      await releaseEquipment(equipmentId, jobId);
      
      // Refresh job equipment list
      const equipment = getJobEquipment(jobId);
      setJobEquipment(equipment);
    } catch (error) {
      console.error('Failed to release equipment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEquipmentDisplay = (equipmentId: string) => {
    // Try to find in individual equipment first
    const individual = inventoryData.individualEquipment.find(
      item => item.equipmentId === equipmentId || item.id === equipmentId
    );
    
    if (individual) {
      return {
        name: individual.name,
        id: individual.equipmentId,
        type: inventoryData.equipmentTypes.find(t => t.id === individual.typeId)?.name || 'Unknown'
      };
    }

    // Check regular equipment
    const regular = inventoryData.equipmentItems.find(item => item.id === equipmentId);
    if (regular) {
      const type = inventoryData.equipmentTypes.find(t => t.id === regular.typeId);
      return {
        name: type?.name || 'Unknown Equipment',
        id: equipmentId,
        type: type?.category || 'other'
      };
    }

    return {
      name: 'Unknown Equipment',
      id: equipmentId,
      type: 'unknown'
    };
  };

  const availableEquipment = [
    ...inventoryData.individualEquipment.filter(
      item => item.status === 'available' && !jobEquipment.includes(item.equipmentId)
    ),
    ...inventoryData.equipmentItems.filter(
      item => item.status === 'available' && !jobEquipment.includes(item.id)
    )
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Equipment Allocation - {jobName}
        </CardTitle>
      </CardHeader>
      <CardContent>

      {/* Allocation Form */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Allocate Equipment
        </label>
        <div className="flex gap-2">
          <Select
            value={selectedEquipmentId}
            onValueChange={setSelectedEquipmentId}
            disabled={isLoading || isValidating}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select equipment..." />
            </SelectTrigger>
            <SelectContent>
              {availableEquipment.map((item) => {
                const isIndividual = 'equipmentId' in item;
                const id = isIndividual ? item.equipmentId : item.id;
                const name = isIndividual ? item.name : getEquipmentDisplay(item.id).name;
                
                return (
                  <SelectItem key={id} value={id}>
                    {name} ({id})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          <Button
            onClick={handleAllocate}
            disabled={!selectedEquipmentId || isLoading || isValidating}
            size="default"
          >
            {isLoading ? 'Allocating...' : 'Allocate'}
          </Button>
        </div>
      </div>

      {/* Allocated Equipment List */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">
          Allocated Equipment ({jobEquipment.length})
        </h4>
        
        {jobEquipment.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No equipment allocated to this job</p>
        ) : (
          <div className="space-y-2">
            {jobEquipment.map((equipmentId) => {
              const equipment = getEquipmentDisplay(equipmentId);
              const status = getEquipmentStatus(equipmentId);
              
              return (
                <div
                  key={equipmentId}
                  className="flex items-center justify-between p-3 bg-muted rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {equipment.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {equipment.id} | Type: {equipment.type}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={
                        status === 'deployed' 
                          ? 'default' 
                          : status === 'allocated' 
                          ? 'secondary'
                          : 'outline'
                      }
                      className={`text-xs ${
                        status === 'deployed' 
                          ? 'bg-muted text-foreground hover:bg-muted' 
                          : status === 'allocated' 
                          ? 'bg-muted text-foreground hover:bg-muted'
                          : ''
                      }`}
                    >
                      {status}
                    </Badge>
                    
                    <Button
                      onClick={() => handleRelease(equipmentId)}
                      disabled={isLoading}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-muted h-8 w-8 p-0"
                      title="Release equipment"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </CardContent>
    </Card>
  );
};