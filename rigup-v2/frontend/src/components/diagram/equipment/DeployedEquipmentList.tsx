
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useUnifiedInventory } from '@/hooks/useUnifiedInventory';
import { useJobStorage } from '@/hooks/useJobStorage';
import { Briefcase, MapPin } from 'lucide-react';

interface DeployedEquipmentListProps {
  jobId: string;
}

const DeployedEquipmentList: React.FC<DeployedEquipmentListProps> = ({ jobId }) => {
  const { data, getDeployedEquipment: getDeployedEquipmentByJob } = useUnifiedInventory();
  const { jobs } = useJobStorage();

  const getEquipmentTypeName = (typeId: string) => {
    return data.equipmentTypes.find(type => type.id === typeId)?.name || 'Unknown';
  };

  const getLocationName = (locationId: string) => {
    return data.storageLocations.find(loc => loc.id === locationId)?.name || 'Unknown';
  };

  const getJobName = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    return job ? job.name : `Job ${jobId}`;
  };

  // Use unified inventory's deployment tracking
  const deployedEquipment = getDeployedEquipmentByJob(jobId);

  return (
    <div>
      <h4 className="text-sm font-medium mb-2">Equipment Deployed to Job</h4>
      {deployedEquipment.length === 0 ? (
        <p className="text-sm text-muted-foreground">No equipment currently deployed</p>
      ) : (
        <div className="space-y-2">
          {deployedEquipment.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-card border-border">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{item.name || getEquipmentTypeName(item.equipmentTypeId || item.typeId)}</span>
                  {item.equipmentId && <Badge variant="secondary">{item.equipmentId}</Badge>}
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    <span className="font-medium text-foreground">Job: {getJobName(jobId)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>From: {getLocationName(item.storageLocationId || item.locationId)}</span>
                  </div>
                  <div className="text-muted-foreground">
                    Deployed: {new Date(item.lastUpdatedDate || item.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="text-xs text-muted-foreground mt-2 p-2 bg-card rounded">
            💡 Equipment is automatically returned when job is deleted
          </div>
        </div>
      )}
    </div>
  );
};

export default DeployedEquipmentList;
