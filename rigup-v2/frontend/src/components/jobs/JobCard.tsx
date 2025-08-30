
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar, Edit2, Check, X, Clock, CheckCircle2 } from 'lucide-react';
import { JobDiagram } from '@/hooks/useJobs';
import { JobActionsMenu } from './JobActionsMenu';

interface DeployedEquipment {
  id: string;
  typeId: string;
  quantity: number;
  typeName: string;
}

interface JobCardProps {
  job: JobDiagram;
  deployedEquipment: DeployedEquipment[];
  onSelectJob: (job: JobDiagram) => void;
  onDeleteJob: (job: JobDiagram) => void;
  onCompleteJob?: (job: JobDiagram, endDate: string) => void;
  onUpdateJobName?: (jobId: string, newName: string) => void;
}

const JobCard: React.FC<JobCardProps> = ({
  job,
  deployedEquipment,
  onSelectJob,
  onDeleteJob,
  onCompleteJob,
  onUpdateJobName,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(job.name);
  const hasEquipment = deployedEquipment.length > 0;
  
  const handleSaveName = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editedName.trim() && editedName !== job.name && onUpdateJobName) {
      onUpdateJobName(job.id, editedName.trim());
    }
    setIsEditingName(false);
  };
  
  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedName(job.name);
    setIsEditingName(false);
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-shadow bg-card"
      onClick={() => onSelectJob(job)}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          {isEditingName ? (
            <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName(e as React.KeyboardEvent<HTMLInputElement>);
                  if (e.key === 'Escape') handleCancelEdit(e as React.KeyboardEvent<HTMLInputElement>);
                }}
                className="h-8 text-lg font-semibold"
                autoFocus
              />
              <Button size="sm" variant="ghost" onClick={handleSaveName}>
                <Check className="h-4 w-4 text-foreground" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                <X className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ) : (
            <>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="flex flex-col items-start">
                  <span>{job.name}</span>
                  <span className="text-sm font-medium text-foreground">
                    {job.client || <span className="text-muted-foreground italic">No client assigned</span>}
                  </span>
                </div>
                {onUpdateJobName && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingName(true);
                    }}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
              </CardTitle>
              <JobActionsMenu
                job={job}
                onCompleteJob={onCompleteJob || ((job, endDate) => onDeleteJob(job))}
                onDeleteJob={onDeleteJob}
              />
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Wells: {job.wellCount}</p>
          {job.hasWellsideGauge && <p>Wellside Gauge: Yes</p>}
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>Created: {job.createdAt ? 
              (job.createdAt instanceof Date ? 
                job.createdAt.toLocaleDateString() : 
                new Date(job.createdAt).toLocaleDateString()
              ) : 'N/A'}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Badge */}
            {job.status === 'completed' && (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
            {job.status === 'active' && (
              <Badge variant="default" className="bg-primary hover:bg-primary/80">
                <Clock className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
            {(!job.status || job.status === 'pending') && (
              <Badge variant="secondary">
                Pending
              </Badge>
            )}
            
            {/* Equipment Status */}
            {job.equipmentAllocated && (
              <Badge variant="outline" className="text-foreground">
                Equipment Allocated
              </Badge>
            )}
            {hasEquipment && (
              <Badge variant="outline" className="text-foreground">
                Equipment Deployed
              </Badge>
            )}
          </div>
          
          {/* Show dates if available */}
          {job.start_date && (
            <p className="text-xs">
              Started: {new Date(job.start_date).toLocaleString()}
            </p>
          )}
          {job.end_date && (
            <p className="text-xs">
              Ended: {new Date(job.end_date).toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default JobCard;
