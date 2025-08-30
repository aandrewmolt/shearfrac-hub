import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInventory } from '@/contexts/InventoryContext';
import { useJobs } from '@/hooks/useJobs';
import { Home, Briefcase, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isEquipmentAtLocation } from '@/utils/equipmentLocation';

interface LocationSummary {
  id: string;
  name: string;
  type: 'storage' | 'job';
  equipment: {
    [typeId: string]: {
      typeName: string;
      count: number;
      items: string[];
    }
  };
  extras?: string[];
}

export const EquipmentLocationOverview = () => {
  const { data } = useInventory();
  const { jobs } = useJobs();

  // Build location summaries
  const locationSummaries: LocationSummary[] = [];

  // Add storage locations
  data.storageLocations.forEach(location => {
    const summary: LocationSummary = {
      id: location.id,
      name: location.name,
      type: 'storage',
      equipment: {}
    };

    // Count equipment at this storage location using centralized logic
    data.individualEquipment
      .filter(item => isEquipmentAtLocation(item, location.id, 'storage'))
      .forEach(item => {
        const equipmentType = data.equipmentTypes.find(t => t.id === item.typeId);
        if (!equipmentType) return;

        if (!summary.equipment[item.typeId]) {
          summary.equipment[item.typeId] = {
            typeName: equipmentType.name,
            count: 0,
            items: []
          };
        }
        summary.equipment[item.typeId].count++;
        summary.equipment[item.typeId].items.push(item.equipmentId);
      });

    locationSummaries.push(summary);
  });

  // Add jobs
  jobs.forEach(job => {
    const summary: LocationSummary = {
      id: `job-${job.id}`,
      name: job.name,
      type: 'job',
      equipment: {},
      extras: job.extrasOnLocation || []
    };

    // Count equipment deployed to this job using centralized logic
    data.individualEquipment
      .filter(item => isEquipmentAtLocation(item, job.id, 'job'))
      .forEach(item => {
        const equipmentType = data.equipmentTypes.find(t => t.id === item.typeId);
        if (!equipmentType) return;

        if (!summary.equipment[item.typeId]) {
          summary.equipment[item.typeId] = {
            typeName: equipmentType.name,
            count: 0,
            items: []
          };
        }
        summary.equipment[item.typeId].count++;
        summary.equipment[item.typeId].items.push(item.equipmentId);
      });

    locationSummaries.push(summary);
  });

  // Get all equipment types for column headers
  const allEquipmentTypes = data.equipmentTypes;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Equipment Location Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10 min-w-[200px]">
                    Location/Job
                  </TableHead>
                  {allEquipmentTypes.map(type => (
                    <TableHead key={type.id} className="text-center min-w-[120px]">
                      <div className="flex items-center justify-center gap-1">
                        <Package className="h-3 w-3" />
                        {type.name}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center min-w-[100px]">Extras</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locationSummaries.map(location => (
                  <TableRow key={location.id}>
                    <TableCell className="sticky left-0 bg-background z-10 font-medium">
                      <div className="flex items-center gap-2">
                        {location.type === 'job' ? 
                          <Briefcase className="h-4 w-4 text-blue-500" /> : 
                          <Home className="h-4 w-4 text-green-500" />
                        }
                        {location.name}
                      </div>
                    </TableCell>
                    {allEquipmentTypes.map(type => {
                      const equipment = location.equipment[type.id];
                      return (
                        <TableCell key={type.id} className="text-center">
                          {equipment ? (
                            <div>
                              <Badge variant="outline" className="mb-1">
                                {equipment.count}
                              </Badge>
                              <details className="text-xs">
                                <summary className="cursor-pointer text-muted-foreground">
                                  View IDs
                                </summary>
                                <div className="mt-1 text-left max-h-32 overflow-y-auto">
                                  {equipment.items.sort().join(', ')}
                                </div>
                              </details>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center">
                      {location.extras && location.extras.length > 0 ? (
                        <div>
                          <Badge variant="secondary">
                            {location.extras.length}
                          </Badge>
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground">
                              View
                            </summary>
                            <div className="mt-1 text-left">
                              {location.extras.join(', ')}
                            </div>
                          </details>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};