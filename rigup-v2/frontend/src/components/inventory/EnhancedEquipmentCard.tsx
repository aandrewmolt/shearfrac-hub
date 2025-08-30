
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  HoverCard, 
  HoverCardContent, 
  HoverCardTrigger 
} from '@/components/ui/hover-card';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Edit, Trash2, MapPin, History, Info } from 'lucide-react';
import { IndividualEquipment, StorageLocation } from '@/types/inventory';
import { UnifiedEquipmentHistoryDialog } from '@/components/shared';

interface EnhancedEquipmentCardProps {
  equipment: IndividualEquipment;
  storageLocations: StorageLocation[];
  onEdit: (equipment: IndividualEquipment) => void;
  onDelete: (equipmentId: string) => void;
  onStatusChange: (equipmentId: string, status: string) => void;
  onLocationChange: (equipmentId: string, locationId: string) => void;
  getStatusColor: (status: string) => string;
  getLocationName: (locationId: string) => string;
  isDraft?: boolean;
}

const EnhancedEquipmentCard: React.FC<EnhancedEquipmentCardProps> = ({
  equipment,
  storageLocations,
  onEdit,
  onDelete,
  onStatusChange,
  onLocationChange,
  getStatusColor,
  getLocationName,
  isDraft = false
}) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleHistoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHistoryOpen(true);
  };

  return (
    <TooltipProvider>
      <Card className={`border ${isDraft ? 'border-border bg-muted' : 'border-border'} hover:shadow-md transition-shadow`}>
        <CardContent className="p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm">{equipment.equipmentId}</h3>
                {equipment.status === 'deployed' && (
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div className="cursor-help">
                        <Badge variant="secondary" className="text-xs">
                          Deployed
                        </Badge>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="font-semibold">Current Location:</span>
                        </div>
                        <p className="text-sm">{getLocationName(equipment.locationId)}</p>
                        {equipment.jobId && (
                          <p className="text-sm text-muted-foreground">Job ID: {equipment.jobId}</p>
                        )}
                        {equipment.serialNumber && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground">Serial: {equipment.serialNumber}</p>
                          </div>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-2">{equipment.name}</p>
            </div>
            
            <div className="flex gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleHistoryClick}
                    className="h-6 w-6 p-0"
                  >
                    <History className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View history</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(equipment)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit equipment</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(equipment.id)}
                    className="h-6 w-6 p-0 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete equipment</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="space-y-2">
            <Badge className={getStatusColor(equipment.status)}>
              {equipment.status}
            </Badge>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{getLocationName(equipment.locationId)}</span>
            </div>
            
            {equipment.notes && (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <Info className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-foreground">Has notes</span>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent>
                  <p className="text-sm">{equipment.notes}</p>
                </HoverCardContent>
              </HoverCard>
            )}
            
            {isDraft && (
              <Badge variant="outline" className="text-xs">
                Pending Save
              </Badge>
            )}
          </div>
        </CardContent>
        
        <UnifiedEquipmentHistoryDialog
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          equipment={equipment}
          variant="basic"
        />
      </Card>
    </TooltipProvider>
  );
};

export default EnhancedEquipmentCard;
