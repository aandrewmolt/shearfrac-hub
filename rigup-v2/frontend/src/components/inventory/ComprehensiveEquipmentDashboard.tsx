import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInventory } from '@/contexts/InventoryContext';
import { useJobs } from '@/hooks/useJobs';
import { Package, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ComprehensiveEquipmentDashboard: React.FC = () => {
  const { data } = useInventory();
  const { jobs } = useJobs();
  const navigate = useNavigate();

  // Group equipment by job and type
  const equipmentByJob: Record<string, {
    jobName: string;
    equipment: unknown[];
  }> = {};

  // Initialize with all jobs
  jobs.forEach(job => {
    equipmentByJob[job.id] = {
      jobName: job.name,
      equipment: []
    };
  });

  // Add storage locations
  data.storageLocations.forEach(location => {
    equipmentByJob[location.id] = {
      jobName: location.name,
      equipment: []
    };
  });

  // Process individual equipment
  data.individualEquipment.forEach(item => {
    // Check if equipment is deployed to a job
    if (item.status === 'deployed' && item.jobId) {
      const jobKey = item.jobId;
      if (!equipmentByJob[jobKey]) {
        const job = jobs.find(j => j.id === jobKey);
        equipmentByJob[jobKey] = {
          jobName: job?.name || `Job ${jobKey}`,
          equipment: []
        };
      }
      equipmentByJob[jobKey].equipment.push(item);
    } else {
      // Equipment at storage location
      const locationKey = item.locationId || 'unassigned';
      if (!equipmentByJob[locationKey]) {
        equipmentByJob[locationKey] = {
          jobName: 'Unassigned',
          equipment: []
        };
      }
      equipmentByJob[locationKey].equipment.push(item);
    }
  });

  // Get equipment type details
  const getEquipmentType = (typeId: string) => {
    return data.equipmentTypes.find(t => t.id === typeId);
  };

  // Calculate totals
  const calculateTotals = () => {
    const totalEquipment = data.individualEquipment.length;
    const deployedEquipment = data.individualEquipment.filter(item => item.status === 'deployed').length;

    return { totalEquipment, deployedEquipment };
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalEquipment}</div>
            <div className="text-xs text-muted-foreground">
              {totals.deployedEquipment} deployed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.length}</div>
            <div className="text-xs text-muted-foreground">
              {jobs.filter(j => j.equipmentAllocated).length} with equipment
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Storage Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.storageLocations.length}</div>
            <div className="text-xs text-muted-foreground">
              {data.storageLocations.filter(l => l.isDefault).length} default
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment by Location/Job */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Location/Job</TableHead>
                <TableHead className="w-[150px]">Equipment Type</TableHead>
                <TableHead className="w-[80px]">Quantity</TableHead>
                <TableHead>Equipment IDs</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(equipmentByJob).flatMap(([locationId, data]) => {
                const equipmentCount = data.equipment.length;
                
                if (equipmentCount === 0) return [];

                const isJob = jobs.some(j => j.id === locationId);
                
                // Group equipment by type
                const groupedEquipment = data.equipment.reduce((acc, item) => {
                  const type = getEquipmentType(item.typeId);
                  const typeName = type?.name || item.typeId;
                  if (!acc[typeName]) acc[typeName] = [];
                  acc[typeName].push(item);
                  return acc;
                }, {} as Record<string, Array<{ id: string; name: string; equipmentId: string; status: string; }>>);
                
                // Create a row for each equipment type at this location
                return Object.entries(groupedEquipment).map(([typeName, items], index) => (
                  <TableRow key={`${locationId}-${typeName}`}>
                    {index === 0 && (
                      <TableCell rowSpan={Object.keys(groupedEquipment).length} className="align-top">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="font-medium">{data.jobName}</span>
                          {isJob && <Badge variant="outline" className="ml-2">Job</Badge>}
                        </div>
                      </TableCell>
                    )}
                    <TableCell>{typeName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{items.length}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {items.map(i => (
                          <Badge key={i.id} variant="secondary" className="text-xs">
                            {i.equipmentId}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    {index === 0 && (
                      <TableCell rowSpan={Object.keys(groupedEquipment).length} className="align-top">
                        {isJob && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/jobs?edit=${locationId}`)}
                          >
                            View Job
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ));
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
};

export default ComprehensiveEquipmentDashboard;