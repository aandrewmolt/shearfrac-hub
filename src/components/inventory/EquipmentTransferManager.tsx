
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowRightLeft, Package, Building, Briefcase } from 'lucide-react';
import { useUnifiedInventory } from '@/hooks/useUnifiedInventory';
import { useJobs } from '@/hooks/useJobs';
import { toast } from 'sonner';

const EquipmentTransferManager = () => {
  const { data, updateEquipment } = useUnifiedInventory();
  const { jobs } = useJobs();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState('');
  const [fromLocationType, setFromLocationType] = useState<'storage' | 'job'>('storage');
  const [fromLocationId, setFromLocationId] = useState('');
  const [toLocationType, setToLocationType] = useState<'storage' | 'job'>('storage');
  const [toLocationId, setToLocationId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [notes, setNotes] = useState('');

  const getAvailableEquipment = (locationId: string, locationType: 'storage' | 'job') => {
    return data.individualEquipment
      .filter(item => 
        item.storageLocationId === locationId && 
        item.status === 'available' &&
        (locationType === 'storage' || item.allocatedToJob === locationId)
      );
  };

  const getEquipmentTypeName = (typeId: string) => {
    const type = data?.equipmentTypes?.find(t => t.id === typeId);
    return type?.name || 'Unknown Type';
  };

  const getLocationOptions = (type: 'storage' | 'job') => {
    if (type === 'storage') {
      return data.storageLocations.map(location => ({
        id: location.id,
        name: location.name,
        type: 'storage'
      }));
    } else {
      return jobs.map(job => ({
        id: job.id,
        name: job.name,
        type: 'job'
      }));
    }
  };

  const handleTransfer = async () => {
    if (!selectedEquipmentId || !fromLocationId || !toLocationId) {
      toast.error('Please select equipment and locations');
      return;
    }

    if (fromLocationId === toLocationId && fromLocationType === toLocationType) {
      toast.error('Source and destination must be different');
      return;
    }

    try {
      await updateEquipment(selectedEquipmentId, {
        storageLocationId: toLocationId,
        notes: `Transferred from ${fromLocationId} (${fromLocationType}) to ${toLocationId} (${toLocationType}). Reason: ${transferReason}. ${notes}`.trim(),
        lastUpdated: new Date(),
      });
      
      toast.success('Equipment transferred successfully');
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to transfer equipment');
    }
  };

  const resetForm = () => {
    setSelectedEquipmentId('');
    setFromLocationType('storage');
    setFromLocationId('');
    setToLocationType('storage');
    setToLocationId('');
    setTransferReason('');
    setNotes('');
  };

  return (
    <Card className="bg-card shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowRightLeft className="h-5 w-5" />
            Equipment Transfer
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Package className="mr-2 h-4 w-4" />
                Transfer Equipment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Transfer Equipment Between Locations</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">From Location Type</label>
                    <Select value={fromLocationType} onValueChange={(value: 'storage' | 'job') => setFromLocationType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="storage">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Storage Location
                          </div>
                        </SelectItem>
                        <SelectItem value="job">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Job Location
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">From Location</label>
                    <Select value={fromLocationId} onValueChange={setFromLocationId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {getLocationOptions(fromLocationType).map(location => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fromLocationId && (
                      <div className="text-xs text-corporate-silver mt-1">
                        Available: {getAvailableEquipment(fromLocationId, fromLocationType).length} items
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">To Location Type</label>
                    <Select value={toLocationType} onValueChange={(value: 'storage' | 'job') => setToLocationType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="storage">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Storage Location
                          </div>
                        </SelectItem>
                        <SelectItem value="job">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Job Location
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">To Location</label>
                    <Select value={toLocationId} onValueChange={setToLocationId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {getLocationOptions(toLocationType).map(location => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {fromLocationId && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Equipment</label>
                    <Select value={selectedEquipmentId} onValueChange={setSelectedEquipmentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select equipment to transfer" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableEquipment(fromLocationId, fromLocationType).map(equipment => (
                          <SelectItem key={equipment.id} value={equipment.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{equipment.name || getEquipmentTypeName(equipment.equipmentTypeId)}</span>
                              <Badge variant="outline" className="ml-2">{equipment.equipmentId}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Transfer Reason</label>
                  <Input
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="Job completion, maintenance, reallocation..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional transfer details..."
                    className="h-20"
                  />
                </div>

                <Button onClick={handleTransfer} className="w-full">
                  Transfer Equipment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-corporate-silver">
          <ArrowRightLeft className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-sm">Use the transfer button to move equipment between locations</p>
          <p className="text-xs text-muted-foreground mt-1">Transfer between storage locations and job sites</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EquipmentTransferManager;
