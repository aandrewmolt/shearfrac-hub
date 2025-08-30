import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useAwsInventory as useInventory } from '@/hooks/useAwsInventory';
import { useUnifiedEquipmentSync } from '@/hooks/useUnifiedEquipmentSync';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EnhancedEquipmentSelectorProps {
  onSelect: (equipmentId: string, equipmentType: string) => void;
  selectedEquipmentIds: string[];
  categoryFilter?: string;
  jobId: string;
  jobName: string;
}

const EnhancedEquipmentSelector: React.FC<EnhancedEquipmentSelectorProps> = ({
  onSelect,
  selectedEquipmentIds,
  categoryFilter,
  jobId,
  jobName
}) => {
  const { data } = useInventory();
  const { 
    getEquipmentStatus, 
    validateEquipmentAvailability, 
    allocateEquipment,
    conflicts 
  } = useUnifiedEquipmentSync();

  const filteredEquipment = useMemo(() => {
    return data.individualEquipment
      .map(item => ({
        ...item,
        equipmentType: data?.equipmentTypes?.find(t => t.id === item.typeId),
      }))
      .filter(item => {
        if (!item.equipmentType) return false;
        if (categoryFilter && item.equipmentType.category !== categoryFilter) return false;
        return true;
      });
  }, [data, categoryFilter]);

  const getConflictForEquipment = (equipmentId: string) => {
    return conflicts.find(c => c.equipmentId === equipmentId);
  };

  const handleSelect = async (equipment: { equipmentId: string; id: string; name: string; status: string; }) => {
    const equipmentId = equipment.equipmentId;
    
    // Check if already selected
    if (selectedEquipmentIds.includes(equipmentId)) {
      onSelect(equipmentId, equipment.equipmentType.name);
      return;
    }

    // Validate availability
    const isAvailable = await validateEquipmentAvailability(equipmentId, jobId);
    
    if (isAvailable) {
      // Allocate equipment
      await allocateEquipment(equipmentId, jobId, jobName);
      onSelect(equipmentId, equipment.equipmentType.name);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'allocated':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'deployed':
        return <Package className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-muted text-foreground';
      case 'allocated':
        return 'bg-muted text-foreground';
      case 'deployed':
        return 'bg-muted text-foreground';
      default:
        return 'bg-muted text-destructive';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Available Equipment</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {filteredEquipment.map((equipment) => {
              const equipmentId = equipment.equipmentId;
              const status = getEquipmentStatus(equipmentId);
              const conflict = getConflictForEquipment(equipmentId);
              const isSelected = selectedEquipmentIds.includes(equipmentId);
              const isAvailable = status === 'available' || status === 'allocated';

              return (
                <div
                  key={equipmentId}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-status-info/20'
                      : conflict
                      ? 'border-red-300 bg-status-danger/20'
                      : isAvailable
                      ? 'border-border hover:border-border hover:bg-card'
                      : 'border-border bg-card opacity-60 cursor-not-allowed'
                  }`}
                  onClick={() => isAvailable && handleSelect(equipment)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status)}
                      <div>
                        <div className="font-medium">
                          {equipment.name || equipment.equipmentType?.name}
                          <span className="text-sm text-corporate-silver ml-2">({equipment.equipmentId})</span>
                        </div>
                        <div className="text-sm text-corporate-silver">
                          {equipment.equipmentType?.category}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(status)}>
                        {status}
                      </Badge>
                      
                      {conflict && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Double-booked:</p>
                              <p className="text-sm">Current: {conflict.currentJobName}</p>
                              <p className="text-sm">Requested: {conflict.requestedJobName}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      
                      {equipment.jobId && equipment.jobId !== jobId && (
                        <Badge variant="outline" className="text-xs">
                          Job #{equipment.jobId}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default EnhancedEquipmentSelector;