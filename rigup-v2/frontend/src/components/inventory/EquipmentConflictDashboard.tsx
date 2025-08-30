/**
 * Equipment Conflict Dashboard
 * Global view of all equipment conflicts across the system
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Settings } from 'lucide-react';
import EquipmentConflictResolver from '@/components/shared/EquipmentConflictResolver';

export default function EquipmentConflictDashboard() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Equipment Conflict Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This dashboard helps you identify and resolve equipment allocation conflicts across all jobs.
              Conflicts can occur when equipment is assigned to multiple jobs, has incorrect status, or is orphaned.
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Conflict Types
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li><strong>Multiple Job Allocation:</strong> Equipment assigned to more than one job</li>
                <li><strong>Status Mismatch:</strong> Equipment status doesn't match job assignment</li>
                <li><strong>Orphaned Equipment:</strong> Equipment assigned to non-existent jobs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <EquipmentConflictResolver 
        showAll={true}
        className="w-full"
      />
    </div>
  );
}