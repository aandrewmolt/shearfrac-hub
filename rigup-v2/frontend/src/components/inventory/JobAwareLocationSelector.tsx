
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase } from 'lucide-react';
import { useJobLocationIntegration } from '@/hooks/useJobLocationIntegration';

interface JobAwareLocationSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showJobs?: boolean;
  showStorageLocations?: boolean;
}

const JobAwareLocationSelector: React.FC<JobAwareLocationSelectorProps> = ({
  value,
  onValueChange,
  placeholder = "Select location",
  disabled = false,
  showJobs = true,
  showStorageLocations = true
}) => {
  const { storageLocations, jobLocations, getLocationName } = useJobLocationIntegration();

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder}>
          {value ? getLocationName(value) : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {/* Storage Locations */}
        {showStorageLocations && storageLocations.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Storage Locations
            </div>
            {storageLocations.map((location) => (
              <SelectItem key={`storage-${location.id}`} value={location.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{location.name}</span>
                  {location.isDefault && (
                    <Badge variant="outline" className="text-xs ml-2">
                      Default
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </>
        )}
        
        {/* Job Locations */}
        {showJobs && jobLocations.length > 0 && (
          <>
            {showStorageLocations && storageLocations.length > 0 && (
              <div className="border-t my-1" />
            )}
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              Job Sites ({jobLocations.length} active)
            </div>
            {jobLocations.map((job) => (
              <SelectItem key={`job-${job.id}`} value={job.id}>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-3 w-3 text-foreground" />
                  <span>{job.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    Job Site
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </>
        )}
      </SelectContent>
    </Select>
  );
};

export default JobAwareLocationSelector;
