
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { MapPin, Package, Briefcase, Calendar } from 'lucide-react';
import { useUnifiedInventory } from '@/hooks/useUnifiedInventory';
import { useJobStorage } from '@/hooks/useJobStorage';
import { isEquipmentAtLocation } from '@/utils/equipmentLocation';

const JobDeploymentsSummary = () => {
  const { data } = useUnifiedInventory();
  const { jobs } = useJobStorage();

  // Get all deployed individual equipment items grouped by job
  const deployedByJob = data.individualEquipment
    .filter(item => item.status === 'deployed' && item.jobId)
    .reduce((acc, item) => {
      // Verify equipment is actually at the job using centralized logic
      const jobsWithEquipment = jobs.filter(job => isEquipmentAtLocation(item, job.id, 'job'));
      if (jobsWithEquipment.length === 0) return acc;
      
      const jobId = jobsWithEquipment[0].id;
      if (!acc[jobId]) {
        acc[jobId] = [];
      }
      acc[jobId].push(item);
      return acc;
    }, {} as Record<string, typeof data.individualEquipment>);

  const getJobDetails = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    return job ? {
      name: job.name,
      wellCount: job.wellCount,
      hasWellsideGauge: job.hasWellsideGauge,
      createdAt: job.createdAt
    } : {
      name: `Job ${jobId}`,
      wellCount: 0,
      hasWellsideGauge: false,
      createdAt: new Date()
    };
  };

  const getEquipmentTypeName = (typeId: string) => {
    return data.equipmentTypes.find(type => type.id === typeId)?.name || 'Unknown';
  };

  const getLocationName = (locationId: string) => {
    return data.storageLocations.find(loc => loc.id === locationId)?.name || 'Unknown';
  };

  const activeJobsWithEquipment = Object.keys(deployedByJob);

  if (activeJobsWithEquipment.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Job Equipment Deployments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-corporate-silver">
            <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p>No equipment currently deployed to jobs</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Active Job Deployments
          <Badge variant="outline" className="ml-auto">
            {activeJobsWithEquipment.length} Jobs
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeJobsWithEquipment.map(jobId => {
            const jobEquipment = deployedByJob[jobId];
            const jobDetails = getJobDetails(jobId);
            const totalPieces = jobEquipment.length;
            const uniqueTypes = new Set(jobEquipment.map(item => item.typeId)).size;
            const sourceLocations = new Set(jobEquipment.map(item => item.locationId));

            return (
              <Alert key={jobId} className="bg-primary/5 border-border">
                <AlertDescription>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-primary">{jobDetails.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-foreground mt-1">
                      <span>{jobDetails.wellCount} wells</span>
                      {jobDetails.hasWellsideGauge && <span>+ wellside gauge</span>}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{jobDetails.createdAt ? jobDetails.createdAt.toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">
                      {totalPieces} pieces
                    </Badge>
                    <Badge variant="outline">
                      {uniqueTypes} types
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {jobEquipment.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-card rounded border">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {item.name || getEquipmentTypeName(item.typeId)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-corporate-silver mt-1">
                          <MapPin className="h-3 w-3" />
                          <span>From: {getLocationName(item.locationId)}</span>
                        </div>
                        {item.equipmentId && (
                          <div className="text-xs text-corporate-silver mt-1">
                            ID: {item.equipmentId}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {sourceLocations.size > 1 && (
                  <>
                    <Separator className="my-3" />
                    <div className="text-sm text-foreground">
                      <span className="font-medium">Sources:</span> {
                        sourceLocations ? Array.from(sourceLocations).map(locId => getLocationName(locId)).join(', ') : ''
                      }
                    </div>
                  </>
                )}
                </AlertDescription>
              </Alert>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default JobDeploymentsSummary;
