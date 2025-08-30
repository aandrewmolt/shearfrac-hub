import React, { useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { 
  Monitor, Tablet, AlertTriangle, CheckCircle, 
  Wrench, XCircle, MoreVertical, Tag, Clock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import NodeDeleteButton from './NodeDeleteButton';
import { useInventory } from '@/contexts/InventoryContext';
import { tursoDb } from '@/services/tursoDb';
import { toast } from '@/hooks/use-toast';
import { useEquipmentUsageTracking } from '@/hooks/equipment/useEquipmentUsageTracking';

// Extended node data interface for enhanced equipment components
interface EnhancedEquipmentNodeData {
  label?: string;
  equipmentId?: string;
  color?: string;
  wellNumber?: number;
  jobId?: string;
  assigned?: boolean;
  customName?: string;
  fracComPort?: string;
  gaugeComPort?: string;
  fracBaudRate?: string;
  gaugeBaudRate?: string;
  isTablet?: boolean;
  name?: string;
}

interface EnhancedEquipmentNodeProps {
  id: string;
  data: EnhancedEquipmentNodeData;
  selected?: boolean;
  type: 'computer' | 'satellite' | 'mainBox' | 'wellsideGauge' | 'yAdapter';
}

const EnhancedEquipmentNode: React.FC<EnhancedEquipmentNodeProps> = ({ 
  id, 
  data, 
  selected,
  type 
}) => {
  const { deleteElements } = useReactFlow();
  const { data: inventoryData, refreshData } = useInventory();
  const { createRedTagEvent, getEquipmentTotalHours } = useEquipmentUsageTracking();
  
  const [showRedTagDialog, setShowRedTagDialog] = useState(false);
  const [redTagReason, setRedTagReason] = useState('');
  const [redTagSeverity, setRedTagSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [isProcessing, setIsProcessing] = useState(false);

  const isTablet = type === 'computer' && (data.isTablet || data.equipmentId?.startsWith('CT'));
  const isAssigned = data.assigned && data.equipmentId;
  
  // Find the actual equipment from inventory
  const equipment = inventoryData.individualEquipment.find(
    eq => eq.equipmentId === data.equipmentId
  );
  
  const isRedTagged = equipment?.status === 'red-tagged';
  const isMaintenance = equipment?.status === 'maintenance';
  const totalHours = equipment ? getEquipmentTotalHours(equipment.id) : 0;

  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  const handleRedTag = async () => {
    if (!equipment) {
      toast({
        title: "Error",
        description: "Equipment not found in inventory",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Create red tag event
      await createRedTagEvent(equipment.id, redTagReason, redTagSeverity);
      
      // Update equipment status in database
      await tursoDb.updateIndividualEquipment(equipment.id, {
        status: 'red-tagged',
        notes: `Red Tagged: ${redTagReason} (${redTagSeverity} severity)`
      });

      // Refresh inventory data
      await refreshData();

      toast({
        title: "Equipment Red Tagged",
        description: `${equipment.equipmentId} has been marked as red-tagged`,
        variant: "destructive"
      });

      setShowRedTagDialog(false);
      setRedTagReason('');
    } catch (error) {
      console.error('Failed to red tag equipment:', error);
      toast({
        title: "Error",
        description: "Failed to red tag equipment",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearRedTag = async () => {
    if (!equipment) return;

    setIsProcessing(true);
    try {
      await tursoDb.updateIndividualEquipment(equipment.id, {
        status: 'available',
        notes: 'Red tag cleared'
      });

      await refreshData();

      toast({
        title: "Red Tag Cleared",
        description: `${equipment.equipmentId} is now available`,
      });
    } catch (error) {
      console.error('Failed to clear red tag:', error);
      toast({
        title: "Error",
        description: "Failed to clear red tag",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkMaintenance = async () => {
    if (!equipment) return;

    setIsProcessing(true);
    try {
      await tursoDb.updateIndividualEquipment(equipment.id, {
        status: 'maintenance',
        notes: 'Scheduled maintenance'
      });

      await refreshData();

      toast({
        title: "Marked for Maintenance",
        description: `${equipment.equipmentId} is now in maintenance`,
      });
    } catch (error) {
      console.error('Failed to mark for maintenance:', error);
      toast({
        title: "Error",
        description: "Failed to mark for maintenance",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Get node icon based on type
  const getNodeIcon = () => {
    switch (type) {
      case 'computer':
        return isTablet ? <Tablet className="h-5 w-5" /> : <Monitor className="h-5 w-5" />;
      case 'satellite':
        return <div className="text-lg">📡</div>;
      case 'mainBox':
        return <div className="text-lg">📦</div>;
      case 'wellsideGauge':
        return <div className="text-lg">⚙️</div>;
      case 'yAdapter':
        return <div className="text-lg">🔧</div>;
      default:
        return <div className="text-lg">📦</div>;
    }
  };

  // Get node title based on type
  const getNodeTitle = () => {
    switch (type) {
      case 'computer':
        return 'Customer Computer';
      case 'satellite':
        return 'Satellite';
      case 'mainBox':
        return 'Main Box';
      case 'wellsideGauge':
        return 'Wellside Gauge';
      case 'yAdapter':
        return 'Y-Adapter';
      default:
        return 'Equipment';
    }
  };

  // Determine node styling based on status
  const getNodeStyle = () => {
    if (isRedTagged) {
      return 'bg-destructive border-destructive/50';
    } else if (isMaintenance) {
      return 'bg-warning border-border';
    }
    return 'bg-muted-foreground border-border';
  };

  return (
    <>
      <div className={`${getNodeStyle()} text-white rounded-lg p-3 border-2 min-w-[120px] text-center relative`}>
        {selected && <NodeDeleteButton onDelete={handleDelete} />}
        
        {/* Context Menu */}
        {isAssigned && (
          <div className="absolute top-1 right-1 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {equipment?.equipmentId || 'Equipment'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {!isRedTagged && !isMaintenance && (
                  <DropdownMenuItem 
                    onClick={() => setShowRedTagDialog(true)}
                    className="text-destructive"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Red Tag Equipment
                  </DropdownMenuItem>
                )}
                
                {!isRedTagged && !isMaintenance && (
                  <DropdownMenuItem onClick={handleMarkMaintenance}>
                    <Wrench className="mr-2 h-4 w-4" />
                    Mark for Maintenance
                  </DropdownMenuItem>
                )}
                
                {isRedTagged && (
                  <DropdownMenuItem 
                    onClick={handleClearRedTag}
                    className="text-foreground"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Clear Red Tag
                  </DropdownMenuItem>
                )}
                
                {isMaintenance && (
                  <DropdownMenuItem 
                    onClick={handleClearRedTag}
                    className="text-foreground"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete Maintenance
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <Clock className="mr-2 h-4 w-4" />
                  {totalHours.toFixed(1)} hours used
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <Handle
          type="source"
          position={Position.Right}
          style={{
            right: -8,
            backgroundColor: 'hsl(var(--muted-foreground))',
            border: '2px solid hsl(var(--background))',
            width: 12,
            height: 12,
          }}
        />
        
        <Handle
          type="target"
          position={Position.Left}
          style={{
            left: -8,
            backgroundColor: 'hsl(var(--muted-foreground))',
            border: '2px solid hsl(var(--background))',
            width: 12,
            height: 12,
          }}
        />
        
        <div className="flex flex-col items-center gap-1">
          {/* Status indicator */}
          {(isRedTagged || isMaintenance) && (
            <div className="absolute -top-2 -right-2">
              {isRedTagged ? (
                <AlertTriangle className="h-5 w-5 text-destructive/80 animate-pulse" />
              ) : (
                <Wrench className="h-5 w-5 text-warning/80 animate-pulse" />
              )}
            </div>
          )}
          
          {getNodeIcon()}
          <div>
            <h3 className="font-bold text-sm">{getNodeTitle()}</h3>
            {isAssigned && data.equipmentId && (
              <p className={`text-xs ${isRedTagged ? 'text-destructive/80' : 'text-success'}`}>
                {data.equipmentId}
              </p>
            )}
            {type === 'computer' && (
              <p className="text-xs text-white/70">{isTablet ? 'Tablet' : 'Computer'}</p>
            )}
            {data.name && (
              <p className="text-xs text-white/70">{data.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Red Tag Dialog */}
      <Dialog open={showRedTagDialog} onOpenChange={setShowRedTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Red Tag Equipment</DialogTitle>
            <DialogDescription>
              Mark {equipment?.equipmentId} as requiring maintenance or repair
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Equipment Details</Label>
              <div className="text-sm text-muted-foreground">
                <div>ID: {equipment?.equipmentId}</div>
                <div>Type: {equipment?.name}</div>
                <div>Total Hours: {totalHours.toFixed(1)}</div>
              </div>
            </div>
            
            <div>
              <Label>Reason for Red Tag</Label>
              <Textarea
                value={redTagReason}
                onChange={(e) => setRedTagReason(e.target.value)}
                placeholder="Describe the issue..."
                rows={3}
              />
            </div>
            
            <div>
              <Label>Severity</Label>
              <Select value={redTagSeverity} onValueChange={(v: 'low' | 'medium' | 'high' | 'critical') => setRedTagSeverity(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Minor issue</SelectItem>
                  <SelectItem value="medium">Medium - Needs attention soon</SelectItem>
                  <SelectItem value="high">High - Critical issue</SelectItem>
                  <SelectItem value="critical">Critical - Immediate action required</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRedTagDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRedTag}
              disabled={!redTagReason || isProcessing}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Confirm Red Tag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedEquipmentNode;