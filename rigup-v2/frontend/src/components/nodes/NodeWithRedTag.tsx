import React, { useState } from 'react';
import { 
  AlertTriangle, CheckCircle, Wrench, MoreVertical, Clock, RefreshCw, Package 
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
import { useInventory } from '@/contexts/InventoryContext';
import { tursoDb } from '@/services/tursoDb';
import { toast } from '@/hooks/use-toast';
import { useEquipmentUsageTracking } from '@/hooks/equipment/useEquipmentUsageTracking';
import { useReactFlow } from '@xyflow/react';

interface NodeWithRedTagProps {
  children: React.ReactNode;
  equipmentId?: string;
  nodeId: string;
  className?: string;
  onEquipmentRemoved?: () => void;
  jobId?: string;
}

export const NodeWithRedTag: React.FC<NodeWithRedTagProps> = ({ 
  children, 
  equipmentId,
  nodeId,
  className = '',
  onEquipmentRemoved,
  jobId
}) => {
  const { data: inventoryData, refreshData } = useInventory();
  const { createRedTagEvent, getEquipmentTotalHours, endUsageSession } = useEquipmentUsageTracking();
  const { getNodes, setNodes } = useReactFlow();
  
  const [showRedTagDialog, setShowRedTagDialog] = useState(false);
  const [redTagReason, setRedTagReason] = useState('');
  const [redTagSeverity, setRedTagSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReplacementOptions, setShowReplacementOptions] = useState(false);
  const [selectedReplacement, setSelectedReplacement] = useState<string>('');

  // Find the actual equipment from inventory
  const equipment = equipmentId ? inventoryData.individualEquipment.find(
    eq => eq.equipmentId === equipmentId
  ) : null;
  
  const isRedTagged = equipment?.status === 'red-tagged';
  const isMaintenance = equipment?.status === 'maintenance';
  const totalHours = equipment ? getEquipmentTotalHours(equipment.id) : 0;

  // Find available replacement equipment of the same type
  const getAvailableReplacements = () => {
    if (!equipment) return [];
    return inventoryData.individualEquipment.filter(
      eq => eq.typeId === equipment.typeId && 
            eq.status === 'available' &&
            eq.id !== equipment.id
    );
  };

  const availableReplacements = getAvailableReplacements();

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
      // End any active usage session
      if (jobId) {
        await endUsageSession(equipment.id, new Date(), `Red tagged: ${redTagReason}`);
      }

      // Create red tag event
      await createRedTagEvent(equipment.id, redTagReason, redTagSeverity);
      
      // Update equipment status in database
      await tursoDb.updateIndividualEquipment(equipment.id, {
        status: 'red-tagged',
        jobId: null, // Remove from job
        notes: `Red Tagged: ${redTagReason} (${redTagSeverity} severity)`
      });

      // Remove equipment from the node on the diagram
      setNodes((nodes) => 
        nodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                equipmentId: null,
                equipmentName: null,
                assigned: false
              }
            };
          }
          return node;
        })
      );

      // Refresh inventory data
      await refreshData();

      // Notify parent component if callback provided
      if (onEquipmentRemoved) {
        onEquipmentRemoved();
      }

      toast({
        title: "Equipment Red Tagged & Removed",
        description: `${equipment.equipmentId} has been red-tagged and removed from the job. You can now assign replacement equipment.`,
        variant: "destructive"
      });

      setShowRedTagDialog(false);
      setRedTagReason('');
      
      // Show replacement options
      setShowReplacementOptions(true);
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

  // Apply red tag styling to the wrapper
  const wrapperClassName = `relative ${className} ${
    isRedTagged ? 'ring-2 ring-destructive ring-offset-2' : 
    isMaintenance ? 'ring-2 ring-warning ring-offset-2' : ''
  }`;

  return (
    <>
      <div 
        className={wrapperClassName}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // Open dropdown menu on right-click
          const menuButton = e.currentTarget.querySelector('[data-menu-trigger]') as HTMLButtonElement;
          if (menuButton) {
            menuButton.click();
          }
        }}
      >
        {/* Status indicator */}
        {(isRedTagged || isMaintenance) && (
          <div className="absolute -top-3 -right-3 z-20">
            {isRedTagged ? (
              <div className="bg-destructive rounded-full p-1">
                <AlertTriangle className="h-4 w-4 text-white animate-pulse" />
              </div>
            ) : (
              <div className="bg-warning rounded-full p-1">
                <Wrench className="h-4 w-4 text-white animate-pulse" />
              </div>
            )}
          </div>
        )}

        {/* Context Menu */}
        {equipment && (
          <div className="absolute top-1 right-1 z-50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  data-menu-trigger
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 bg-muted/80 hover:bg-muted border border-border"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <MoreVertical className="h-4 w-4 text-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {equipment.equipmentId}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {!isRedTagged && !isMaintenance && (
                  <>
                    <DropdownMenuItem 
                      onClick={() => setShowRedTagDialog(true)}
                      className="text-destructive"
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Red Tag & Replace
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={handleMarkMaintenance}>
                      <Wrench className="mr-2 h-4 w-4" />
                      Mark for Maintenance
                    </DropdownMenuItem>
                  </>
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

        {children}
      </div>

      {/* Red Tag Dialog */}
      <Dialog open={showRedTagDialog} onOpenChange={setShowRedTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Red Tag & Replace Equipment</DialogTitle>
            <DialogDescription>
              Mark {equipment?.equipmentId} as requiring repair and remove it from this job
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
              <Select value={redTagSeverity} onValueChange={(v) => setRedTagSeverity(v as 'low' | 'medium' | 'high' | 'critical')}>
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
            
            {availableReplacements.length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <Label className="text-primary">Available Replacements</Label>
                <p className="text-sm text-foreground mb-2">
                  {availableReplacements.length} replacement(s) available
                </p>
                <div className="text-xs text-foreground">
                  Equipment will be removed from node. You can assign a replacement after.
                </div>
              </div>
            )}
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
              {isProcessing ? 'Processing...' : 'Red Tag & Remove from Job'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};