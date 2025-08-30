import React, { useState } from 'react';
import { useUnifiedEquipmentSync } from '@/hooks/useUnifiedEquipmentSync';
import { EquipmentConflict } from '@/types/equipment-allocation';
import { AlertTriangle, CheckCircle, XCircle, Loader2, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';

export const ConflictResolver: React.FC = () => {
  const { conflicts, resolveConflict } = useUnifiedEquipmentSync();
  const [resolvingConflicts, setResolvingConflicts] = useState<Map<string, string>>(new Map());
  const [resolvedConflicts, setResolvedConflicts] = useState<Set<string>>(new Set());

  if (conflicts.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="mx-auto h-12 w-12 text-success mb-3" />
        <p className="text-muted-foreground">No equipment conflicts detected</p>
        <p className="text-sm text-muted-foreground mt-1">All equipment assignments are valid</p>
      </div>
    );
  }

  const handleResolve = async (conflict: EquipmentConflict, resolution: 'current' | 'requested') => {
    const conflictId = conflict.equipmentId;
    
    setResolvingConflicts(prev => {
      const newMap = new Map(prev);
      newMap.set(conflictId, resolution);
      return newMap;
    });
    
    try {
      await resolveConflict(conflict, resolution);
      setResolvedConflicts(prev => new Set(prev).add(conflictId));
      
      // Remove from resolved after animation
      setTimeout(() => {
        setResolvedConflicts(prev => {
          const newSet = new Set(prev);
          newSet.delete(conflictId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    } finally {
      setResolvingConflicts(prev => {
        const newMap = new Map(prev);
        newMap.delete(conflictId);
        return newMap;
      });
    }
  };

  return (
    <div className="space-y-4">
      <Alert className="border-amber-200 bg-muted">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-muted-foreground">
          <strong>{conflicts.length} equipment conflict{conflicts.length > 1 ? 's' : ''} detected.</strong>
          <br />
          Equipment is currently assigned to one job but requested by another. Choose where each piece of equipment should be assigned.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {conflicts.map((conflict) => {
          const resolvingResolution = resolvingConflicts.get(conflict.equipmentId);
          const isResolving = resolvingResolution !== undefined;
          const isResolved = resolvedConflicts.has(conflict.equipmentId);
          
          return (
          <div 
            key={conflict.equipmentId} 
            className={`
              border rounded-lg p-4 transition-all duration-300
              ${isResolved ? 'border-border bg-muted' : 'border-border bg-card'}
              ${isResolving ? 'opacity-75' : ''}
            `}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {conflict.equipmentName}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {conflict.equipmentId}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Conflict detected at {new Date(conflict.timestamp).toLocaleTimeString()}
                </div>
              </div>
              {isResolved && (
                <CheckCircle className="h-5 w-5 text-success animate-pulse" />
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Card className="p-2 bg-muted">
                <div className="text-xs font-medium text-muted-foreground mb-1">Currently Assigned To:</div>
                <div className="text-sm font-semibold text-foreground">{conflict.currentJobName}</div>
              </Card>
              <Card className="p-2 bg-muted">
                <div className="text-xs font-medium text-foreground mb-1">Requested By:</div>
                <div className="text-sm font-semibold text-primary">{conflict.requestedJobName}</div>
              </Card>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => handleResolve(conflict, 'current')}
                disabled={isResolving || isResolved}
                variant="secondary"
                className="flex-1 flex items-center justify-center gap-2"
              >
                {isResolving && resolvingResolution === 'current' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                Keep in {conflict.currentJobName}
              </Button>
              
              <Button
                onClick={() => handleResolve(conflict, 'requested')}
                disabled={isResolving || isResolved}
                className="flex-1 flex items-center justify-center gap-2"
              >
                {isResolving && resolvingResolution === 'requested' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Move to {conflict.requestedJobName}
              </Button>
            </div>
          </div>
          );
        })}
      </div>
      
      <Alert className="bg-muted border-border">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Tip:</strong> Resolving conflicts will automatically update the equipment status in both the inventory and job assignments. Changes are synced in real-time.
        </AlertDescription>
      </Alert>
    </div>
  );
};