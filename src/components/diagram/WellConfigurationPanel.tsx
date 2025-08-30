
import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gauge, Droplets, Palette } from 'lucide-react';
import { Node } from '@xyflow/react';
import { useEquipmentQueries } from '@/hooks/useEquipmentQueries';

interface NodeData {
  label?: string;
  color?: string;
  wellNumber?: number;
  gaugeType?: string;
}

interface WellConfigurationPanelProps {
  wellNodes: Node[];
  wellsideGaugeNode?: Node;
  updateWellName: (wellId: string, newName: string) => void;
  updateWellColor: (wellId: string, newColor: string) => void;
  updateWellsideGaugeName: (newName: string) => void;
  updateWellsideGaugeColor: (newColor: string) => void;
  updateWellGaugeType: (wellId: string, gaugeType: string) => void;
}

const colorOptions = [
  { value: '#3b82f6', name: 'Blue', class: 'bg-primary' },
  { value: '#ef4444', name: 'Red', class: 'bg-destructive' },
  { value: '#10b981', name: 'Green', class: 'bg-success' },
  { value: '#f59e0b', name: 'Orange', class: 'bg-warning' },
  { value: '#8b5cf6', name: 'Purple', class: 'bg-accent' },
  { value: '#06b6d4', name: 'Cyan', class: 'bg-info' },
  { value: '#eab308', name: 'Yellow', class: 'bg-warning' },
  { value: '#84cc16', name: 'Lime', class: 'bg-success' },
  { value: '#ec4899', name: 'Pink', class: 'bg-accent' },
  { value: '#f97316', name: 'Dark Orange', class: 'bg-warning' },
  { value: '#14b8a6', name: 'Teal', class: 'bg-info' },
  { value: '#a855f7', name: 'Violet', class: 'bg-accent' },
  { value: '#6b7280', name: 'Grey', class: 'bg-muted' },
  { value: '#000000', name: 'Black', class: 'bg-black' },
  { value: '#ffffff', name: 'White', class: 'bg-card border-2 border-border' },
];


const WellConfigurationPanel: React.FC<WellConfigurationPanelProps> = ({
  wellNodes,
  wellsideGaugeNode,
  updateWellName,
  updateWellColor,
  updateWellsideGaugeName,
  updateWellsideGaugeColor,
  updateWellGaugeType,
}) => {
  const { equipmentTypes } = useEquipmentQueries();
  
  // Filter for gauge types from equipment types
  const gaugeTypes = useMemo(() => {
    return equipmentTypes
      .filter(type => type.category === 'gauges')
      .map(type => ({
        value: type.id,
        name: type.name
      }));
  }, [equipmentTypes]);
  if (wellNodes.length === 0 && !wellsideGaugeNode) {
    return null;
  }

  return (
    <Card className="bg-card shadow-lg border-border h-full flex flex-col">
      <CardHeader className="pb-1 pt-2 px-2 bg-primary/10 text-foreground rounded-t-lg border-b border-border">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <div className="p-0.5 bg-card/20 rounded-md">
            <Droplets className="h-3 w-3" />
          </div>
          Well & Gauge Configuration
          <Badge variant="secondary" className="ml-auto bg-muted text-foreground border-border text-xs px-1 py-0">
            {wellNodes.length + (wellsideGaugeNode ? 1 : 0)} items
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 px-2 pb-2 h-full overflow-hidden">
        <div className="space-y-2 overflow-y-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 250px)', minHeight: '200px' }}>
          {/* Wellside Gauge Configuration */}
          {wellsideGaugeNode && (
            <div className="p-2 border border-border rounded-lg bg-muted/50">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="p-0.5 bg-muted rounded-md">
                  <Gauge className="h-2.5 w-2.5 text-foreground" />
                </div>
                <Label className="text-xs font-semibold text-foreground">
                  Wellside Gauge Configuration
                </Label>
              </div>
              
              <div className="space-y-1.5">
                <div>
                  <Label htmlFor="wellside-gauge-name-config" className="text-xs text-muted-foreground mb-0.5 block">
                    Gauge Name
                  </Label>
                  <Input
                    id="wellside-gauge-name-config"
                    value={(wellsideGaugeNode.data as NodeData).label || ''}
                    onChange={(e) => updateWellsideGaugeName(e.target.value)}
                    className="h-6 text-xs border border-border focus:border-border"
                    placeholder="Enter gauge name..."
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-0.5 block flex items-center gap-1">
                    <Palette className="h-2.5 w-2.5" />
                    Color
                  </Label>
                  <Select
                    value={(wellsideGaugeNode.data as NodeData).color || '#f59e0b'}
                    onValueChange={(color) => updateWellsideGaugeColor(color)}
                  >
                    <SelectTrigger className="h-6 border border-border focus:border-border">
                      <div 
                        className="w-2.5 h-2.5 rounded border border-border" 
                        style={{ backgroundColor: (wellsideGaugeNode.data as NodeData).color || '#f59e0b' }}
                      />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border shadow-lg max-h-40 z-50">
                      {colorOptions.map(color => (
                        <SelectItem key={color.value} value={color.value} className="hover:bg-muted text-xs">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded ${color.class}`}></div>
                            <span>{color.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          
          {/* Well Configurations - single column for better scrolling */}
          <div className="space-y-2">
            {wellNodes.map((wellNode, index) => {
              const nodeData = wellNode.data as NodeData;
              return (
                <div 
                  key={wellNode.id} 
                  className="p-2 border border-border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="p-0.5 bg-muted rounded-md">
                      <Droplets className="h-2.5 w-2.5 text-foreground" />
                    </div>
                    <Label className="text-xs font-semibold text-foreground flex-1">
                      Well {index + 1}
                    </Label>
                    <Badge variant="outline" className="bg-muted text-foreground border-border text-xs px-1 py-0">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div>
                      <Label htmlFor={`well-name-${wellNode.id}`} className="text-xs text-muted-foreground mb-0.5 block">
                        Well Name
                      </Label>
                      <Input
                        id={`well-name-${wellNode.id}`}
                        value={nodeData.label || ''}
                        onChange={(e) => updateWellName(wellNode.id, e.target.value)}
                        className="h-6 text-xs border border-border focus:border-border"
                        placeholder="Enter well name..."
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-0.5 block flex items-center gap-1">
                        <Palette className="h-2.5 w-2.5" />
                        Color
                      </Label>
                      <Select
                        value={nodeData.color || '#3b82f6'}
                        onValueChange={(color) => updateWellColor(wellNode.id, color)}
                      >
                        <SelectTrigger className="h-6 border border-border focus:border-border">
                          <div 
                            className="w-2.5 h-2.5 rounded border border-border" 
                            style={{ backgroundColor: nodeData.color || '#3b82f6' }}
                          />
                        </SelectTrigger>
                        <SelectContent className="bg-card border border-border shadow-lg max-h-40 z-50">
                          {colorOptions.map(color => (
                            <SelectItem key={color.value} value={color.value} className="hover:bg-muted text-xs">
                              <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded ${color.class}`}></div>
                                <span>{color.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-0.5 block flex items-center gap-1">
                        <Gauge className="h-2.5 w-2.5" />
                        Gauge Types
                      </Label>
                      <Select
                        value={nodeData.gaugeType || ''}
                        onValueChange={(gaugeType) => updateWellGaugeType(wellNode.id, gaugeType)}
                      >
                        <SelectTrigger className="h-6 text-xs border border-border focus:border-border">
                          <SelectValue placeholder="Select gauge type..." />
                        </SelectTrigger>
                        <SelectContent className="bg-card border border-border shadow-lg max-h-40 z-50">
                          {gaugeTypes.length > 0 ? (
                            gaugeTypes.map(gauge => (
                              <SelectItem key={gauge.value} value={gauge.value} className="hover:bg-muted text-xs">
                                {gauge.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-1.5 text-xs text-muted-foreground italic">
                              No gauge types available
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WellConfigurationPanel;
