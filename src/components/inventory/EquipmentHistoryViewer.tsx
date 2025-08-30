import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, 
  ArrowRight, 
  Package, 
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Wrench,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Calendar,
  User,
  RefreshCw
} from 'lucide-react';
import { useEquipmentHistory } from '@/hooks/equipment/useEquipmentHistory';
import { UnifiedEquipmentHistoryDialog } from '@/components/shared';
import { useAwsInventory as useInventory } from '@/hooks/useAwsInventory';
import { IndividualEquipment } from '@/types/inventory';
import { format } from 'date-fns';
import { DATABASE_MODE } from '@/utils/consolidated/databaseUtils';

const EquipmentHistoryViewer: React.FC = () => {
  const { history, isLoading, error, refreshHistory } = useEquipmentHistory();
  const { data: inventoryData } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<unknown>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  // Create equipment lookup map for performance
  const equipmentMap = useMemo(() => {
    const map = new Map<string, IndividualEquipment>();
    inventoryData.individualEquipment.forEach(equipment => {
      map.set(equipment.id, equipment);
    });
    return map;
  }, [inventoryData.individualEquipment]);

  // Filter history based on search and action
  const filteredHistory = useMemo(() => {
    let filtered = history;

    if (searchTerm) {
      filtered = filtered.filter(entry => {
        // Use the equipment map for faster lookup
        const equipment = equipmentMap.get(entry.equipmentId);
        const userFriendlyId = equipment?.equipmentId || entry.equipmentId;
        
        return userFriendlyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
               entry.jobName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               entry.notes?.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (selectedAction !== 'all') {
      filtered = filtered.filter(entry => entry.action === selectedAction);
    }

    return filtered;
  }, [history, searchTerm, selectedAction, equipmentMap]);

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
        return 'bg-status-info/20 text-status-info';
      case 'returned':
        return 'bg-status-success/20 text-status-success';
      case 'maintenance':
        return 'bg-status-warning/20 text-status-warning';
      case 'red-tagged':
        return 'bg-status-danger/20 text-status-danger';
      case 'status-change':
        return 'bg-card text-corporate-light';
      case 'location-change':
        return 'bg-card text-corporate-light';
      case 'created':
        return 'bg-card text-corporate-light';
      default:
        return 'bg-card text-corporate-light';
    }
  };

  const getEquipmentDisplayInfo = useCallback((equipmentId: string) => {
    const equipment = equipmentMap.get(equipmentId);
    if (equipment) {
      return {
        id: equipment.equipmentId,
        name: equipment.name,
        found: true
      };
    }
    return {
      id: `Unknown (${equipmentId.substring(0, 8)}...)`,
      name: 'Equipment not found in current inventory',
      found: false
    };
  }, [equipmentMap]);

  const handleViewEquipmentHistory = (equipmentId: string) => {
    const equipment = equipmentMap.get(equipmentId);
    if (equipment) {
      setSelectedEquipment(equipment);
      setHistoryDialogOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Error loading history: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Equipment History
              </CardTitle>
              <Button onClick={refreshHistory} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search equipment ID, job name, or notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="deployed">Deployed</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="red-tagged">Red Tagged</SelectItem>
                  <SelectItem value="status-change">Status Change</SelectItem>
                  <SelectItem value="location-change">Location Change</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* History Table */}
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-corporate-silver">
                <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p>No history found</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(record.timestamp), 'MMM d, yyyy')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(record.timestamp), 'h:mm a')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">
                            {(() => {
                              const displayInfo = getEquipmentDisplayInfo(record.equipmentId);
                              return (
                                <div>
                                  <div className={`font-semibold ${displayInfo.found ? 'text-foreground' : 'text-foreground'}`}>
                                    {displayInfo.id}
                                  </div>
                                  <div className={`text-xs ${displayInfo.found ? 'text-muted-foreground' : 'text-warning'}`}>
                                    {displayInfo.name}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionIcon(record.action)}
                            <Badge className={getActionColor(record.action)}>
                              {record.action.replace('-', ' ')}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {record.fromStatus && record.toStatus && (
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {record.fromStatus}
                                </Badge>
                                <ArrowRight className="h-3 w-3" />
                                <Badge variant="outline" className="text-xs">
                                  {record.toStatus}
                                </Badge>
                              </div>
                            )}
                            {record.fromLocation && record.toLocation && (
                              <div className="flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                <span className="text-xs">{record.fromLocation}</span>
                                <ArrowRight className="h-3 w-3" />
                                <span className="text-xs">{record.toLocation}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {record.jobName ? (
                            <Badge variant="secondary">{record.jobName}</Badge>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {record.userName ? (
                            <div className="flex items-center gap-1 text-sm">
                              <User className="h-3 w-3" />
                              {record.userName}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-sm text-muted-foreground truncate">
                            {record.notes || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewEquipmentHistory(record.equipmentId)}
                          >
                            View All
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{history.length}</div>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {history.filter(h => h.action === 'deployed').length}
              </div>
              <p className="text-xs text-muted-foreground">Deployments</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {history.filter(h => h.action === 'returned').length}
              </div>
              <p className="text-xs text-muted-foreground">Returns</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {history.filter(h => h.action === 'maintenance' || h.action === 'red-tagged').length}
              </div>
              <p className="text-xs text-muted-foreground">Maintenance Events</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Equipment History Dialog */}
      <UnifiedEquipmentHistoryDialog
        equipment={selectedEquipment}
        isOpen={historyDialogOpen}
        onClose={() => {
          setHistoryDialogOpen(false);
          setSelectedEquipment(null);
        }}
      />
    </>
  );
};

export default EquipmentHistoryViewer;