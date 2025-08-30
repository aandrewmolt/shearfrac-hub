import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  MapPin, 
  User, 
  Package, 
  TrendingUp, 
  TrendingDown,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight
} from 'lucide-react';
import { useEquipmentHistory } from '@/hooks/equipment/useEquipmentHistory';
import { useAwsInventory as useInventory } from '@/hooks/useAwsInventory';
import { IndividualEquipment } from '@/types/inventory';
import { format } from 'date-fns';

interface UnifiedEquipmentHistoryDialogProps {
  equipment?: IndividualEquipment;
  isOpen: boolean;
  onClose: () => void;
  variant?: 'basic' | 'enhanced'; // Controls which features to show
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'created':
      return <Package className="h-4 w-4" />;
    case 'deployed':
      return <TrendingUp className="h-4 w-4 text-primary" />;
    case 'returned':
      return <TrendingDown className="h-4 w-4 text-success" />;
    case 'maintenance':
      return <Wrench className="h-4 w-4 text-warning" />;
    case 'red-tagged':
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case 'status-change':
      return <CheckCircle className="h-4 w-4 text-accent" />;
    case 'location-change':
      return <MapPin className="h-4 w-4 text-primary" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'deployed':
      return 'bg-muted text-foreground border-border';
    case 'returned':
      return 'bg-muted text-foreground border-border';
    case 'maintenance':
      return 'bg-muted text-foreground border-border';
    case 'red-tagged':
      return 'bg-muted text-destructive border-destructive';
    case 'status-change':
      return 'bg-muted text-accent border-border';
    case 'location-change':
      return 'bg-muted text-primary border-border';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

export const UnifiedEquipmentHistoryDialog: React.FC<UnifiedEquipmentHistoryDialogProps> = ({
  equipment,
  isOpen,
  onClose,
  variant = 'enhanced'
}) => {
  const { data } = useInventory();
  const { history, isLoading, error, refreshHistory } = useEquipmentHistory(equipment?.id);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && equipment) {
      refreshHistory();
    }
  }, [isOpen, equipment, refreshHistory]);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getLocationName = (locationId: string) => {
    // Check storage locations first
    const storageLocation = data?.storageLocations?.find(loc => loc.id === locationId);
    if (storageLocation) return storageLocation.name;
    
    // Return the ID if no location name found
    return locationId || 'Unknown Location';
  };

  const getEquipmentTypeName = (typeId: string) => {
    const type = data?.equipmentTypes?.find(t => t.id === typeId);
    return type?.name || equipment?.type || 'Unknown Type';
  };

  if (!equipment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Package className="h-5 w-5" />
            Equipment History: {equipment.equipmentId || equipment.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Equipment Info Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Equipment ID</p>
                  <p className="font-semibold">{equipment.equipmentId || equipment.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-semibold">{equipment.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge variant="outline">
                    {getEquipmentTypeName(equipment.typeId)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Status</p>
                  <Badge variant={
                    equipment.status === 'available' ? 'default' :
                    equipment.status === 'deployed' ? 'secondary' : 
                    equipment.status === 'red-tagged' ? 'destructive' : 'outline'
                  }>
                    {equipment.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Location</p>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {getLocationName(equipment.locationId)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {equipment.createdAt ? format(new Date(equipment.createdAt), 'MMM d, yyyy') : 'Unknown'}
                  </p>
                </div>
                {equipment.serialNumber && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Serial Number</p>
                    <p className="font-semibold">{equipment.serialNumber}</p>
                  </div>
                )}
                {equipment.jobId && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Current Job</p>
                    <p className="font-semibold">{equipment.jobId}</p>
                  </div>
                )}
              </div>
              
              {equipment.notes && (
                <div className="mt-4 p-2 bg-muted rounded text-sm">
                  <strong>Notes:</strong> {equipment.notes}
                </div>
              )}
            </CardContent>
          </Card>

          {/* History Timeline */}
          {variant === 'enhanced' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">History Timeline</h3>
                <Button onClick={refreshHistory} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading history...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <p>Error loading history: {error}</p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2" />
                  <p>No history available</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {history.map((entry) => {
                      const isExpanded = expandedItems.has(entry.id);
                      
                      return (
                        <Card 
                          key={entry.id} 
                          className={`transition-all cursor-pointer hover:shadow-md ${getActionColor(entry.action)}`}
                          onClick={() => toggleExpanded(entry.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              {getActionIcon(entry.action)}
                              
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium capitalize">
                                      {entry.action.replace('-', ' ')}
                                    </span>
                                    <ChevronRight 
                                      className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                                    />
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {format(new Date(entry.timestamp), 'MMM d, yyyy h:mm a')}
                                  </span>
                                </div>

                                {isExpanded && (
                                  <div className="mt-3 space-y-2 text-sm">
                                    {entry.fromStatus && entry.toStatus && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Status:</span>
                                        <Badge variant="outline">{entry.fromStatus}</Badge>
                                        <ChevronRight className="h-3 w-3" />
                                        <Badge variant="outline">{entry.toStatus}</Badge>
                                      </div>
                                    )}
                                    
                                    {entry.fromLocation && entry.toLocation && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Location:</span>
                                        <span>{entry.fromLocation}</span>
                                        <ChevronRight className="h-3 w-3" />
                                        <span>{entry.toLocation}</span>
                                      </div>
                                    )}
                                    
                                    {entry.jobName && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Job:</span>
                                        <span>{entry.jobName}</span>
                                      </div>
                                    )}
                                    
                                    {entry.userName && (
                                      <div className="flex items-center gap-2">
                                        <User className="h-3 w-3" />
                                        <span>{entry.userName}</span>
                                      </div>
                                    )}
                                    
                                    {entry.notes && (
                                      <div className="mt-2 p-2 bg-card/50 rounded">
                                        <p className="text-muted-foreground">Notes:</p>
                                        <p>{entry.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {/* Basic variant shows placeholder for history */}
          {variant === 'basic' && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Deployment History</h3>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="mx-auto h-12 w-12 mb-2" />
                <p>History tracking available in enhanced view</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedEquipmentHistoryDialog;