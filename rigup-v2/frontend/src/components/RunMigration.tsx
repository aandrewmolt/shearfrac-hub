import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { cleanupDeploymentRecords, needsDeploymentCleanup } from '@/lib/turso/migrations/cleanupDeploymentRecords';
import { Database } from 'lucide-react';

export const RunMigration: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [needsCleanup, setNeedsCleanup] = useState<boolean | null>(null);

  const checkCleanupStatus = async () => {
    try {
      const needed = await needsDeploymentCleanup();
      setNeedsCleanup(needed);
      if (!needed) {
        toast.success('No deployment cleanup needed');
      }
    } catch (error) {
      console.error('Failed to check cleanup status:', error);
      toast.error('Failed to check cleanup status');
    }
  };

  const runCleanup = async () => {
    setIsRunning(true);
    try {
      await cleanupDeploymentRecords();
      setNeedsCleanup(false);
      toast.success('Deployment cleanup completed');
    } catch (error) {
      console.error('Failed to run cleanup:', error);
      toast.error('Failed to run deployment cleanup');
    } finally {
      setIsRunning(false);
    }
  };

  React.useEffect(() => {
    checkCleanupStatus();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Migration
        </CardTitle>
        <CardDescription>
          Clean up old deployment records from the equipment_items table
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          This migration will clean up deployment records that were incorrectly stored in the equipment_items table
          and return the quantities to their source locations.
        </div>
        
        {needsCleanup !== null && (
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-sm font-medium">
              Status: {needsCleanup ? 'Cleanup needed' : 'No cleanup required'}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={checkCleanupStatus}
            variant="outline"
            disabled={isRunning}
          >
            Check Status
          </Button>
          <Button
            onClick={runCleanup}
            disabled={isRunning || needsCleanup === false}
          >
            {isRunning ? 'Running...' : 'Run Cleanup'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};