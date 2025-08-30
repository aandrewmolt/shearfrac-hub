
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { StoredJob } from '@/hooks/useJobStorage';

interface JobHeaderProps {
  job: StoredJob;
  onDeleteJob: (job: StoredJob) => void;
  onBackToJobs: () => void;
}

const JobHeader: React.FC<JobHeaderProps> = ({ job, onDeleteJob, onBackToJobs }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{job.name}</h1>
        <p className="text-muted-foreground">
          Wells: {job.wellCount} 
          {job.hasWellsideGauge && ' | Wellside Gauge: Yes'}
          <Badge variant="outline" className="ml-2">
            {job.status}
          </Badge>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          onClick={() => onDeleteJob(job)}
          variant="outline"
          className="bg-muted text-destructive hover:bg-muted"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Job
        </Button>
        <Button 
          onClick={onBackToJobs}
          variant="outline"
          className="bg-card"
        >
          Back to Jobs
        </Button>
      </div>
    </div>
  );
};

export default JobHeader;
