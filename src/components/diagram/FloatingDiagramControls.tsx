
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Zap, Satellite, Monitor } from 'lucide-react';
import { useAwsInventory as useInventory } from '@/hooks/useAwsInventory';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface FloatingDiagramControlsProps {
  selectedCableType: string;
  setSelectedCableType: (type: string) => void;
  addYAdapter: () => void;
  onAddShearstreamBox: () => void;
  addCustomerComputer: () => void;
  jobId?: string;
}

const FloatingDiagramControls: React.FC<FloatingDiagramControlsProps> = ({
  selectedCableType,
  setSelectedCableType,
  addYAdapter,
  onAddShearstreamBox,
  addCustomerComputer,
  jobId,
}) => {
  const { data: inventoryData } = useInventory();
  const isMobile = useIsMobile();

  // Get cable types that have available individual items
  const availableCableTypes = (inventoryData?.equipmentTypes || [])
    .filter(type => type.category === 'cables')
    .filter(cableType => {
      const availableItems = (inventoryData?.individualEquipment || [])
        .filter(item => 
          item.typeId === cableType.id && 
          (item.status === 'available' || (item.status === 'deployed' && item.jobId === jobId))
        );
      return availableItems.length > 0;
    })
    .map(cableType => {
      const availableCount = inventoryData.individualEquipment
        .filter(item => 
          item.typeId === cableType.id && 
          (item.status === 'available' || (item.status === 'deployed' && item.jobId === jobId))
        ).length;
      return { ...cableType, availableCount };
    });

  // Mobile layout: Bottom bar with improved positioning
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-20 pb-safe">
        <Card className="bg-card backdrop-blur-md border-t border-border shadow-2xl rounded-t-lg mx-2 mb-2">
          <CardContent className="p-3">
          <div className="flex flex-col gap-3">
            {/* Cable Type Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground min-w-fit">Cable:</span>
              <Select value={selectedCableType} onValueChange={setSelectedCableType}>
                <SelectTrigger className="h-9 flex-1 text-sm bg-background border-border hover:bg-muted transition-colors">
                  <SelectValue placeholder="Select cable type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {availableCableTypes.map((cable) => (
                    <SelectItem key={cable.id} value={cable.id} className="hover:bg-muted">
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="text-foreground">{cable.name}</span>
                        <Badge variant="secondary" className="ml-2 text-xs bg-primary/20 text-primary border-0">
                          {cable.availableCount}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={addYAdapter}
                size="sm"
                variant="secondary"
                className="h-9 text-xs bg-muted hover:bg-muted/80 border-border"
              >
                <Zap className="h-3 w-3 mr-1 text-primary" />
                Y-Adapter
              </Button>
              
              <Button
                onClick={onAddShearstreamBox}
                size="sm"
                variant="secondary"
                className="h-9 text-xs bg-muted hover:bg-muted/80 border-border"
              >
                <Plus className="h-3 w-3 mr-1 text-primary" />
                SS Box
              </Button>
              
              <Button
                onClick={addCustomerComputer}
                size="sm"
                variant="secondary"
                className="h-9 text-xs bg-muted hover:bg-muted/80 border-border"
              >
                <Monitor className="h-3 w-3 mr-1 text-primary" />
                Computer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    );
  }

  // Desktop layout: Floating top bar
  return (
    <Card className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-card backdrop-blur-md border-border shadow-2xl">
      <CardContent className="p-3">
        <div className="flex items-center gap-4">
          {/* Cable Type Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">Cable:</span>
            <Select value={selectedCableType} onValueChange={setSelectedCableType}>
              <SelectTrigger className="h-8 w-36 text-xs bg-background border-border hover:bg-muted transition-colors">
                <SelectValue placeholder="Select cable" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {availableCableTypes.map((cable) => (
                  <SelectItem key={cable.id} value={cable.id} className="text-xs hover:bg-muted">
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="text-foreground">{cable.name}</span>
                      <Badge variant="secondary" className="ml-2 text-xs bg-primary/20 text-primary border-0">
                        {cable.availableCount}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-border/50" />

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">Add:</span>
            
            <Button
              onClick={addYAdapter}
              size="sm"
              variant="secondary"
              className="h-8 text-xs px-3 bg-muted hover:bg-muted/80 border-border"
            >
              <Zap className="h-3 w-3 mr-1 text-primary" />
              Y-Adapter
            </Button>
            
            <Button
              onClick={onAddShearstreamBox}
              size="sm"
              variant="secondary"
              className="h-8 text-xs px-3 bg-muted hover:bg-muted/80 border-border"
            >
              <Plus className="h-3 w-3 mr-1 text-primary" />
              SS Box
            </Button>
            
            <Button
              onClick={addCustomerComputer}
              size="sm"
              variant="secondary"
              className="h-8 text-xs px-3 bg-muted hover:bg-muted/80 border-border"
            >
              <Monitor className="h-3 w-3 mr-1 text-primary" />
              Computer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FloatingDiagramControls;
