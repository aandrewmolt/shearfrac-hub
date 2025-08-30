import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  PlayCircle, 
  PauseCircle, 
  CheckCircle2, 
  Clock,
  Calendar
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { JobDiagram } from '@/hooks/useJobs';

interface JobStatusControlProps {
  job: JobDiagram;
  onUpdateStatus: (updates: Partial<JobDiagram>) => void;
}

export const JobStatusControl: React.FC<JobStatusControlProps> = ({
  job,
  onUpdateStatus,
}) => {
  const [startDate, setStartDate] = useState(() => {
    if (job.start_date) {
      const date = new Date(job.start_date);
      return date.toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });
  
  const [startTime, setStartTime] = useState(() => {
    if (job.start_date) {
      const date = new Date(job.start_date);
      return date.toTimeString().split(' ')[0].substring(0, 5);
    }
    return new Date().toTimeString().split(' ')[0].substring(0, 5);
  });

  const handleStartJob = () => {
    const dateTime = `${startDate}T${startTime}:00`;
    onUpdateStatus({
      status: 'active',
      start_date: dateTime,
    });
  };

  const handleCompleteJob = () => {
    const now = new Date();
    onUpdateStatus({
      status: 'completed',
      end_date: now.toISOString(),
    });
  };

  const renderStatusBadge = () => {
    switch (job.status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-primary hover:bg-primary/90">
            <Clock className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="bg-success hover:bg-success/90">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="flex items-center gap-4">
      {renderStatusBadge()}
      
      {(!job.status || job.status === 'pending') && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <PlayCircle className="h-4 w-4 mr-2" />
              Start Job
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Start Job</h4>
                <p className="text-sm text-muted-foreground">
                  Set the start date and time for this job.
                </p>
              </div>
              <div className="grid gap-2">
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="start-date">Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="col-span-2"
                  />
                </div>
                <div className="grid grid-cols-3 items-center gap-4">
                  <Label htmlFor="start-time">Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="col-span-2"
                  />
                </div>
              </div>
              <Button onClick={handleStartJob} className="w-full">
                <PlayCircle className="h-4 w-4 mr-2" />
                Start Job
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
      
      {job.status === 'active' && (
        <Button 
          onClick={handleCompleteJob}
          variant="outline" 
          size="sm"
          className="text-foreground hover:text-foreground"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Complete Job
        </Button>
      )}
      
      {job.start_date && (
        <div className="text-sm text-muted-foreground">
          <Calendar className="h-3 w-3 inline mr-1" />
          Started: {new Date(job.start_date).toLocaleString()}
        </div>
      )}
      
      {job.end_date && (
        <div className="text-sm text-muted-foreground">
          <CheckCircle2 className="h-3 w-3 inline mr-1" />
          Completed: {new Date(job.end_date).toLocaleString()}
        </div>
      )}
    </div>
  );
};