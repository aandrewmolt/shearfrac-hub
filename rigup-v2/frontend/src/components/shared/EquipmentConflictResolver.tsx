/**
 * Equipment Conflict Resolver Component
 * Provides UI for detecting and resolving equipment allocation conflicts
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUnifiedEvents } from '@/services/unifiedEventSystem';
import { tursoDb } from '@/services/tursoDb';
import { toast } from 'sonner';

interface EquipmentConflict {
  id: string;
  equipmentId: string;
  type: 'allocation_conflict' | 'multiple_job_allocation' | 'status_mismatch';
  currentJobId?: string;
  requestedJobId?: string;
  jobIds?: string[];
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  description?: string;
}

interface EquipmentConflictResolverProps {
  jobId?: string;
  showAll?: boolean;
  className?: string;
}

export default function EquipmentConflictResolver({ 
  jobId, 
  showAll = false, 
  className 
}: EquipmentConflictResolverProps) {
  const [conflicts, setConflicts] = useState<EquipmentConflict[]>([]);
  const [selectedConflict, setSelectedConflict] = useState<EquipmentConflict | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [autoResolveDialogOpen, setAutoResolveDialogOpen] = useState(false);
  
  const eventSystem = useUnifiedEvents();

  // Subscribe to conflict events from the unified system
  useEffect(() => {
    const unsubscribes = [];

    // Listen for all events that might create conflicts
    unsubscribes.push(
      eventSystem.subscribe('all', (event) => {
        // Trigger conflict scan when equipment is allocated
        if (event.type === 'equipment_allocation') {
          setTimeout(() => scanForConflicts(), 500);
        }
      })
    );

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [eventSystem]);

  // Scan for equipment conflicts
  const scanForConflicts = async () => {
    setScanning(true);
    const foundConflicts: EquipmentConflict[] = [];

    try {
      const [equipment, jobs] = await Promise.all([
        tursoDb.getIndividualEquipment(),
        tursoDb.getJobs()
      ]);

      // Group equipment by equipmentId to detect multiple allocations
      const equipmentGroups = new Map<string, typeof equipment>();
      equipment.forEach(item => {
        const key = item.equipmentId;
        if (!equipmentGroups.has(key)) {
          equipmentGroups.set(key, []);
        }
        equipmentGroups.get(key)!.push(item);
      });

      // Check each equipment group for conflicts
      for (const [equipmentId, items] of equipmentGroups) {
        const deployedItems = items.filter(item => item.status === 'deployed');
        const jobIds = new Set(deployedItems.map(item => item.jobId).filter(Boolean));

        // Multiple job allocation conflict
        if (jobIds.size > 1) {
          const conflict: EquipmentConflict = {
            id: `multi_job_${equipmentId}_${Date.now()}`,
            equipmentId,
            type: 'multiple_job_allocation',
            jobIds: Array.from(jobIds),
            severity: 'high',
            timestamp: new Date(),
            description: `Equipment ${equipmentId} is allocated to multiple jobs: ${Array.from(jobIds).join(', ')}`
          };
          foundConflicts.push(conflict);
        }

        // Status mismatch conflicts
        for (const item of items) {
          if (item.jobId && item.status !== 'deployed') {
            const conflict: EquipmentConflict = {
              id: `status_mismatch_${item.id}_${Date.now()}`,
              equipmentId,
              type: 'status_mismatch',
              currentJobId: item.jobId,
              severity: 'medium',
              timestamp: new Date(),
              description: `Equipment ${equipmentId} assigned to job but status is '${item.status}' instead of 'deployed'`
            };
            foundConflicts.push(conflict);
          }

          if (item.status === 'deployed' && !item.jobId) {
            const conflict: EquipmentConflict = {
              id: `orphan_deployed_${item.id}_${Date.now()}`,
              equipmentId,
              type: 'status_mismatch',
              severity: 'medium',
              timestamp: new Date(),
              description: `Equipment ${equipmentId} is marked as deployed but not assigned to any job`
            };
            foundConflicts.push(conflict);
          }
        }
      }

      // Check for orphaned equipment (assigned to non-existent jobs)
      const validJobIds = new Set(jobs.map(job => job.id));
      for (const item of equipment) {
        if (item.jobId && !validJobIds.has(item.jobId)) {
          const conflict: EquipmentConflict = {
            id: `orphan_job_${item.id}_${Date.now()}`,
            equipmentId: item.equipmentId,
            type: 'allocation_conflict',
            currentJobId: item.jobId,
            severity: 'high',
            timestamp: new Date(),
            description: `Equipment ${item.equipmentId} is assigned to non-existent job ${item.jobId}`
          };
          foundConflicts.push(conflict);
        }
      }

      // Filter by job if specified
      const relevantConflicts = jobId && !showAll
        ? foundConflicts.filter(conflict => 
            conflict.currentJobId === jobId || 
            conflict.requestedJobId === jobId ||
            conflict.jobIds?.includes(jobId)
          )
        : foundConflicts;

      setConflicts(relevantConflicts);
      
      if (relevantConflicts.length > 0) {
        console.log(`Found ${relevantConflicts.length} equipment conflicts`);
      }

    } catch (error) {
      console.error('Error scanning for conflicts:', error);
      toast.error('Failed to scan for equipment conflicts');
    } finally {
      setScanning(false);
    }
  };

  // Resolve a specific conflict
  const resolveConflict = async (conflict: EquipmentConflict, resolution: Record<string, unknown>) => {
    setResolving(conflict.id);

    try {
      if (conflict.type === 'multiple_job_allocation') {
        if (resolution.action === 'keep_current_job') {
          const keepJobId = resolution.jobId || conflict.currentJobId;
          const allEquipment = await tursoDb.getIndividualEquipment();
          const equipment = allEquipment.filter(item => item.equipmentId === conflict.equipmentId);
          
          // Return equipment from all other jobs
          for (const item of equipment) {
            if (item.jobId && item.jobId !== keepJobId) {
              await tursoDb.updateIndividualEquipment(item.id, {
                status: 'available',
                jobId: null,
                updatedAt: new Date().toISOString()
              });
            }
          }
          
          toast.success(`Equipment ${conflict.equipmentId} kept on job ${keepJobId}`);

        } else if (resolution.action === 'return_all') {
          // Return all instances to available
          await eventSystem.equipmentReturned(conflict.equipmentId, conflict.currentJobId || '');
          toast.success(`Equipment ${conflict.equipmentId} returned to inventory`);
        }

      } else if (conflict.type === 'status_mismatch') {
        if (conflict.currentJobId) {
          // Fix status to match job assignment
          const allEquipment = await tursoDb.getIndividualEquipment();
          const equipment = allEquipment.filter(item => item.equipmentId === conflict.equipmentId);
          for (const item of equipment) {
            if (item.jobId === conflict.currentJobId && item.status !== 'deployed') {
              await tursoDb.updateIndividualEquipment(item.id, {
                status: 'deployed',
                updatedAt: new Date().toISOString()
              });
            }
          }
          toast.success(`Equipment ${conflict.equipmentId} status corrected to deployed`);
        } else {
          // Equipment deployed but no job - return to available
          const allEquipment = await tursoDb.getIndividualEquipment();
          const equipment = allEquipment.filter(item => item.equipmentId === conflict.equipmentId);
          for (const item of equipment) {
            if (item.status === 'deployed' && !item.jobId) {
              await tursoDb.updateIndividualEquipment(item.id, {
                status: 'available',
                updatedAt: new Date().toISOString()
              });
            }
          }
          toast.success(`Equipment ${conflict.equipmentId} returned to available status`);
        }

      } else if (conflict.type === 'allocation_conflict') {
        // Handle orphaned job assignments
        const allEquipment = await tursoDb.getIndividualEquipment();
        const equipment = allEquipment.filter(item => item.equipmentId === conflict.equipmentId);
        for (const item of equipment) {
          if (item.jobId === conflict.currentJobId) {
            await tursoDb.updateIndividualEquipment(item.id, {
              status: 'available',
              jobId: null,
              updatedAt: new Date().toISOString()
            });
          }
        }
        toast.success(`Equipment ${conflict.equipmentId} freed from deleted job`);
      }

      // Remove resolved conflict from list
      setConflicts(prev => prev.filter(c => c.id !== conflict.id));
      setSelectedConflict(null);

    } catch (error) {
      console.error('Error resolving conflict:', error);
      toast.error('Failed to resolve conflict');
    } finally {
      setResolving(null);
    }
  };

  // Auto-resolve all conflicts where possible
  const autoResolveConflicts = async () => {
    setAutoResolveDialogOpen(false);
    let resolvedCount = 0;

    for (const conflict of conflicts) {
      try {
        if (conflict.type === 'status_mismatch' || conflict.type === 'allocation_conflict') {
          await resolveConflict(conflict, { action: 'auto_fix' });
          resolvedCount++;
        }
      } catch (error) {
        console.error(`Failed to auto-resolve conflict ${conflict.id}:`, error);
      }
    }

    toast.success(`Auto-resolved ${resolvedCount} conflicts`);
    setTimeout(() => scanForConflicts(), 1000);
  };

  // Initial conflict scan
  useEffect(() => {
    scanForConflicts();
  }, [jobId]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-500 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-500 bg-blue-50 border-blue-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low': return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  if (conflicts.length === 0 && !scanning) {
    return (
      <Card className={`${className} border-green-200 bg-green-50`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">No equipment conflicts detected</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Equipment Conflicts ({conflicts.length})
          <Button
            onClick={scanForConflicts}
            size="sm"
            variant="outline"
            disabled={scanning}
          >
            {scanning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {scanning ? 'Scanning...' : 'Refresh'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {conflicts.length > 0 && (
          <>
            <div className="flex gap-2">
              <Button
                onClick={() => setAutoResolveDialogOpen(true)}
                size="sm"
                disabled={resolving !== null}
              >
                Auto-Resolve Safe Conflicts
              </Button>
            </div>
            <Separator />
          </>
        )}

        <div className="space-y-3">
          {conflicts.map(conflict => (
            <div
              key={conflict.id}
              className={`p-3 border rounded-lg ${getSeverityColor(conflict.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getSeverityIcon(conflict.severity)}
                    <span className="font-medium">{conflict.equipmentId}</span>
                    <Badge variant="outline" className="text-xs">
                      {conflict.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm opacity-90">
                    {conflict.description}
                  </p>
                  <p className="text-xs opacity-70 mt-1">
                    Detected: {conflict.timestamp.toLocaleString()}
                  </p>
                </div>
                <Button
                  onClick={() => setSelectedConflict(conflict)}
                  size="sm"
                  variant="outline"
                  disabled={resolving === conflict.id}
                >
                  {resolving === conflict.id ? 'Resolving...' : 'Resolve'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Conflict Resolution Dialog */}
        <Dialog 
          open={selectedConflict !== null} 
          onOpenChange={() => setSelectedConflict(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolve Equipment Conflict</DialogTitle>
              <DialogDescription>
                Equipment: {selectedConflict?.equipmentId}
              </DialogDescription>
            </DialogHeader>
            
            {selectedConflict && (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">{selectedConflict.description}</p>
                </div>
                
                {selectedConflict.type === 'multiple_job_allocation' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Resolution options:</p>
                    <div className="space-y-2">
                      {selectedConflict.jobIds?.map(jobId => (
                        <Button
                          key={jobId}
                          onClick={() => resolveConflict(selectedConflict, { 
                            action: 'keep_current_job', 
                            jobId 
                          })}
                          variant="outline"
                          className="w-full justify-start"
                        >
                          Keep on Job: {jobId}
                        </Button>
                      ))}
                      <Button
                        onClick={() => resolveConflict(selectedConflict, { 
                          action: 'return_all' 
                        })}
                        variant="destructive"
                        className="w-full"
                      >
                        Return to Inventory
                      </Button>
                    </div>
                  </div>
                )}

                {(selectedConflict.type === 'status_mismatch' || 
                  selectedConflict.type === 'allocation_conflict') && (
                  <div className="space-y-2">
                    <Button
                      onClick={() => resolveConflict(selectedConflict, { action: 'auto_fix' })}
                      className="w-full"
                    >
                      Auto-Fix Issue
                    </Button>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedConflict(null)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Auto-Resolve Confirmation */}
        <AlertDialog open={autoResolveDialogOpen} onOpenChange={setAutoResolveDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Auto-Resolve Conflicts?</AlertDialogTitle>
              <AlertDialogDescription>
                This will automatically fix status mismatches and orphaned equipment assignments.
                Multiple job allocations will need to be resolved manually.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={autoResolveConflicts}>
                Auto-Resolve
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}