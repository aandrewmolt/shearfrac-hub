import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, CheckCircle, Camera, MapPin, Plus, X } from 'lucide-react';
import { useUnifiedInventory } from '@/hooks/useUnifiedInventory';
import { useInventory } from '@/contexts/InventoryContext';
import EnhancedRedTagManager from '../inventory/EnhancedRedTagManager';
import { toast } from 'sonner';
import { isEquipmentAtLocation } from '@/utils/equipmentLocation';

interface RedTaggedItem {
  id: string;
  equipmentTypeId: string;
  reason: string;
  addedDate: Date;
  notes?: string;
  individualEquipmentId?: string;
}

interface UnifiedRedTagPanelProps {
  variant?: 'dashboard' | 'location' | 'compact';
  locationFilter?: string; // For location-specific filtering
  showLocationFilter?: boolean;
}

export const UnifiedRedTagPanel: React.FC<UnifiedRedTagPanelProps> = ({
  variant = 'dashboard',
  locationFilter,
  showLocationFilter = true
}) => {
  const { data: unifiedData, updateEquipment } = useUnifiedInventory();
  const { data } = useInventory();
  const [isRedTagDialogOpen, setIsRedTagDialogOpen] = useState(false);
  const [isLocationRedTagDialogOpen, setIsLocationRedTagDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<unknown>(null);
  const [filterLocation, setFilterLocation] = useState(locationFilter || 'all');
  
  // Location-specific state for location variant
  const [selectedEquipmentType, setSelectedEquipmentType] = useState('');
  const [selectedIndividualEquipment, setSelectedIndividualEquipment] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [redTaggedItems, setRedTaggedItems] = useState<RedTaggedItem[]>([]);

  const getEquipmentTypeName = (typeId: string) => {
    const type = data.equipmentTypes.find(t => t.id === typeId);
    return type?.name || 'Unknown Type';
  };

  const getLocationName = (locationId: string) => {
    const location = data.storageLocations.find(l => l.id === locationId);
    return location?.name || 'Unknown Location';
  };

  const getIndividualEquipmentName = (equipmentId: string) => {
    return data.individualEquipment.find(eq => eq.id === equipmentId)?.equipmentId || 'Unknown';
  };

  // Dashboard variant data
  const redTaggedItems_dashboard = unifiedData.individualEquipment.filter(item => 
    item.status === 'red-tagged' &&
    (filterLocation === 'all' || isEquipmentAtLocation(item, filterLocation, 'storage'))
  );

  const availableItems_dashboard = unifiedData.equipmentItems.filter(item => 
    item.status === 'available' && item.quantity > 0
  );

  // Location variant logic
  const selectedType = data.equipmentTypes.find(type => type.id === selectedEquipmentType);
  const requiresIndividualTracking = selectedType?.requiresIndividualTracking || false;
  
  const availableIndividualEquipment = data.individualEquipment.filter(
    eq => eq.typeId === selectedEquipmentType
  );

  const commonReasons = [
    'Damaged',
    'Needs Repair',
    'Calibration Required',
    'Missing Parts',
    'Suspected Fault',
    'Scheduled Maintenance',
  ];

  // Dashboard variant handlers
  const handleRedTag = async (itemId: string, reason: string, photos: string[], location?: string) => {
    try {
      await updateEquipment(itemId, {
        status: 'red-tagged',
        redTagReason: reason,
        redTagPhoto: photos.length > 0 ? photos[0] : undefined,
      });
      toast.success('Equipment red-tagged successfully');
    } catch (error) {
      console.error('Failed to red tag equipment:', error);
      toast.error('Failed to red tag equipment');
    }
  };

  const handleRemoveRedTag = async (itemId: string) => {
    try {
      await updateEquipment(itemId, {
        status: 'available',
        redTagReason: undefined,
        redTagPhoto: undefined,
      });
      toast.success('Red tag removed successfully');
    } catch (error) {
      console.error('Failed to remove red tag:', error);
      toast.error('Failed to remove red tag');
    }
  };

  // Location variant handlers
  const handleAddRedTag = () => {
    if (!selectedEquipmentType || !reason.trim()) {
      toast.error('Please select equipment type and provide a reason');
      return;
    }

    if (requiresIndividualTracking && !selectedIndividualEquipment) {
      toast.error('Please select a specific equipment item');
      return;
    }

    const newRedTag: RedTaggedItem = {
      id: `red-tag-${Date.now()}`,
      equipmentTypeId: selectedEquipmentType,
      reason: reason.trim(),
      addedDate: new Date(),
      notes: notes.trim() || undefined,
      individualEquipmentId: requiresIndividualTracking ? selectedIndividualEquipment : undefined,
    };

    setRedTaggedItems(prev => [...prev, newRedTag]);
    
    // Reset form
    setSelectedEquipmentType('');
    setSelectedIndividualEquipment('');
    setReason('');
    setNotes('');
    setIsLocationRedTagDialogOpen(false);
    
    toast.success('Red tagged equipment added to location');
  };

  const handleRemoveLocationRedTag = (redTagId: string) => {
    setRedTaggedItems(prev => prev.filter(item => item.id !== redTagId));
    toast.success('Red tagged equipment removed');
  };

  const handleEquipmentTypeChange = (typeId: string) => {
    setSelectedEquipmentType(typeId);
    setSelectedIndividualEquipment('');
  };

  const openRedTagDialog = (item: unknown) => {
    setSelectedItem(item);
    setIsRedTagDialogOpen(true);
  };

  // Dashboard Variant
  if (variant === 'dashboard') {
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Red Tagged Items</p>
                  <p className="text-2xl font-bold text-destructive">{redTaggedItems_dashboard.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Items</p>
                  <p className="text-2xl font-bold text-foreground">{availableItems_dashboard.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold text-foreground">{unifiedData.equipmentItems.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Red Tagged Equipment Table */}
        <Card className="bg-card shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Red Tagged Equipment
              </CardTitle>
              {showLocationFilter && (
                <Select value={filterLocation} onValueChange={setFilterLocation}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {data.storageLocations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {redTaggedItems_dashboard.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipment Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Red Tag Reason</TableHead>
                      <TableHead>Photo</TableHead>
                      <TableHead>Tagged Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {redTaggedItems_dashboard.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {getEquipmentTypeName(item.typeId)}
                        </TableCell>
                        <TableCell>{getLocationName(item.locationId)}</TableCell>
                        <TableCell className="max-w-48 truncate">
                          {item.redTagReason || 'No reason specified'}
                        </TableCell>
                        <TableCell>
                          {item.redTagPhoto ? (
                            <div className="flex items-center gap-2">
                              <Camera className="h-4 w-4 text-foreground" />
                              <span className="text-sm text-foreground">View Photo</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No photo</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.lastUpdated.toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => handleRemoveRedTag(item.id)}
                            variant="outline"
                            size="sm"
                            className="text-foreground hover:text-foreground"
                          >
                            Remove Red Tag
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
                <p>No red-tagged equipment</p>
                <p className="text-sm text-muted-foreground">All equipment is in good condition</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Equipment for Red Tagging */}
        <Card className="bg-card shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5" />
              Available Equipment (Mark as Red Tagged)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableItems_dashboard.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableItems_dashboard.slice(0, 12).map(item => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{getEquipmentTypeName(item.typeId)}</span>
                      <Badge variant="outline" className="bg-muted text-foreground">
                        {item.quantity} available
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {getLocationName(item.locationId)}
                      </div>
                    </div>
                    <Button
                      onClick={() => openRedTagDialog(item)}
                      variant="outline"
                      size="sm"
                      className="w-full text-destructive hover:text-destructive"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Red Tag
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No available equipment to red tag</p>
              </div>
            )}
          </CardContent>
        </Card>

        <EnhancedRedTagManager
          isOpen={isRedTagDialogOpen}
          onClose={() => setIsRedTagDialogOpen(false)}
          equipmentItem={selectedItem}
          onRedTag={handleRedTag}
        />
      </div>
    );
  }

  // Location Variant
  if (variant === 'location') {
    return (
      <CollapsibleCard
        className="bg-card shadow-lg border-destructive/30"
        defaultOpen={redTaggedItems.length > 0}
        title={<span className="text-destructive">Red Tagged Equipment</span>}
        icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
        badge={redTaggedItems.length > 0 && (
          <Badge variant="destructive" className="ml-2">
            {redTaggedItems.length}
          </Badge>
        )}
        action={
          <Dialog open={isLocationRedTagDialogOpen} onOpenChange={setIsLocationRedTagDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Plus className="mr-2 h-4 w-4" />
                Add Red Tag
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Red Tagged Equipment on Location</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Equipment Type</label>
                  <Select value={selectedEquipmentType} onValueChange={handleEquipmentTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment type" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      {data.equipmentTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            {type.name}
                            {type.requiresIndividualTracking && (
                              <Badge variant="outline" className="text-xs">Individual</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {requiresIndividualTracking && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Select Specific Equipment
                      <AlertTriangle className="inline h-4 w-4 ml-1 text-warning" />
                    </label>
                    <Select value={selectedIndividualEquipment} onValueChange={setSelectedIndividualEquipment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select specific equipment" />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        {availableIndividualEquipment.map(equipment => (
                          <SelectItem key={equipment.id} value={equipment.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{equipment.equipmentId}</span>
                              <span className="text-sm text-muted-foreground">{equipment.name}</span>
                              <Badge 
                                variant={equipment.status === 'red-tagged' ? 'destructive' : 'secondary'}
                                className="text-xs w-fit"
                              >
                                {equipment.status}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Red Tag Reason</label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      {commonReasons.map(reasonOption => (
                        <SelectItem key={reasonOption} value={reasonOption}>
                          {reasonOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional details about the red tag issue..."
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleAddRedTag} 
                  className="w-full"
                  variant="destructive"
                  disabled={!selectedEquipmentType || !reason.trim() || (requiresIndividualTracking && !selectedIndividualEquipment)}
                >
                  Add Red Tagged Equipment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      >
        <div className="space-y-4">
          {redTaggedItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="mx-auto h-12 w-12 text-destructive/60 mb-2" />
              <p className="text-sm">No red tagged equipment on location</p>
              <p className="text-xs text-muted-foreground mt-1">
                Track damaged or non-functional equipment
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-destructive">Red Tagged Equipment:</h4>
              {redTaggedItems.map(item => {
                const equipmentType = data.equipmentTypes.find(type => type.id === item.equipmentTypeId);
                const isIndividuallyTracked = equipmentType?.requiresIndividualTracking;
                
                return (
                  <div key={item.id} className="flex items-start justify-between p-3 border rounded-lg bg-muted border-destructive/30">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{getEquipmentTypeName(item.equipmentTypeId)}</span>
                        {isIndividuallyTracked && item.individualEquipmentId && (
                          <Badge variant="destructive" className="text-xs">
                            {getIndividualEquipmentName(item.individualEquipmentId)}
                          </Badge>
                        )}
                        <Badge variant="destructive" className="text-xs">
                          Red Tagged
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div><strong>Reason:</strong> {item.reason}</div>
                        <div><strong>Added:</strong> {item.addedDate.toLocaleDateString()}</div>
                        {item.notes && (
                          <div><strong>Notes:</strong> {item.notes}</div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveLocationRedTag(item.id)}
                      className="h-7 w-7 p-0 ml-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CollapsibleCard>
    );
  }

  // Compact Variant
  return (
    <Card className="bg-card shadow-lg border-destructive/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          Red Tagged Equipment ({redTaggedItems_dashboard.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {redTaggedItems_dashboard.length > 0 ? (
          <div className="space-y-2">
            {redTaggedItems_dashboard.slice(0, 3).map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                <div>
                  <span className="font-medium">{getEquipmentTypeName(item.typeId)}</span>
                  <span className="text-muted-foreground ml-2">{item.redTagReason}</span>
                </div>
                <Badge variant="destructive" className="text-xs">
                  Red Tagged
                </Badge>
              </div>
            ))}
            {redTaggedItems_dashboard.length > 3 && (
              <div className="text-xs text-muted-foreground text-center">
                +{redTaggedItems_dashboard.length - 3} more
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <CheckCircle className="h-6 w-6 mx-auto mb-1 text-success" />
            <p className="text-xs">No red-tagged equipment</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UnifiedRedTagPanel;