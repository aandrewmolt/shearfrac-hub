import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Satellite, Square, Plus, X, AlertCircle, CheckCircle, RefreshCw, Tablet, Zap } from 'lucide-react';
import { useAwsInventory as useInventory } from '@/hooks/useAwsInventory';
import { useEquipmentQueries } from '@/hooks/useEquipmentQueries';
import { IndividualEquipment } from '@/types/inventory';
import QuickStatusFix from '@/components/inventory/QuickStatusFix';

interface UnifiedEquipmentSelectionPanelProps {
  selectedShearstreamBoxes: string[];
  selectedStarlink?: string;
  selectedCustomerComputers: string[];
  selectedWellGauges?: Record<string, string>; // wellId -> equipmentId
  selectedYAdapters?: string[];
  customerComputerCount: number;
  shearstreamBoxCount: number;
  wellNodes?: Array<{ id: string; data: { label?: string; gaugeType?: string } }>;
  yAdapterNodes?: Array<{ id: string; data: { label?: string } }>;
  onEquipmentSelect: (type: 'shearstream-box' | 'starlink' | 'customer-computer' | 'well-gauge' | 'y-adapter' | 'pressure-gauge-1502' | 'pressure-gauge-abra' | 'pressure-gauge-pencil', equipmentId: string, index?: number, nodeId?: string) => void;
  onAddShearstreamBox: () => void;
  onRemoveShearstreamBox: (index: number) => void;
  onAddStarlink?: () => void;
  onRemoveStarlink?: (index: number) => void;
  onAddCustomerComputer?: () => void;
  onRemoveCustomerComputer?: (index: number) => void;
  hasWellsideGauge: boolean;
  getEquipmentStatus?: (equipmentId: string) => 'available' | 'allocated' | 'deployed' | 'unavailable';
  variant?: 'standard' | 'compact'; // Controls styling and layout
}

export const UnifiedEquipmentSelectionPanel: React.FC<UnifiedEquipmentSelectionPanelProps> = ({
  selectedShearstreamBoxes,
  selectedStarlink,
  selectedCustomerComputers,
  selectedWellGauges = {},
  selectedYAdapters = [],
  customerComputerCount,
  shearstreamBoxCount,
  wellNodes = [],
  yAdapterNodes = [],
  onEquipmentSelect,
  onAddShearstreamBox,
  onRemoveShearstreamBox,
  onAddStarlink,
  onRemoveStarlink,
  onAddCustomerComputer,
  onRemoveCustomerComputer,
  hasWellsideGauge,
  getEquipmentStatus,
  variant = 'standard',
}) => {
  const { data } = useInventory();
  const { refetch } = useEquipmentQueries();

  // Filter available equipment by type and status
  const availableEquipment = useMemo(() => {
    // Show all equipment for debugging - normally would filter by status === 'available'
    const available = data.individualEquipment;
    
    return {
      ssBoxes: available.filter(eq => eq.equipmentId.startsWith('SS')),
      starlinks: available.filter(eq => eq.equipmentId.startsWith('SL')),
      computers: available.filter(eq => eq.equipmentId.startsWith('CC')),
      tablets: available.filter(eq => eq.equipmentId.startsWith('CT')),
      pressureGauges1502: available.filter(eq => eq.equipmentId.startsWith('PG1502')),
      pressureGaugesAbra: available.filter(eq => eq.equipmentId.startsWith('AG')),
      pressureGaugesPencil: available.filter(eq => eq.equipmentId.startsWith('PG')),
      yAdapters: available.filter(eq => eq.equipmentId.startsWith('Y-')),
    };
  }, [data.individualEquipment]);

  // Combine computers and tablets for customer devices
  const allCustomerDevices = [...availableEquipment.computers, ...availableEquipment.tablets];

  const getSelectedEquipment = (equipmentId: string) => {
    return data.individualEquipment.find(eq => eq.equipmentId === equipmentId);
  };

  // Convert selectedStarlink to array for consistent handling
  const selectedStarlinks = selectedStarlink ? [selectedStarlink] : [];
  const starlinkCount = selectedStarlinks.length;

  // Helper function to get equipment status badge
  const getStatusBadge = (equipmentId: string) => {
    if (!getEquipmentStatus) return null;
    
    const status = getEquipmentStatus(equipmentId);
    
    switch (status) {
      case 'available':
        return (
          <Badge variant="outline" className="ml-2 text-xs bg-muted text-foreground border-border">
            <CheckCircle className="w-3 h-3 mr-1" />
            Available
          </Badge>
        );
      case 'allocated':
        return (
          <Badge variant="outline" className="ml-2 text-xs bg-muted text-foreground border-border">
            <AlertCircle className="w-3 h-3 mr-1" />
            Allocated
          </Badge>
        );
      case 'deployed':
        return (
          <Badge variant="outline" className="ml-2 text-xs bg-muted text-foreground border-border">
            <AlertCircle className="w-3 h-3 mr-1" />
            Deployed
          </Badge>
        );
      case 'unavailable':
        return (
          <Badge variant="outline" className="ml-2 text-xs bg-muted text-destructive border-destructive">
            <X className="w-3 h-3 mr-1" />
            Unavailable
          </Badge>
        );
      default:
        return null;
    }
  };

  // Compact Equipment Section Component for compact variant
  const CompactEquipmentSection = ({ 
    title, 
    icon: Icon, 
    color, 
    count, 
    selectedItems, 
    availableItems, 
    onSelect, 
    onAdd, 
    onRemove, 
    type 
  }: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    count: number;
    selectedItems: string[];
    availableItems: IndividualEquipment[];
    onSelect: (equipmentId: string, index?: number) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
    type: string;
  }) => (
    <div className="space-y-3">
      <div className={`flex items-center justify-between p-3 bg-gradient-to-r ${color} rounded-lg border border-opacity-30`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-card/20 rounded">
            <Icon className="h-4 w-4 text-white" />
          </div>
          <Label className="text-sm font-semibold text-white">
            {title} ({availableItems.length} available)
          </Label>
        </div>
        <Button
          onClick={onAdd}
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0 bg-card/20 border-white/30 text-white hover:bg-card/30"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-2 p-3 bg-card rounded-lg border border-border hover:border-opacity-50 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${selectedItems[index] ? 'bg-primary' : 'bg-muted'}`}></div>
              <Label className="text-xs font-medium text-muted-foreground">{type} {index + 1}</Label>
              {selectedItems[index] && (
                <CheckCircle className="h-3 w-3 text-success" />
              )}
            </div>
            {count > 1 && (
              <Button
                onClick={() => onRemove(index)}
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 text-destructive hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Select
            value={selectedItems[index] || ''}
            onValueChange={(value) => onSelect(value, index)}
          >
            <SelectTrigger className="h-8 text-xs border-2 border-border hover:border-border focus:border-border transition-all duration-200">
              <SelectValue placeholder={`Select ${type}...`} />
            </SelectTrigger>
            <SelectContent className="bg-card border-2 border-border shadow-xl z-50">
              {availableItems
                .filter(eq => !selectedItems.includes(eq.id) || selectedItems[index] === eq.id)
                .length === 0 ? (
                <SelectItem value="none" disabled className="text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-destructive" />
                    No {title.toLowerCase()} available
                  </div>
                </SelectItem>
              ) : (
                availableItems
                  .filter(eq => !selectedItems.includes(eq.id) || selectedItems[index] === eq.id)
                  .map(equipment => (
                    <SelectItem key={equipment.id} value={equipment.id} className="hover:bg-muted">
                      <span className="font-medium">{equipment.equipmentId}</span>
                    </SelectItem>
                  ))
              )}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );

  if (variant === 'compact') {
    return (
      <Card className="bg-gradient-to-br from-card to-primary/10 shadow-lg border-border">
        <CardHeader className="pb-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <div className="p-1.5 bg-card/20 rounded-md">
              <Square className="h-4 w-4" />
            </div>
            Equipment Assignment
            <Badge variant="secondary" className="ml-auto bg-card/20 text-white border-white/30">
              {shearstreamBoxCount + customerComputerCount + (hasWellsideGauge ? 1 : 0)} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {/* ShearStream Boxes */}
          <CompactEquipmentSection
            title="SS Boxes"
            icon={Square}
            color="from-primary to-primary/80"
            count={shearstreamBoxCount}
            selectedItems={selectedShearstreamBoxes}
            availableItems={availableEquipment.ssBoxes}
            onSelect={(equipmentId, index) => onEquipmentSelect('shearstream-box', equipmentId, index)}
            onAdd={onAddShearstreamBox}
            onRemove={onRemoveShearstreamBox}
            type="Box"
          />

          {/* Starlink */}
          {hasWellsideGauge && (
            <CompactEquipmentSection
              title="Starlink"
              icon={Satellite}
              color="from-warning to-warning/80"
              count={1}
              selectedItems={selectedStarlink ? [selectedStarlink] : []}
              availableItems={availableEquipment.starlinks}
              onSelect={(equipmentId) => onEquipmentSelect('starlink', equipmentId)}
              onAdd={() => {}} // No add for single starlink
              onRemove={() => {}} // No remove for single starlink
              type="Starlink"
            />
          )}

          {/* Customer Computers */}
          {customerComputerCount > 0 && (
            <CompactEquipmentSection
              title="Customer Devices"
              icon={Monitor}
              color="from-accent to-accent/80"
              count={customerComputerCount}
              selectedItems={selectedCustomerComputers}
              availableItems={allCustomerDevices}
              onSelect={(equipmentId, index) => onEquipmentSelect('customer-computer', equipmentId, index)}
              onAdd={() => {}} // Add functionality would need to be passed as prop
              onRemove={() => {}} // Remove functionality would need to be passed as prop
              type="Device"
            />
          )}
        </CardContent>
      </Card>
    );
  }

  // Standard variant (original EquipmentSelectionPanel functionality)
  return (
    <Card className="bg-card shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Square className="h-4 w-4" />
            Equipment Assignment
          </CardTitle>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => refetch()}
              className="h-8 w-8 p-0"
              title="Refresh equipment list"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Quick Fix for Equipment Status Issues */}
        <QuickStatusFix onFixed={() => window.location.reload()} />
        
        {/* ShearStream Boxes Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Square className="h-3 w-3" />
              <Label className="text-sm font-medium">
                ShearStream Boxes ({availableEquipment.ssBoxes.length} available, {shearstreamBoxCount} in use)
              </Label>
            </div>
            <Button
              onClick={onAddShearstreamBox}
              size="sm"
              variant="outline"
              className="h-6 px-2"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          {Array.from({ length: shearstreamBoxCount }, (_, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">SS Box {index + 1}</Label>
                {shearstreamBoxCount > 1 && (
                  <Button
                    onClick={() => onRemoveShearstreamBox(index)}
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Select
                value={selectedShearstreamBoxes[index] || ''}
                onValueChange={(value) => onEquipmentSelect('shearstream-box', value, index)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select SS Box..." />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  {availableEquipment.ssBoxes
                    .filter(eq => {
                      const selectedInOtherSlots = selectedShearstreamBoxes.some((selectedId, idx) => 
                        idx !== index && selectedId === eq.equipmentId
                      );
                      return !selectedInOtherSlots;
                    })
                    .length === 0 ? (
                    <>
                      <SelectItem value="__none__">None (No Selection)</SelectItem>
                      <SelectItem value="none" disabled>No ShearStream boxes available</SelectItem>
                    </>
                  ) : (
                    [
                      <SelectItem key="none" value="__none__">None (No Selection)</SelectItem>,
                      ...availableEquipment.ssBoxes
                        .filter(eq => {
                          const selectedInOtherSlots = selectedShearstreamBoxes.some((selectedId, idx) => 
                            idx !== index && selectedId === eq.equipmentId
                          );
                          return !selectedInOtherSlots;
                        })
                        .map(equipment => (
                        <SelectItem key={equipment.id} value={equipment.equipmentId}>
                          <div className="flex items-center">
                            <span>{equipment.equipmentId}</span>
                            {getStatusBadge(equipment.equipmentId)}
                          </div>
                        </SelectItem>
                      ))]
                  )}
                </SelectContent>
              </Select>
              {selectedShearstreamBoxes[index] && (
                <div className="text-xs text-muted-foreground">
                  Selected: {getSelectedEquipment(selectedShearstreamBoxes[index])?.equipmentId}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Starlink Selection */}
        {hasWellsideGauge && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Satellite className="h-3 w-3" />
                <Label className="text-sm font-medium">
                  Starlinks ({availableEquipment.starlinks.length} available, {starlinkCount} in use)
                </Label>
              </div>
              {onAddStarlink && (
                <Button
                  onClick={onAddStarlink}
                  size="sm"
                  variant="outline"
                  className="h-6 px-2"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {Array.from({ length: Math.max(1, starlinkCount) }, (_, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Starlink {index + 1}</Label>
                  {starlinkCount > 1 && onRemoveStarlink && (
                    <Button
                      onClick={() => onRemoveStarlink(index)}
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <Select
                  value={selectedStarlinks[index] || ''}
                  onValueChange={(value) => onEquipmentSelect('starlink', value, index)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select Starlink..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    {availableEquipment.starlinks
                      .filter(eq => {
                        const selectedInOtherSlots = selectedStarlinks.some((selectedId, idx) => 
                          idx !== index && selectedId === eq.equipmentId
                        );
                        return !selectedInOtherSlots;
                      })
                      .length === 0 ? (
                      <>
                        <SelectItem value="__none__">None (No Selection)</SelectItem>
                        <SelectItem value="none" disabled>No Starlinks available</SelectItem>
                      </>
                    ) : (
                      [
                        <SelectItem key="none" value="__none__">None (No Selection)</SelectItem>,
                        ...availableEquipment.starlinks
                          .filter(eq => {
                            const selectedInOtherSlots = selectedStarlinks.some((selectedId, idx) => 
                              idx !== index && selectedId === eq.equipmentId
                            );
                            return !selectedInOtherSlots;
                          })
                          .map(equipment => (
                          <SelectItem key={equipment.id} value={equipment.equipmentId}>
                            <div className="flex items-center">
                              <span>{equipment.equipmentId}</span>
                              {getStatusBadge(equipment.equipmentId)}
                            </div>
                          </SelectItem>
                        ))]
                    )}
                  </SelectContent>
                </Select>
                {selectedStarlinks[index] && (
                  <div className="text-xs text-muted-foreground">
                    Selected: {getSelectedEquipment(selectedStarlinks[index])?.equipmentId}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Customer Computers Selection */}
        {customerComputerCount > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="h-3 w-3" />
                <Label className="text-sm font-medium">
                  Customer Devices ({allCustomerDevices.length} available, {customerComputerCount} needed)
                </Label>
              </div>
              {onAddCustomerComputer && (
                <Button
                  onClick={onAddCustomerComputer}
                  size="sm"
                  variant="outline"
                  className="h-6 px-2"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {Array.from({ length: customerComputerCount }, (_, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Device {index + 1}</Label>
                  {customerComputerCount > 1 && onRemoveCustomerComputer && (
                    <Button
                      onClick={() => onRemoveCustomerComputer(index)}
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <Select
                  value={selectedCustomerComputers[index] || ''}
                  onValueChange={(value) => onEquipmentSelect('customer-computer', value, index)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select Device..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    {allCustomerDevices
                      .filter(eq => {
                        const selectedInOtherSlots = selectedCustomerComputers.some((selectedId, idx) => 
                          idx !== index && selectedId === eq.equipmentId
                        );
                        return !selectedInOtherSlots;
                      })
                      .length === 0 ? (
                      <>
                        <SelectItem value="__none__">None (No Selection)</SelectItem>
                        <SelectItem value="none" disabled>No devices available</SelectItem>
                      </>
                    ) : (
                      [
                        <SelectItem key="none" value="__none__">None (No Selection)</SelectItem>,
                        ...allCustomerDevices
                          .filter(eq => {
                            const selectedInOtherSlots = selectedCustomerComputers.some((selectedId, idx) => 
                              idx !== index && selectedId === eq.equipmentId
                            );
                            return !selectedInOtherSlots;
                          })
                          .map(equipment => (
                          <SelectItem key={equipment.id} value={equipment.equipmentId}>
                            <div className="flex items-center">
                              {equipment.equipmentId.startsWith('CT') ? (
                                <Tablet className="h-3 w-3 mr-1" />
                              ) : (
                                <Monitor className="h-3 w-3 mr-1" />
                              )}
                              <span>{equipment.equipmentId}</span>
                              {getStatusBadge(equipment.equipmentId)}
                            </div>
                          </SelectItem>
                        ))]
                    )}
                  </SelectContent>
                </Select>
                {selectedCustomerComputers[index] && (
                  <div className="text-xs text-muted-foreground">
                    Selected: {getSelectedEquipment(selectedCustomerComputers[index])?.equipmentId}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Wells Gauge Selection */}
        {wellNodes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Square className="h-3 w-3" />
              <Label className="text-sm font-medium">
                Well Pressure Gauges ({wellNodes.length} wells)
              </Label>
            </div>
            {wellNodes.map((wellNode, index) => (
              <div key={wellNode.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {wellNode.data.label || `Well ${index + 1}`}
                  </Badge>
                  {wellNode.data.gaugeType && (
                    <Badge variant="secondary" className="text-xs">
                      {wellNode.data.gaugeType.replace('pressure-gauge-', '')}
                    </Badge>
                  )}
                </div>
                {wellNode.data.gaugeType && (
                  <Select
                    value={selectedWellGauges[wellNode.id] || ''}
                    onValueChange={(value) => {
                      if (value === '__none__') {
                        onEquipmentSelect(wellNode.data.gaugeType as 'pressure-gauge-1502' | 'pressure-gauge-abra' | 'pressure-gauge-pencil', '', undefined, wellNode.id);
                      } else {
                        onEquipmentSelect(wellNode.data.gaugeType as 'pressure-gauge-1502' | 'pressure-gauge-abra' | 'pressure-gauge-pencil', value, undefined, wellNode.id);
                      }
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder={`Select ${wellNode.data.gaugeType?.replace('pressure-gauge-', '')} gauge...`} />
                    </SelectTrigger>
                    <SelectContent className="bg-card z-50">
                      <SelectItem value="__none__">None (No Selection)</SelectItem>
                      {(() => {
                        const gaugeType = wellNode.data.gaugeType;
                        let gauges: IndividualEquipment[] = [];
                        if (gaugeType === 'pressure-gauge-1502') {
                          gauges = availableEquipment.pressureGauges1502;
                        } else if (gaugeType === 'pressure-gauge-abra') {
                          gauges = availableEquipment.pressureGaugesAbra;
                        } else if (gaugeType === 'pressure-gauge-pencil') {
                          gauges = availableEquipment.pressureGaugesPencil;
                        }
                        
                        return gauges.map(equipment => (
                          <SelectItem key={equipment.id} value={equipment.equipmentId}>
                            <div className="flex items-center">
                              <span>{equipment.equipmentId}</span>
                              {getStatusBadge(equipment.equipmentId)}
                            </div>
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Y-Adapters Selection */}
        {yAdapterNodes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3" />
              <Label className="text-sm font-medium">
                Y-Adapters ({availableEquipment.yAdapters.length} available, {yAdapterNodes.length} in use)
              </Label>
            </div>
            {yAdapterNodes.map((yNode, index) => (
              <div key={yNode.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {yNode.data.label || `Y-Adapter ${index + 1}`}
                  </Badge>
                </div>
                <Select
                  value={selectedYAdapters[index] || ''}
                  onValueChange={(value) => {
                    if (value === '__none__') {
                      onEquipmentSelect('y-adapter', '', index, yNode.id);
                    } else {
                      onEquipmentSelect('y-adapter', value, index, yNode.id);
                    }
                  }}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select Y-Adapter..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    <SelectItem value="__none__">None (No Selection)</SelectItem>
                    {availableEquipment.yAdapters
                      .filter(eq => {
                        const selectedInOtherSlots = selectedYAdapters.some((selectedId, idx) => 
                          idx !== index && selectedId === eq.equipmentId
                        );
                        return !selectedInOtherSlots;
                      })
                      .map(equipment => (
                      <SelectItem key={equipment.id} value={equipment.equipmentId}>
                        <div className="flex items-center">
                          <span>{equipment.equipmentId}</span>
                          {getStatusBadge(equipment.equipmentId)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnifiedEquipmentSelectionPanel;